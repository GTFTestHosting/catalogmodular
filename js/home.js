/**
 * This module ties all the other modules together.
 */
import { renderPage } from './router.js';
import { showLoadingMessage, applyStaticTranslations, hideBackButton } from './ui.js';
import { buildPanel, setupHomeNavTiles, initCarousel } from './panel-builder.js';
import { initParallax } from './parallax.js'; 

const pageContentContainer = document.getElementById('page-content');

export async function renderHomePage(appState) {
    hideBackButton();
    showLoadingMessage(pageContentContainer, appState.translations);

    try {
        const shellResponse = await fetch('pages/home.html');
        if (!shellResponse.ok) throw new Error('Home page shell not found');
        const shellHtml = await shellResponse.text();
        pageContentContainer.innerHTML = shellHtml;

        const gridWrapper = pageContentContainer.querySelector('.home-grid');
        if (!gridWrapper) throw new Error('.home-grid container not found in home.html');

        const manifestResponse = await fetch(`data/${appState.currentLanguage}/homepage/home.json`);
        if (!manifestResponse.ok) throw new Error('Home page manifest not found');
        const panelFiles = await manifestResponse.json();

        const panelPromises = panelFiles.map(file => fetch(file).then(res => res.json()));
        const panelsData = await Promise.all(panelPromises);
        
        panelsData.forEach(panelData => {
            const cell = document.createElement('div');
            cell.className = 'home-cell';
            if (panelData.style) {
                cell.classList.add(`promo-${panelData.style}`);
            }

            const panel = buildPanel(panelData, appState);
            if (panel) {
                cell.appendChild(panel);
                gridWrapper.appendChild(cell);
            }
        });
        
        // THIS IS THE KEY FIX: Find all carousels and initialize them
        document.querySelectorAll('.carousel-panel').forEach(initCarousel);

        setupHomeNavTiles(appState);
        applyStaticTranslations(appState.translations);
        
        initParallax();

    } catch (error) {
        console.error("Failed to load home page:", error);
        pageContentContainer.innerHTML = `<p>Error loading page content.</p>`;
    }
}

