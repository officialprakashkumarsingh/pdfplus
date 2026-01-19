import { toggleLoader, showToast } from '../ui.js';
import { state } from '../state.js';

let pdfDoc = null;
let pageNum = 1;
let scale = 1.0;
let canvas = null;
let ctx = null;

let isFlipMode = false;
let pageFlip = null;

export async function renderViewer() {
    const file = state.selectedFiles['viewer'][0];
    if (!file) return;

    try {
        toggleLoader(true, "Opening PDF...");
        const arrayBuffer = await file.arrayBuffer();
        pdfDoc = await pdfjsLib.getDocument(arrayBuffer).promise;
        pageNum = 1;
        scale = 1.0;

        document.getElementById('viewerPlaceholder').classList.add('hidden');
        canvas = document.getElementById('pdfViewerCanvas');
        ctx = canvas.getContext('2d');

        // Reset modes
        exitFlipMode();

        canvas.classList.remove('hidden');
        await renderPage();

    } catch (e) {
        console.error(e);
        showToast("Failed to open PDF", true);
    } finally {
        toggleLoader(false);
    }
}

async function renderPage() {
    if (!pdfDoc) return;

    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: scale });

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
        canvasContext: ctx,
        viewport: viewport
    };

    await page.render(renderContext).promise;

    document.getElementById('pageInfo').innerText = `Page ${pageNum} / ${pdfDoc.numPages}`;
}

export async function changePage(offset) {
    if (!pdfDoc) return;

    if (isFlipMode && pageFlip) {
         if (offset > 0) pageFlip.flipNext();
         else pageFlip.flipPrev();
         return;
    }

    const newPage = pageNum + offset;
    if (newPage >= 1 && newPage <= pdfDoc.numPages) {
        pageNum = newPage;
        await renderPage();
    }
}

export async function changeZoom(delta) {
    if (!pdfDoc || isFlipMode) return; // Zoom disabled in flip mode for simplicity
    const newScale = scale + delta;
    if (newScale >= 0.5 && newScale <= 3.0) {
        scale = newScale;
        await renderPage();
    }
}

export async function toggleFlipMode() {
    if (!pdfDoc) return;

    const btn = document.getElementById('btnFlipMode');
    const container = document.getElementById('viewerContainer');
    const flipContainer = document.getElementById('flipBookContainer');

    if (isFlipMode) {
        // Exit Flip Mode
        exitFlipMode();
    } else {
        // Enter Flip Mode
        isFlipMode = true;
        btn.classList.add('bg-teal-100', 'text-teal-700');
        canvas.classList.add('hidden');
        flipContainer.classList.remove('hidden');

        toggleLoader(true, "Building Book...");

        try {
            // Render all pages to images/canvas for the flipbook
            // Limit to reasonable number to avoid crash
            const maxPages = Math.min(pdfDoc.numPages, 50);

            // Clear container
            flipContainer.innerHTML = '';

            // Setup PageFlip
            // We need a wrapper div for PageFlip to target?
            // PageFlip expects a parent element.

            // Get page dimensions from first page
            const p1 = await pdfDoc.getPage(1);
            const vp = p1.getViewport({scale: 0.8}); // Slightly smaller

            pageFlip = new St.PageFlip(flipContainer, {
                width: vp.width,
                height: vp.height,
                size: 'fixed',
                maxShadowOpacity: 0.5,
                showCover: true,
                mobileScrollSupport: false // Disable mobile scroll to prevent interference
            });

            // Create page elements
            for(let i=1; i<=maxPages; i++) {
                const page = await pdfDoc.getPage(i);
                const viewport = page.getViewport({scale: 0.8});

                const div = document.createElement('div');
                div.className = "page bg-white border-r border-gray-200 shadow-inner";
                div.style.backgroundColor = "white"; // Ensure white bg

                // Canvas for content
                const cvs = document.createElement('canvas');
                cvs.width = viewport.width;
                cvs.height = viewport.height;

                await page.render({
                    canvasContext: cvs.getContext('2d'),
                    viewport
                }).promise;

                div.appendChild(cvs);
                // Page Number
                const num = document.createElement('div');
                num.className = "absolute bottom-2 w-full text-center text-xs text-gray-400";
                num.innerText = i;
                div.appendChild(num);

                pageFlip.loadFromHTML(document.querySelectorAll('.page')); // This might be wrong usage.
                // PageFlip usually takes an element in constructor or uses .loadFromImages / .loadFromHTML
                // Correct usage: Create elements inside container FIRST, then init?
                // Or use .loadFromHTML with node list.

                // Let's retry: Append all divs to container, THEN init/load.
            }

            // Re-approach:
            // 1. Destroy if exists
            // 2. Add divs to flipContainer
            // 3. Init PageFlip

            // Actually PageFlip is complex. Let's do simple approach:
            // The library requires elements to be in DOM.

            flipContainer.innerHTML = ''; // Clear
             for(let i=1; i<=maxPages; i++) {
                const div = document.createElement('div');
                div.className = "page"; // Class for targeting
                div.style.backgroundColor = "white";
                flipContainer.appendChild(div);

                // Async Render
                renderPageToDiv(i, div);
            }

            pageFlip = new St.PageFlip(flipContainer, {
                 width: vp.width,
                 height: vp.height,
                 size: 'fixed'
            });

            pageFlip.loadFromHTML(document.querySelectorAll('#flipBookContainer .page'));

            // Sync page num
            pageFlip.on('flip', (e) => {
                document.getElementById('pageInfo').innerText = `Page ${e.data + 1} / ${pdfDoc.numPages}`;
            });

            // Goto current
            // pageFlip.turnToPage(pageNum - 1);

        } catch(e) {
            console.error(e);
            showToast("Flip Mode Failed", true);
            exitFlipMode();
        } finally {
            toggleLoader(false);
        }
    }
}

async function renderPageToDiv(num, div) {
    try {
        const page = await pdfDoc.getPage(num);
        const viewport = page.getViewport({scale: 0.8});
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({canvasContext: canvas.getContext('2d'), viewport}).promise;
        div.appendChild(canvas);
    } catch(e) {}
}

function exitFlipMode() {
    isFlipMode = false;
    const btn = document.getElementById('btnFlipMode');
    if(btn) btn.classList.remove('bg-teal-100', 'text-teal-700');

    if(pageFlip) {
        pageFlip.destroy();
        pageFlip = null;
    }

    document.getElementById('flipBookContainer').classList.add('hidden');
    document.getElementById('flipBookContainer').innerHTML = '';

    if(canvas) canvas.classList.remove('hidden');

    // Restore zoom controls availability visual (logic handles it)
}
