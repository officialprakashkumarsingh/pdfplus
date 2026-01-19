import { toggleLoader, showToast } from '../ui.js';
import { state } from '../state.js';

const { PDFDocument, rgb, degrees } = window.PDFLib;

export async function processWatermark() {
    try {
        toggleLoader(true, "Stamping PDF...");
        const file = state.selectedFiles['watermark'][0];
        const text = document.getElementById('watermarkText').value;
        const colorHex = document.getElementById('watermarkColor').value;
        const size = parseInt(document.getElementById('watermarkSize').value) || 50;

        if (!text) throw new Error("Enter watermark text");

        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pages = pdfDoc.getPages();

        // Convert hex to rgb
        const r = parseInt(colorHex.slice(1, 3), 16) / 255;
        const g = parseInt(colorHex.slice(3, 5), 16) / 255;
        const b = parseInt(colorHex.slice(5, 7), 16) / 255;

        pages.forEach(page => {
            const { width, height } = page.getSize();
            page.drawText(text, {
                x: width / 2 - (text.length * size) / 4, // Approx centering
                y: height / 2,
                size: size,
                color: rgb(r, g, b),
                rotate: degrees(45),
                opacity: 0.5,
            });
        });

        const pdfBytes = await pdfDoc.save();
        download(pdfBytes, `watermarked-${file.name}`, "application/pdf");
        showToast("Watermark Added! 💧");

    } catch(e) {
        console.error(e);
        showToast(e.message, true);
    } finally {
        toggleLoader(false);
    }
}
