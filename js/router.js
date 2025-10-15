import { state } from './state.js';
import { hideBackButton, applyStaticTranslations, showLoadingMessage } from './ui.js';
import { initializeCatalog } from './catalog.js';
import { renderHomePage } from './home.js'; // Import the new home page renderer

const pageContentContainer = document.getElementById('page-content');

export function renderPage(page, appState, options = {}) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.page === page);
    });
    const printButton = document.getElementById('print-button');
    if(printButton) printButton.classList.toggle('hidden', page !== 'catalog');
    
    switch (page) {
        case 'catalog':
            initializeCatalog(appState, options.startCategory);
            break;
        case 'home':
            renderHomePage(appState); // Use the new home page renderer
            break;
        case 'about':
        case 'contact':
            loadHtmlContent(page, appState);
            break;
        default:
            renderHomePage(appState); // Default to home
    }
}

// This function now only handles simple HTML pages
async function loadHtmlContent(page, appState) {
    hideBackButton();
    if(pageContentContainer) {
        showLoadingMessage(pageContentContainer, appState.translations);
        try {
            const response = await fetch(`pages/${page}.html`);
            if (!response.ok) throw new Error('Page not found');
            const html = await response.text();
            pageContentContainer.innerHTML = html;
            applyStaticTranslations(appState.translations); 
        } catch (error) {
            console.error(`Failed to load page ${page}:`, error);
            pageContentContainer.innerHTML = `<p>Error loading page content.</p>`;
        }
    }
}

