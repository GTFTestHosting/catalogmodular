import { showLoadingMessage, applyStaticTranslations, hideBackButton } from './ui.js';
import { buildPanel, setupHomeNavTiles } from './panel-builder.js'; // Import from the new module

const pageContentContainer = document.getElementById('page-content');

export async function renderBentoPage(page, appState) {
    hideBackButton();
    showLoadingMessage(pageContentContainer, appState.translations);

    try {
        const shellResponse = await fetch('pages/bento-shell.html');
        if (!shellResponse.ok) throw new Error('bento-shell.html not found');
        const shellHtml = await shellResponse.text();
        pageContentContainer.innerHTML = shellHtml;

        const gridWrapper = pageContentContainer.querySelector('.bento-grid');
        if (!gridWrapper) throw new Error('.bento-grid container not found in shell');

        const manifestResponse = await fetch(`data/${appState.currentLanguage}/${page}/${page}.json`);
        if (!manifestResponse.ok) throw new Error(`${page}.json manifest not found`);
        const panelFiles = await manifestResponse.json();

        const panelPromises = panelFiles.map(file => fetch(file).then(res => res.json()));
        const panelsData = await Promise.all(panelPromises);
        
        panelsData.forEach(panelData => {
            const cell = document.createElement('div');
            cell.className = `${page}-cell`; 
            if (panelData.style) {
                cell.classList.add(`promo-${panelData.style}`);
            }

            const panel = buildPanel(panelData, appState);
            if (panel) {
                cell.appendChild(panel);
                gridWrapper.appendChild(cell);
            }
        });
        
        setupHomeNavTiles(appState);
        applyStaticTranslations(appState.translations);

    } catch (error) {
        console.error(`Failed to load page ${page}:`, error);
        pageContentContainer.innerHTML = `<p>Error loading page content.</p>`;
    }
}

