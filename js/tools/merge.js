import { toggleLoader, showToast } from '../ui.js';
import { state } from '../state.js';

const { PDFDocument } = window.PDFLib;

export async function processMerge() {
    try {
        toggleLoader(true);
        const files = state.selectedFiles['merge'];
        const mergedPdf = await PDFDocument.create();
        for (const file of files) {
            const pdf = await PDFDocument.load(await file.arrayBuffer());
            const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            pages.forEach(p => mergedPdf.addPage(p));
        }
        download(await mergedPdf.save(), "merged.pdf", "application/pdf");
        showToast("Merged!");
    } catch(e) {
        console.error(e);
        showToast("Merge Failed", true);
    } finally {
        toggleLoader(false);
    }
}
