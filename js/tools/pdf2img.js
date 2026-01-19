import { toggleLoader, showToast } from '../ui.js';
import { state } from '../state.js';

export async function processPdfToImg() {
    try {
        toggleLoader(true, "Rendering...");
        const file = state.selectedFiles['pdf2img'][0];
        const pdf = await pdfjsLib.getDocument(await file.arrayBuffer()).promise;
        const zip = new JSZip();

        for (let i=1; i<=pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({scale: 1.5});
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width; canvas.height = viewport.height;
            await page.render({canvasContext: canvas.getContext('2d'), viewport}).promise;
            zip.file(`page-${i}.jpg`, canvas.toDataURL('image/jpeg', 0.8).split(',')[1], {base64:true});
        }
        download(await zip.generateAsync({type:"blob"}), `${file.name}-images.zip`, "application/zip");
        showToast("Downloaded ZIP!");
    } catch(e) {
        console.error(e);
        showToast("Failed", true);
    } finally {
        toggleLoader(false);
    }
}
