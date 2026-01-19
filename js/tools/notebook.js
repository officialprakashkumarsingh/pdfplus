import { toggleLoader, showToast } from '../ui.js';
import { state } from '../state.js';

const { PDFDocument } = window.PDFLib;

export function setInk(color, btn) {
    state.inkColor = color;
    document.querySelectorAll('.ink-opt').forEach(b => b.classList.remove('ring-2', 'ring-blue-500'));
    if(btn) btn.classList.add('ring-2', 'ring-blue-500');
}

export async function processNotebook() {
    try {
        toggleLoader(true, "Writing Notebook...", "Converting text to handwriting");
        const file = state.selectedFiles['notebook'][0];
        const arrayBuffer = await file.arrayBuffer();

        // 1. Extract Text using PDF.js
        const loadingTask = pdfjsLib.getDocument(arrayBuffer);
        const pdf = await loadingTask.promise;
        let fullText = "";

        // Get text from first 5 pages max to avoid crashing browser on huge books
        const maxPages = Math.min(pdf.numPages, 10);
        for(let i=1; i<=maxPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + "\n\n";
        }

        if(!fullText.trim()) throw new Error("No text found in PDF (scanned?)");

        // 2. Setup Canvas
        const canvas = document.getElementById('notebookCanvas');
        const ctx = canvas.getContext('2d');
        const pdfDoc = await PDFDocument.create();

        // 3. Drawing Configuration
        const lineHeight = 30;
        const margin = 80;
        const startY = 80;
        const maxWidth = canvas.width - margin - 40;

        // Helper to draw one page background
        function drawPageBackground() {
            ctx.fillStyle = "#fffbeb"; // Very light yellow/paper color
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw Lines
            ctx.strokeStyle = "#94a3b8"; // Light Blue/Gray lines
            ctx.lineWidth = 1;
            for(let y = startY; y < canvas.height - 40; y += lineHeight) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }

            // Draw Margin
            ctx.strokeStyle = "#ef4444"; // Red Margin
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(margin, 0);
            ctx.lineTo(margin, canvas.height);
            ctx.stroke();
        }

        // 4. Text Wrapping & Rendering Logic
        ctx.font = "24px 'Patrick Hand', cursive";
        const words = fullText.split(' ');
        let x = margin + 10;
        let y = startY - 5; // Align with line

        // Start First Page
        drawPageBackground();

        let wordIndex = 0;
        while(wordIndex < words.length) {
            const word = words[wordIndex];
            const metrics = ctx.measureText(word + " ");

            if (x + metrics.width > maxWidth) {
                x = margin + 10;
                y += lineHeight;

                // New Page Check
                if (y > canvas.height - 50) {
                    // Save current canvas to PDF
                    const imgData = canvas.toDataURL('image/jpeg', 0.8);
                    const imgEmbed = await pdfDoc.embedJpg(imgData);
                    const page = pdfDoc.addPage([canvas.width, canvas.height]);
                    page.drawImage(imgEmbed, { x: 0, y: 0, width: canvas.width, height: canvas.height });

                    // Reset for new page
                    drawPageBackground();
                    y = startY - 5;
                }
            }

            // Ink Color Logic
            if(state.inkColor === 'mixed') {
                    const colors = ['#1e3a8a', '#dc2626', '#0f766e', '#000000'];
                    // Randomly change color sometimes or for specific words (simplified: random)
                    ctx.fillStyle = Math.random() > 0.9 ? colors[Math.floor(Math.random() * colors.length)] : '#1e3a8a';
            } else if (state.inkColor === 'blue') {
                ctx.fillStyle = '#1e3a8a'; // Deep Blue Ink
            } else {
                ctx.fillStyle = '#1f2937'; // Black Ink
            }

            // Slight rotation for handwriting realism
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate((Math.random() - 0.5) * 0.05); // Subtle jitter
            ctx.fillText(word, 0, 0);
            ctx.restore();

            x += metrics.width;
            wordIndex++;
        }

        // Save final page
        const imgData = canvas.toDataURL('image/jpeg', 0.8);
        const imgEmbed = await pdfDoc.embedJpg(imgData);
        const page = pdfDoc.addPage([canvas.width, canvas.height]);
        page.drawImage(imgEmbed, { x: 0, y: 0, width: canvas.width, height: canvas.height });

        const pdfBytes = await pdfDoc.save();
        download(pdfBytes, `notebook-${file.name}`, "application/pdf");
        showToast("Notebook Created! 📒");

    } catch(e) {
        console.error(e);
        showToast(e.message || "Could not read PDF Text", true);
    } finally {
        toggleLoader(false);
    }
}
