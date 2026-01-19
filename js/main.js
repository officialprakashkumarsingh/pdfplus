import { showHome, openTool, resetForms, toggleLoader, showToast } from './ui.js';
import { state, setSelectedFiles } from './state.js';
import { processNotebook, setInk } from './tools/notebook.js';
import { processProtect } from './tools/protect.js';
import { processMerge } from './tools/merge.js';
import { processSplit } from './tools/split.js';
import { processImgToPdf } from './tools/img2pdf.js';
import { processPdfToImg } from './tools/pdf2img.js';
import { processGrid, selectGrid } from './tools/grid.js';
import { renderViewer, changePage, changeZoom } from './tools/viewer.js';
import { processOrganize, initOrganize } from './tools/organize.js';
import { processWatermark } from './tools/watermark.js';
import { processPageNumber } from './tools/pagenumber.js';

// Init Icons
lucide.createIcons();

// Expose functions to global scope for HTML onclick attributes
window.showHome = showHome;
window.openTool = openTool;
window.setInk = setInk;
window.selectGrid = selectGrid;
window.processNotebook = processNotebook;
window.processProtect = processProtect;
window.processMerge = processMerge;
window.processSplit = processSplit;
window.processImgToPdf = processImgToPdf;
window.processPdfToImg = processPdfToImg;
window.processGrid = processGrid;
window.changePage = changePage;
window.changeZoom = changeZoom;
window.processOrganize = processOrganize;
window.processWatermark = processWatermark;
window.processPageNumber = processPageNumber;

// Handle File Select
window.handleFileSelect = function(type) {
    const inputId = type === 'img2pdf' ? 'img2pdfInput' : (type === 'merge' ? 'mergeInput' : (type === 'viewer' ? 'viewerInput' : `${type}Input`));
    const input = document.getElementById(inputId);
    const files = Array.from(input.files);

    if (!files.length) return;

    setSelectedFiles(type, files);

    // Viewer special case
    if (type === 'viewer') {
        renderViewer();
        return;
    }

    // Organize special case
    if (type === 'organize') {
        initOrganize();
        document.getElementById(`btn-${type}-action`).disabled = false;
        return;
    }

    const btn = document.getElementById(`btn-${type}-action`);

    if (type === 'merge') {
        const list = document.getElementById('mergeFileList');
        list.classList.remove('hidden');
        list.innerHTML = files.map(f => `<div class="bg-gray-50 p-3 rounded-lg flex items-center gap-2 text-xs text-gray-700 border border-gray-100"><i data-lucide="file" class="w-3 h-3 text-red-500"></i> ${f.name}</div>`).join('');
        lucide.createIcons();
    } else if (type === 'img2pdf') {
        const list = document.getElementById('img2pdfList');
        list.classList.remove('hidden');
        list.innerHTML = files.map(f => `<div class="bg-gray-50 p-3 rounded-lg flex items-center gap-2 text-xs text-gray-700 border border-gray-100"><i data-lucide="image" class="w-3 h-3 text-green-500"></i> ${f.name}</div>`).join('');
        lucide.createIcons();
    } else {
        const nameEl = document.getElementById(`${type}FileName`);
        if (nameEl) nameEl.innerText = files[0].name;

        const opts = document.getElementById(`${type}Options`);
        if(opts) { opts.classList.remove('hidden'); opts.classList.add('flex'); }
    }

    if(btn) btn.disabled = false;
};
