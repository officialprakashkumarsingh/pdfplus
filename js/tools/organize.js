import { toggleLoader, showToast } from '../ui.js';
import { state } from '../state.js';

const { PDFDocument, degrees } = window.PDFLib;

let pagesState = []; // { originalIndex, rotation, deleted }
let pdfDocProxy = null; // PDF.js document

export async function initOrganize() {
    const file = state.selectedFiles['organize'][0];
    if (!file) return;

    try {
        toggleLoader(true, "Loading Pages...");
        const arrayBuffer = await file.arrayBuffer();
        pdfDocProxy = await pdfjsLib.getDocument(arrayBuffer).promise;

        pagesState = [];
        for(let i=0; i<pdfDocProxy.numPages; i++) {
            pagesState.push({ originalIndex: i, rotation: 0, deleted: false });
        }

        document.getElementById('organizeUpload').classList.add('hidden');
        document.getElementById('organizeContainer').classList.remove('hidden');

        await renderOrganizeGrid();

    } catch(e) {
        console.error(e);
        showToast("Failed to load PDF", true);
    } finally {
        toggleLoader(false);
    }
}

async function renderOrganizeGrid() {
    const container = document.getElementById('organizeContainer');
    container.innerHTML = '';

    for (let i = 0; i < pagesState.length; i++) {
        const pageState = pagesState[i];
        if (pageState.deleted) continue;

        const div = document.createElement('div');
        div.className = "bg-white p-2 rounded-lg shadow-sm border border-gray-100 flex flex-col gap-2 relative group";

        // Thumbnail Canvas
        const canvas = document.createElement('canvas');
        canvas.className = "w-full rounded border border-gray-100 bg-gray-50";
        div.appendChild(canvas);

        // Render Async
        renderThumbnail(pageState.originalIndex + 1, canvas, pageState.rotation);

        // Actions Overlay
        const actions = document.createElement('div');
        actions.className = "flex items-center justify-center gap-2 mt-1";

        // Rotate
        const rotBtn = document.createElement('button');
        rotBtn.innerHTML = `<i data-lucide="rotate-cw" class="w-4 h-4"></i>`;
        rotBtn.className = "p-1.5 rounded-full hover:bg-gray-100 text-gray-600";
        rotBtn.onclick = () => rotatePage(i);

        // Delete
        const delBtn = document.createElement('button');
        delBtn.innerHTML = `<i data-lucide="trash-2" class="w-4 h-4"></i>`;
        delBtn.className = "p-1.5 rounded-full hover:bg-red-50 text-red-500";
        delBtn.onclick = () => deletePage(i);

        // Move Left
        const leftBtn = document.createElement('button');
        leftBtn.innerHTML = `<i data-lucide="arrow-left" class="w-4 h-4"></i>`;
        leftBtn.className = "p-1.5 rounded-full hover:bg-gray-100 text-gray-600 disabled:opacity-30";
        leftBtn.onclick = () => movePage(i, -1);
        if (i === 0) leftBtn.disabled = true;

        // Move Right
        const rightBtn = document.createElement('button');
        rightBtn.innerHTML = `<i data-lucide="arrow-right" class="w-4 h-4"></i>`;
        rightBtn.className = "p-1.5 rounded-full hover:bg-gray-100 text-gray-600 disabled:opacity-30";
        rightBtn.onclick = () => movePage(i, 1);
        if (i === pagesState.length - 1) rightBtn.disabled = true;

        actions.appendChild(leftBtn);
        actions.appendChild(rotBtn);
        actions.appendChild(delBtn);
        actions.appendChild(rightBtn);
        div.appendChild(actions);

        // Page Number
        const num = document.createElement('span');
        num.innerText = pageState.originalIndex + 1;
        num.className = "absolute top-2 left-2 bg-gray-900/50 text-white text-[10px] px-1.5 py-0.5 rounded";
        div.appendChild(num);

        container.appendChild(div);
    }
    lucide.createIcons();
}

async function renderThumbnail(pageIndex, canvas, rotation) {
    try {
        const page = await pdfDocProxy.getPage(pageIndex);
        const viewport = page.getViewport({ scale: 0.3, rotation: rotation * 90 }); // pdf.js rotation is in degrees
        // pdf.js expects rotation to be multiple of 90.
        // Wait, viewport rotation is additive to page rotation.
        // My state rotation is 0, 1, 2, 3 (x90).

        // Actually, let's just rotate the canvas via CSS or handle it in viewport.
        // Viewport rotation param: 0, 90, 180, 270.
        const currentRotation = (rotation * 90) % 360;
        const finalViewport = page.getViewport({ scale: 0.3, rotation: currentRotation });

        canvas.width = finalViewport.width;
        canvas.height = finalViewport.height;

        await page.render({
            canvasContext: canvas.getContext('2d'),
            viewport: finalViewport
        }).promise;
    } catch(e) {
        console.error(e);
    }
}

export function rotatePage(index) {
    pagesState[index].rotation = (pagesState[index].rotation + 1) % 4;
    renderOrganizeGrid(); // Re-render to show rotation
}

export function deletePage(index) {
    // Actually remove from array? Or mark deleted.
    // If I remove, indices shift. Better to remove from array.
    pagesState.splice(index, 1);
    renderOrganizeGrid();
}

export function movePage(index, dir) {
    if (index + dir < 0 || index + dir >= pagesState.length) return;
    const temp = pagesState[index];
    pagesState[index] = pagesState[index + dir];
    pagesState[index + dir] = temp;
    renderOrganizeGrid();
}

export async function processOrganize() {
    try {
        toggleLoader(true, "Saving PDF...");
        const file = state.selectedFiles['organize'][0];
        const arrayBuffer = await file.arrayBuffer();
        const srcDoc = await PDFDocument.load(arrayBuffer);
        const destDoc = await PDFDocument.create();

        // Copy pages based on pagesState
        // indices need to be the original indices
        const indicesToCopy = pagesState.map(p => p.originalIndex);

        // We can't use copyPages with duplicates easily if we wanted, but here we just reorder/subset.
        // Actually copyPages takes an array of indices.
        // It returns an array of copied pages.

        if (indicesToCopy.length === 0) throw new Error("No pages left!");

        const copiedPages = await destDoc.copyPages(srcDoc, indicesToCopy);

        for (let i = 0; i < copiedPages.length; i++) {
            const page = copiedPages[i];
            const stateRot = pagesState[i].rotation * 90;
            const existingRot = page.getRotation().angle;
            page.setRotation(degrees(existingRot + stateRot));
            destDoc.addPage(page);
        }

        const pdfBytes = await destDoc.save();
        download(pdfBytes, `organized-${file.name}`, "application/pdf");
        showToast("PDF Organized! 🗂️");

    } catch(e) {
        console.error(e);
        showToast("Error Saving", true);
    } finally {
        toggleLoader(false);
    }
}
