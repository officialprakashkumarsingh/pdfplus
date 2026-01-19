import { toggleLoader, showToast, showHome } from '../ui.js';
import { state } from '../state.js';

const { PDFDocument } = window.PDFLib;

let stream = null;
let scannedImages = []; // Array of dataURLs
let videoEl = null;

export async function initScanner() {
    videoEl = document.getElementById('scannerVideo');
    const overlay = document.getElementById('scannerOverlay');
    const btnFinish = document.getElementById('btn-finish-scan');

    scannedImages = [];
    updateScanCount();

    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
        });
        videoEl.srcObject = stream;
        overlay.classList.remove('hidden');
        btnFinish.disabled = true;
    } catch(e) {
        console.error(e);
        showToast("Camera access denied", true);
        showHome();
    }
}

export function stopScanner() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    if (videoEl) videoEl.srcObject = null;
}

export async function captureScan() {
    if (!stream) return;

    // Flash Effect
    const flash = document.getElementById('scanFlash');
    flash.style.opacity = '0.8';
    setTimeout(() => flash.style.opacity = '0', 100);

    // Capture Frame
    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    const ctx = canvas.getContext('2d');

    // Draw
    ctx.drawImage(videoEl, 0, 0);

    // Simple "Document Filter" - High Contrast / Grayscaleish logic could go here
    // For now, raw capture.

    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    scannedImages.push(dataUrl);
    updateScanCount();

    showToast("Scanned!");
}

function updateScanCount() {
    const badge = document.getElementById('scanCount');
    const btn = document.getElementById('btn-finish-scan');
    badge.innerText = scannedImages.length;

    if (scannedImages.length > 0) {
        badge.classList.remove('hidden');
        badge.classList.add('flex');
        btn.disabled = false;
        btn.classList.remove('bg-gray-400');
        btn.classList.add('bg-blue-500');
    } else {
        badge.classList.add('hidden');
        badge.classList.remove('flex');
        btn.disabled = true;
        btn.classList.add('bg-gray-400');
        btn.classList.remove('bg-blue-500');
    }
}

export async function finishScan() {
    if (scannedImages.length === 0) return;
    stopScanner(); // Stop camera

    try {
        toggleLoader(true, "Creating PDF...");
        const pdfDoc = await PDFDocument.create();

        for (const imgUrl of scannedImages) {
            const img = await pdfDoc.embedJpg(imgUrl);
            const page = pdfDoc.addPage([img.width, img.height]);
            page.drawImage(img, {
                x: 0,
                y: 0,
                width: img.width,
                height: img.height,
            });
        }

        const pdfBytes = await pdfDoc.save();
        download(pdfBytes, "scanned-document.pdf", "application/pdf");
        showToast("Document Saved! 📄");
        showHome();

    } catch(e) {
        console.error(e);
        showToast("Error Saving PDF", true);
    } finally {
        toggleLoader(false);
    }
}
