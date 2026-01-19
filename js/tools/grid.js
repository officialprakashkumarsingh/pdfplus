import { toggleLoader, showToast } from '../ui.js';
import { state } from '../state.js';

const { PDFDocument } = window.PDFLib;

export function selectGrid(n, btn) {
    state.gridN = n;
    document.querySelectorAll('.grid-opt').forEach(b => b.classList.remove('bg-indigo-50', 'text-indigo-700'));
    if(btn) btn.classList.add('bg-indigo-50', 'text-indigo-700');
}

export async function processGrid() {
    try {
        toggleLoader(true);
        const file = state.selectedFiles['grid'][0];
        const srcDoc = await PDFDocument.load(await file.arrayBuffer());
        const destDoc = await PDFDocument.create();
        const count = srcDoc.getPageCount();
        const [W, H] = [595, 842]; // A4
        let currPage;

        for(let i=0; i<count; i++) {
            const embed = await destDoc.embedPage(srcDoc.getPages()[i]);
            const dims = embed.scale(1);
            if(i % state.gridN === 0) currPage = destDoc.addPage([W, H]);

            if(state.gridN === 2) {
                const scale = Math.min((W-40)/dims.width, (H/2-40)/dims.height);
                const w = dims.width*scale, h = dims.height*scale;
                const y = (i%2===0) ? H/2+(H/2-h)/2 : (H/2-h)/2;
                currPage.drawPage(embed, { x: (W-w)/2, y, width: w, height: h });
            } else {
                const scale = Math.min((W/2-30)/dims.width, (H/2-30)/dims.height);
                const w = dims.width*scale, h = dims.height*scale;
                const idx = i%4;
                const cx = (idx%2===0) ? W/4 : W*0.75;
                const cy = (idx<2) ? H*0.75 : H/4;
                currPage.drawPage(embed, { x: cx-w/2, y: cy-h/2, width: w, height: h });
            }
        }
        download(await destDoc.save(), "collage.pdf", "application/pdf");
        showToast("Collage Ready!");
    } catch(e) {
        console.error(e);
        showToast("Error", true);
    } finally {
        toggleLoader(false);
    }
}
