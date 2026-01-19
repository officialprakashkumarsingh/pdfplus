import { toggleLoader, showToast } from '../ui.js';
import { state } from '../state.js';

const { PDFDocument, rgb } = window.PDFLib;

export function setTintColor(color) {
    document.getElementById('tintColor').value = color;
}

export async function processTint() {
    try {
        const file = state.selectedFiles['tint'][0];
        const colorHex = document.getElementById('tintColor').value;

        toggleLoader(true, "Applying Color...");

        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pages = pdfDoc.getPages();

        const r = parseInt(colorHex.slice(1, 3), 16) / 255;
        const g = parseInt(colorHex.slice(3, 5), 16) / 255;
        const b = parseInt(colorHex.slice(5, 7), 16) / 255;

        pages.forEach(page => {
            const { width, height } = page.getSize();
            page.drawRectangle({
                x: 0,
                y: 0,
                width,
                height,
                color: rgb(r, g, b),
                opacity: 0.3, // Semi-transparent tint
                blendMode: 'Multiply', // Better for text readability
            });
        });

        const pdfBytes = await pdfDoc.save();
        download(pdfBytes, `tinted-${file.name}`, "application/pdf");
        showToast("Color Applied! 🎨");

    } catch(e) {
        console.error(e);
        showToast("Error", true);
    } finally {
        toggleLoader(false);
    }
}
