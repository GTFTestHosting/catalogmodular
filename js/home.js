import { renderPage } from './router.js';
import { showLoadingMessage, applyStaticTranslations, hideBackButton } from './ui.js';

const pageContentContainer = document.getElementById('page-content');

export async function renderHomePage(appState) {
    hideBackButton();
    showLoadingMessage(pageContentContainer, appState.translations);

    try {
        // 1. Fetch the new home.html shell
        const shellResponse = await fetch('pages/home.html');
        if (!shellResponse.ok) throw new Error('Home page shell not found');
        const shellHtml = await shellResponse.text();
        pageContentContainer.innerHTML = shellHtml;

        // 2. Find the grid container within the new shell
        const gridWrapper = pageContentContainer.querySelector('.home-grid');
        if (!gridWrapper) throw new Error('.home-grid container not found in home.html');

        // 3. Fetch the home page data manifest
        const manifestResponse = await fetch(`data/${appState.currentLanguage}/homepage/home.json`);
        if (!manifestResponse.ok) throw new Error('Home page manifest not found');
        const panelFiles = await manifestResponse.json();

        // 4. Fetch all the individual panel JSON files
        const panelPromises = panelFiles.map(file => fetch(file).then(res => res.json()));
        const panelsData = await Promise.all(panelPromises);
        
        // 5. Build and append each panel to the grid wrapper
        panelsData.forEach(panelData => {
            const panel = buildPanel(panelData, appState);
            if (panel) {
                gridWrapper.appendChild(panel);
            }
        });

        setupHomeNavTiles(appState);
        applyStaticTranslations(appState.translations);

    } catch (error) {
        console.error("Failed to load home page:", error);
        pageContentContainer.innerHTML = `<p>Error loading page content.</p>`;
    }
}

// This function builds a single panel based on its type from the fetched data
function buildPanel(data, appState) {
    const panel = document.createElement('div');
    const { translations } = appState;
    
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
            if(data.nav) panel.classList.add('home-nav-tile');
            panel.style.backgroundColor = data.backgroundColor;
            panel.style.color = data.textColor;
            panel.innerHTML = `
                <h3 data-lang-key="${data.titleKey}">${translations[data.titleKey] || ''}</h3>
                <p data-lang-key="${data.textKey}">${translations[data.textKey] || ''}</p>
            `;
            break;

        case 'text-block':
            panel.className = 'text-block-panel';
            if (data.style) panel.classList.add(`promo-${data.style}`);
            if (data.backgroundColor) panel.style.backgroundColor = data.backgroundColor;
            if (data.textColor) panel.style.color = data.textColor;
            
            let textContent = '';
            if (data.header) textContent += `<h1>${data.header}</h1>`;
            if (data.subheader) textContent += `<h2>${data.subheader}</h2>`;
            if (data.paragraph) textContent += `<p>${data.paragraph}</p>`;
            panel.innerHTML = textContent;
            break;

        case 'tile':
            panel.className = 'tile home-nav-tile';
            panel.style.backgroundImage = `url('${data.image}')`;
            panel.innerHTML = `<h2 data-lang-key="${data.titleKey}">${translations[data.titleKey] || ''}</h2>`;
            break;

        case 'recipe':
            panel.className = 'recipe-panel';
            if (data.style) panel.classList.add(`promo-${data.style}`);
            if (data.backgroundImage) panel.style.backgroundImage = `url('${data.backgroundImage}')`;
            
            const ingredientsHtml = data.featuredProducts.map(item => `<li>${item}</li>`).join('');
            panel.innerHTML = `
                <div class="recipe-panel-content">
                    <h3 data-lang-key="${data.titleKey}">${translations[data.titleKey] || ''}</h3>
                    <p class="recipe-description" data-lang-key="${data.descriptionKey}">${translations[data.descriptionKey] || ''}</p>
                    <h4 class="featured-products-title" data-lang-key="${data.featuredTitleKey}">${translations[data.featuredTitleKey] || 'Featured Products:'}</h4>
                    <ul>${ingredientsHtml}</ul>
                </div>
            `;
            break;
        default:
            return null;
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

