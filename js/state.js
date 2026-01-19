export const state = {
    selectedFiles: {},
    gridN: 2,
    inkColor: 'blue'
};

export function setSelectedFiles(type, files) {
    state.selectedFiles[type] = files;
}

export function getSelectedFiles(type) {
    return state.selectedFiles[type];
}
