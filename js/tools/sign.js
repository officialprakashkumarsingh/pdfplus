import { toggleLoader, showToast } from '../ui.js';
import { state } from '../state.js';

const { PDFDocument } = window.PDFLib;

let isDrawing = false;
let signCanvas, signCtx;

export function initSignaturePad() {
    signCanvas = document.getElementById('signatureCanvas');
    signCtx = signCanvas.getContext('2d');

    // Resize
    signCanvas.width = signCanvas.offsetWidth;
    signCanvas.height = signCanvas.offsetHeight;

    signCtx.lineWidth = 2;
    signCtx.lineCap = 'round';
    signCtx.strokeStyle = '#000000';

    // Events
    signCanvas.addEventListener('mousedown', startDraw);
    signCanvas.addEventListener('mousemove', draw);
    signCanvas.addEventListener('mouseup', stopDraw);
    signCanvas.addEventListener('mouseout', stopDraw);

    // Touch
    signCanvas.addEventListener('touchstart', (e) => { e.preventDefault(); startDraw(e.touches[0]); });
    signCanvas.addEventListener('touchmove', (e) => { e.preventDefault(); draw(e.touches[0]); });
    signCanvas.addEventListener('touchend', stopDraw);
}

function startDraw(e) {
    isDrawing = true;
    const rect = signCanvas.getBoundingClientRect();
    signCtx.beginPath();
    signCtx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
}

function draw(e) {
    if (!isDrawing) return;
    const rect = signCanvas.getBoundingClientRect();
    signCtx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    signCtx.stroke();
}

function stopDraw() {
    isDrawing = false;
}

export function clearSignature() {
    signCtx.clearRect(0, 0, signCanvas.width, signCanvas.height);
}

export async function processSign() {
    try {
        const file = state.selectedFiles['sign'][0];
        // Check if signed
        // We can't easily check if canvas is empty without getImageData loop, assume user signed if they clicked button.
        // But better:

        const signData = signCanvas.toDataURL('image/png');

        toggleLoader(true, "Signing...");
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);

        const img = await pdfDoc.embedPng(signData);
        const pages = pdfDoc.getPages();

        // Place on last page, bottom right by default
        const lastPage = pages[pages.length - 1];
        const { width } = lastPage.getSize();

        // Scale signature
        const dims = img.scale(0.5);

        lastPage.drawImage(img, {
            x: width - dims.width - 20,
            y: 20,
            width: dims.width,
            height: dims.height,
        });

        const pdfBytes = await pdfDoc.save();
        download(pdfBytes, `signed-${file.name}`, "application/pdf");
        showToast("Signed! ✒️");

    } catch(e) {
        console.error(e);
        showToast("Error", true);
    } finally {
        toggleLoader(false);
    }
}
