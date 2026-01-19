import { toggleLoader, showToast } from '../ui.js';
import { state } from '../state.js';

const { PDFDocument } = window.PDFLib;

export async function processSplit() {
    try {
        toggleLoader(true);
        const file = state.selectedFiles['split'][0];
        const range = document.getElementById('splitPages').value;
        if(!range) throw new Error("Enter pages");

        const pdfDoc = await PDFDocument.load(await file.arrayBuffer());
        const newPdf = await PDFDocument.create();
        const total = pdfDoc.getPageCount();
        let indices = new Set();

        range.split(',').forEach(part => {
            if (part.includes('-')) {
                const [s, e] = part.split('-').map(Number);
                if(s && e) for(let i=s; i<=e; i++) indices.add(i-1);
            } else { const p = Number(part); if(p) indices.add(p-1); }
        });

        const arr = Array.from(indices).filter(i => i>=0 && i<total);
        if(!arr.length) throw new Error("Invalid pages");

        (await newPdf.copyPages(pdfDoc, arr)).forEach(p => newPdf.addPage(p));
        download(await newPdf.save(), `split-${file.name}`, "application/pdf");
        showToast("Splitted!");
    } catch(e) {
        showToast(e.message, true);
    } finally {
        toggleLoader(false);
    }
}
