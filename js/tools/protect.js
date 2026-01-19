import { toggleLoader, showToast } from '../ui.js';
import { state } from '../state.js';

const { PDFDocument } = window.PDFLib;

export async function processProtect() {
    try {
        toggleLoader(true, "Locking PDF...");
        const file = state.selectedFiles['protect'][0];
        let password = document.getElementById('pdfPassword').value;

        if (!password) {
            throw new Error("Please enter a password");
        }
        password = password.trim();
        if (password.length < 1) {
             throw new Error("Password cannot be empty");
        }

        const arrayBuffer = await file.arrayBuffer();

        // Load document
        const pdfDoc = await PDFDocument.load(arrayBuffer);

        // Set metadata to ensure some change (and good practice)
        pdfDoc.setProducer('PDF+ App');
        pdfDoc.setCreator('PDF+ App');

        const encryptedPdfBytes = await pdfDoc.save({
            userPassword: password,
            ownerPassword: password,
            permissions: {
                printing: 'highResolution',
                modifying: false,
                copying: false,
                annotating: false,
                fillingForms: false,
                contentAccessibility: false,
                documentAssembly: false,
            },
        });

        download(encryptedPdfBytes, `protected-${file.name}`, "application/pdf");
        showToast("PDF Locked Successfully 🔒");
    } catch(e) {
        console.error(e);
        showToast(e.message || "Protection Failed", true);
    } finally {
        toggleLoader(false);
    }
}
