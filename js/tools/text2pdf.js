import { toggleLoader, showToast } from '../ui.js';

const { PDFDocument, StandardFonts, rgb } = window.PDFLib;

export async function processTextToPdf() {
    try {
        const text = document.getElementById('text2pdfInput').value;
        const fontName = document.getElementById('text2pdfFont').value;
        const fontSize = parseInt(document.getElementById('text2pdfSize').value);

        if (!text.trim()) {
            showToast("Enter some text", true);
            return;
        }

        toggleLoader(true, "Generating PDF...");

        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts[fontName]);

        const pages = [];
        let currentPage = pdfDoc.addPage();
        const { width, height } = currentPage.getSize();
        const margin = 50;
        const maxWidth = width - margin * 2;
        const lineHeight = fontSize * 1.2;

        let y = height - margin;

        // Split text into lines that fit
        const paragraphs = text.split('\n');

        for (const paragraph of paragraphs) {
            const words = paragraph.split(' ');
            let line = '';

            for (const word of words) {
                const testLine = line + word + ' ';
                const textWidth = font.widthOfTextAtSize(testLine, fontSize);

                if (textWidth > maxWidth) {
                    // Draw current line
                    currentPage.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0,0,0) });
                    y -= lineHeight;
                    line = word + ' ';

                    // New Page if needed
                    if (y < margin) {
                        currentPage = pdfDoc.addPage();
                        y = height - margin;
                    }
                } else {
                    line = testLine;
                }
            }
            // Draw remaining line
            if (line) {
                currentPage.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0,0,0) });
                y -= lineHeight;
            }
            // Paragraph break
            y -= lineHeight * 0.5;
             if (y < margin) {
                currentPage = pdfDoc.addPage();
                y = height - margin;
            }
        }

        const pdfBytes = await pdfDoc.save();
        download(pdfBytes, "text-document.pdf", "application/pdf");
        showToast("PDF Created! 📝");

    } catch(e) {
        console.error(e);
        showToast("Generation Failed", true);
    } finally {
        toggleLoader(false);
    }
}
