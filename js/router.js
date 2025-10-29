/**
 * This module handles routing logic for the pages and nav bar.
 */
import { state } from './state.js';
import { hideBackButton, applyStaticTranslations, showLoadingMessage } from './ui.js';
import { initializeCatalog } from './catalog.js';
import { renderHomePage } from './home.js'; //
import { renderBentoPage } from './page-renderer.js';

const pageContentContainer = document.getElementById('page-content');

export function renderPage(page, appState, options = {}) {
    // Toggle active nav links
    document.querySelectorAll('.nav-link').forEach(link =>
        link.classList.toggle('active', link.dataset.page === page)
    );

    // Show/hide print button
    const printButton = document.getElementById('print-button');
    if (printButton) printButton.classList.toggle('hidden', page !== 'catalog');

    // Define simple routing map
    const bentoPages = ['about', 'contact', 'find-our-products', 'faq', 'blog'];

    if (page === 'catalog') {
        initializeCatalog(appState, options.startCategory);
    } else if (page === 'home') {
        renderHomePage(appState);
    } else if (bentoPages.includes(page)) {
        renderBentoPage(page, appState);
    } else {
        renderHomePage(appState); // fallback
    }
}


// This function handles simple HTML pages
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

