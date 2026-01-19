import { toggleLoader, showToast } from '../ui.js';
import { state } from '../state.js';

const { PDFDocument, rgb } = window.PDFLib;

export async function processPageNumber() {
    try {
        toggleLoader(true, "Numbering Pages...");
        const file = state.selectedFiles['pagenumber'][0];
        const pos = document.getElementById('pagenumberPos').value;

        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pages = pdfDoc.getPages();
        const count = pages.length;

        pages.forEach((page, idx) => {
            const { width, height } = page.getSize();
            const text = `${idx + 1} / ${count}`;
            const size = 12;

            let x = 0, y = 0;
            const margin = 20;
            const textWidth = text.length * 6; // Approx

            switch(pos) {
                case 'bottom-center': x = width/2 - textWidth/2; y = margin; break;
                case 'bottom-right': x = width - margin - textWidth; y = margin; break;
                case 'bottom-left': x = margin; y = margin; break;
                case 'top-center': x = width/2 - textWidth/2; y = height - margin; break;
                case 'top-right': x = width - margin - textWidth; y = height - margin; break;
                case 'top-left': x = margin; y = height - margin; break;
            }

            page.drawText(text, {
                x, y, size,
                color: rgb(0, 0, 0),
            });
        });

        const pdfBytes = await pdfDoc.save();
        download(pdfBytes, `numbered-${file.name}`, "application/pdf");
        showToast("Page Numbers Added! 🔢");

    } catch(e) {
        console.error(e);
        showToast("Error", true);
    } finally {
        toggleLoader(false);
    }
}
