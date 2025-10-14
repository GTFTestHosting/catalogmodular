import { state, setHistory } from './state.js';
import { hideBackButton, applyStaticTranslations, showLoadingMessage } from './ui.js';
import { initializeCatalog } from './catalog.js';

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
        case 'about':
        case 'contact':
            loadHtmlContent(page, appState);
            break;
        default:
            loadHtmlContent('home', appState);
    }
}

async function loadHtmlContent(page, appState) {
    hideBackButton();
    if(pageContentContainer) {
        showLoadingMessage(pageContentContainer, appState.translations);
        try {
            const response = await fetch(`pages/${page}.html`);
            if (!response.ok) throw new Error('Page not found');
            const html = await response.text();
            pageContentContainer.innerHTML = html;
            
            if (page === 'home') {
                setupHomeNavTiles(appState);
            }
            applyStaticTranslations(appState.translations); 
        } catch (error) {
            console.error(`Failed to load page ${page}:`, error);
            pageContentContainer.innerHTML = `<p>Error loading page content.</p>`;
        }
    }
}

function setupHomeNavTiles(appState) {
    document.querySelectorAll('.home-nav-tile').forEach(tile => {
        tile.addEventListener('click', () => {
            const targetPage = tile.dataset.page;
            const startCategory = tile.dataset.categoryStart;
            renderPage(targetPage, appState, { startCategory });
        });
    });
}
