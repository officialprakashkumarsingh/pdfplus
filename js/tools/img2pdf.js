import { toggleLoader, showToast } from '../ui.js';
import { state } from '../state.js';

const { PDFDocument } = window.PDFLib;

export async function processImgToPdf() {
    try {
        toggleLoader(true);
        const files = state.selectedFiles['img2pdf'];
        const pdfDoc = await PDFDocument.create();
        for (const file of files) {
            const buff = await file.arrayBuffer();
            let img;
            if (file.type === 'image/png') {
                img = await pdfDoc.embedPng(buff);
            } else {
                img = await pdfDoc.embedJpg(buff);
            }
            const page = pdfDoc.addPage([img.width, img.height]);
            page.drawImage(img, {x:0, y:0, width:img.width, height:img.height});
        }
        download(await pdfDoc.save(), "images.pdf", "application/pdf");
        showToast("PDF Created!");
    } catch(e) {
        console.error(e);
        showToast("Error", true);
    } finally {
        toggleLoader(false);
    }
}
