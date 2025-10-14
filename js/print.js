import { state } from './state.js';

export async function handlePrintRequest(appState) {
    const printButton = document.getElementById('print-button');
    printButton.textContent = 'Generating...';
    printButton.disabled = true;

    try {
        const fullCatalogData = await fetchAllData(`data/${appState.currentLanguage}/categories.json`);
        buildPrintHtml(fullCatalogData, appState.translations);
        window.print();
    } catch (error) {
        console.error("Failed to generate print view:", error);
        alert("Sorry, there was an error generating the catalog for printing.");
    } finally {
        printButton.textContent = appState.translations.printButton || 'Print Catalog';
        printButton.disabled = false;
    }
}

async function fetchAllData(filePath) {
    // ... this function remains exactly the same
}

function buildPrintHtml(data, translations) {
    // ... this function remains exactly the same
}
