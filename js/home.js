import { renderPage } from './router.js';
import { showLoadingMessage, applyStaticTranslations, hideBackButton } from './ui.js';

const pageContentContainer = document.getElementById('page-content');

export async function renderHomePage(appState) {
    hideBackButton();
    showLoadingMessage(pageContentContainer, appState.translations);

    try {
        const response = await fetch(`data/${appState.currentLanguage}/homepage/home.json`);
        if (!response.ok) throw new Error('Home page data not found');
        const homeData = await response.json();

        const gridWrapper = document.createElement('div');
        gridWrapper.className = 'home-grid';

        // Use Promise.all to handle the now-asynchronous buildPanel function
        const panelPromises = homeData.panels.map(panelData => buildPanel(panelData, appState));
        const panels = await Promise.all(panelPromises);

        panels.forEach(panel => {
            if (panel) {
                gridWrapper.appendChild(panel);
            }
        });

        pageContentContainer.innerHTML = '';
        pageContentContainer.appendChild(gridWrapper);

        setupHomeNavTiles(appState);
        applyStaticTranslations(appState.translations);

    } catch (error) {
        console.error("Failed to load home page:", error);
        pageContentContainer.innerHTML = `<p>Error loading page content.</p>`;
    }
}

// This function is now async to handle fetching text block content
async function buildPanel(data, appState) {
    const panel = document.createElement('div');
    
    if (data.nav) {
        panel.classList.add('home-nav-tile');
        panel.dataset.page = data.nav.page;
        if (data.nav.category) {
            panel.dataset.categoryStart = data.nav.category;
        }
        panel.style.cursor = 'pointer';
    }

    switch (data.type) {
        case 'promo':
            panel.className = 'promo-panel';
            if (data.style) panel.classList.add(`promo-${data.style}`);
            panel.style.backgroundColor = data.backgroundColor;
            panel.style.color = data.textColor;
            panel.innerHTML = `
                <h3 data-lang-key="${data.titleKey}">${appState.translations[data.titleKey] || ''}</h3>
                <p data-lang-key="${data.textKey}">${appState.translations[data.textKey] || ''}</p>
            `;
            break;

        case 'text-block':
            panel.className = 'text-block-panel';
            if (data.style) panel.classList.add(`promo-${data.style}`);
            if (data.backgroundColor) panel.style.backgroundColor = data.backgroundColor;
            if (data.textColor) panel.style.color = data.textColor;
            
            if (data.dataFile) {
                try {
                    const dataFilePath = data.dataFile.replace('data/en/', `data/${appState.currentLanguage}/`);
                    const contentResponse = await fetch(dataFilePath);
                    const contentData = await contentResponse.json();

                    let textContent = '';
                    if (contentData.header) {
                        textContent += `<h1>${contentData.header}</h1>`;
                    }
                    if (contentData.subheader) {
                        textContent += `<h2>${contentData.subheader}</h2>`;
                    }
                    if (contentData.paragraph) {
                        textContent += `<p>${contentData.paragraph}</p>`;
                    }
                    panel.innerHTML = textContent;
                } catch (e) {
                    console.error("Failed to load text block content from", data.dataFile, e);
                }
            }
            break;

        case 'tile':
            panel.className = 'tile home-nav-tile';
            panel.style.backgroundImage = `url('${data.image}')`;
            panel.innerHTML = `<h2 data-lang-key="${data.titleKey}">${appState.translations[data.titleKey] || ''}</h2>`;
            break;

        case 'recipe':
            panel.className = 'recipe-panel';
            panel.style.backgroundImage = `url('${data.image}')`;
            const ingredientsHtml = data.featuredProducts.map(item => `<li>${item}</li>`).join('');
            panel.innerHTML = `
                <div class="recipe-panel-content">
                    <h3 data-lang-key="${data.titleKey}">${appState.translations[data.titleKey] || ''}</h3>
                    <p class="recipe-description" data-lang-key="${data.descriptionKey}">${appState.translations[data.descriptionKey] || ''}</p>
                    <h4 class="featured-products-title" data-lang-key="${data.featuredTitleKey}">${appState.translations[data.featuredTitleKey] || 'Featured Products:'}</h4>
                    <ul>${ingredientsHtml}</ul>
                </div>
            `;
            break;
        default:
            return null; // Return null for unknown types
    }

    return panel;
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

