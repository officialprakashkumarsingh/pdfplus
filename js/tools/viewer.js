import { toggleLoader, showToast } from '../ui.js';
import { state } from '../state.js';

let pdfDoc = null;
let pageNum = 1;
let scale = 1.0;
let canvas = null;
let ctx = null;

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
        canvas.classList.remove('hidden');
        ctx = canvas.getContext('2d');

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
    const newPage = pageNum + offset;
    if (newPage >= 1 && newPage <= pdfDoc.numPages) {
        pageNum = newPage;
        await renderPage();
    }
}

export async function changeZoom(delta) {
    if (!pdfDoc) return;
    const newScale = scale + delta;
    if (newScale >= 0.5 && newScale <= 3.0) {
        scale = newScale;
        await renderPage();
    }
}
