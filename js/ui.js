export function showHome() {
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active', 'flex'));
    document.querySelectorAll('.screen').forEach(el => el.classList.add('hidden'));
    document.getElementById('screen-home').classList.remove('hidden');
    document.getElementById('screen-home').classList.add('active', 'flex');
    document.getElementById('headerBackBtn').classList.add('hidden');
    resetForms();
}

export function openTool(toolId) {
    document.getElementById('screen-home').classList.add('hidden');
    document.getElementById('screen-home').classList.remove('active');

    const target = document.getElementById(`tool-${toolId}`);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('active', 'flex');
        document.getElementById('headerBackBtn').classList.remove('hidden');
    } else {
        console.error(`Tool ${toolId} not found`);
    }
}

export function resetForms() {
    // Reset inputs
    document.querySelectorAll('input').forEach(i => i.value = '');

    // Disable action buttons
    document.querySelectorAll('button[id^="btn-"]').forEach(b => b.disabled = true);

    // Clear lists
    document.querySelectorAll('[id$="List"]').forEach(l => {
        l.innerHTML='';
        l.classList.add('hidden');
    });

    // Hide options
    document.querySelectorAll('[id$="Options"]').forEach(o => {
        o.classList.remove('flex');
        o.classList.add('hidden');
    });

    // Reset filenames
    document.querySelectorAll('[id$="FileName"]').forEach(t => t.innerText = "Select File");

    // Reset global state if needed (handled in main or specific tools)
}

export function toggleLoader(show, title="Processing", text="Please wait...") {
    const el = document.getElementById('loadingOverlay');
    document.getElementById('loaderTitle').innerText = title;
    document.getElementById('loaderText').innerText = text;
    el.style.display = show ? 'flex' : 'none';
}

export function showToast(msg, isError = false) {
    const t = document.getElementById('toast');
    document.getElementById('toastMsg').innerText = msg;
    document.getElementById('toastIcon').innerText = isError ? '❌' : '✅';
    t.style.opacity = '1';
    t.style.transform = 'translate(-50%, 0)';
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translate(-50%, 40px)'; }, 3000);
}
