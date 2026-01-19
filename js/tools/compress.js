import { toggleLoader, showToast } from '../ui.js';
import { state } from '../state.js';

const { PDFDocument } = window.PDFLib;

export async function processCompress() {
    try {
        const file = state.selectedFiles['compress'][0];
        const quality = parseFloat(document.getElementById('compressLevel').value);

        toggleLoader(true, "Compressing...", "This may take a while");

        const arrayBuffer = await file.arrayBuffer();
        const srcPdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        const newPdf = await PDFDocument.create();

        for (let i = 1; i <= srcPdf.numPages; i++) {
            const page = await srcPdf.getPage(i);
            // Render to canvas at 1.5 scale (decent quality but lower than print)
            // Lower quality means smaller image
            const scale = 1.5;
            const viewport = page.getViewport({ scale });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({
                canvasContext: canvas.getContext('2d'),
                viewport
            }).promise;

            // Compress to JPEG
            // Quality maps: 0.1 (High compression) to 0.9 (Low compression)
            // UI Slider: 0.1 (Low Size/High Comp) -> 0.9 (High Size/Low Comp)
            // Wait, usually slider 'Low' means 'Low Compression/High Quality'?
            // Let's assume slider value IS the jpeg quality.
            const imgData = canvas.toDataURL('image/jpeg', quality);
            const img = await newPdf.embedJpg(imgData);

            const newPage = newPdf.addPage([viewport.width/scale, viewport.height/scale]); // Maintain original size dimensions
            newPage.drawImage(img, {
                x: 0,
                y: 0,
                width: viewport.width/scale,
                height: viewport.height/scale
            });
        }

        const pdfBytes = await newPdf.save();
        download(pdfBytes, `compressed-${file.name}`, "application/pdf");
        showToast("Compressed! 📦");

    } catch(e) {
        console.error(e);
        showToast("Compression Failed", true);
    } finally {
        toggleLoader(false);
    }
}
