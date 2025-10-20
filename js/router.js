import { state } from './state.js';
import { hideBackButton, applyStaticTranslations, showLoadingMessage } from './ui.js';
import { initializeCatalog } from './catalog.js';
import { renderHomePage } from './home.js';
import { renderBentoPage } from './page-renderer.js'; // Import the new renderer

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
            renderHomePage(appState);
            break;
        case 'about':
        case 'contact': // You can add more pages here
            renderBentoPage(page, appState); // Use the new generic renderer
            break;
        default:
            renderHomePage(appState);
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

