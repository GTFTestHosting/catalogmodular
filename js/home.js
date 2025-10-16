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

// This function builds a single panel and now correctly handles external links
function buildPanel(data, appState) {
    const panel = document.createElement('div');
    const { translations } = appState;
    
    // Build the panel's content based on its type
    switch (data.type) {
        case 'promo':
            panel.className = 'promo-panel';
            if (data.style) panel.classList.add(`promo-${data.style}`);
            
            if (data.backgroundImage) {
                panel.style.backgroundImage = `url('${data.backgroundImage}')`;
                panel.classList.add('has-bg-image');
            } else {
                panel.style.backgroundColor = data.backgroundColor;
            }

            const promoTitleEl = document.createElement('h3');
            const promoTitle = data.title || (translations[data.titleKey] || '');
            promoTitleEl.innerHTML = promoTitle;
            if (data.titleColor) {
                promoTitleEl.style.color = data.titleColor;
            }

            const promoTextEl = document.createElement('p');
            const promoText = data.text || (translations[data.textKey] || '');
            promoTextEl.innerHTML = promoText;
            if (data.paragraphColor) {
                promoTextEl.style.color = data.paragraphColor;
            } else if (data.textColor) { 
                promoTextEl.style.color = data.textColor;
            }
            
            panel.appendChild(promoTitleEl);
            panel.appendChild(promoTextEl);
            break;

        case 'text-block':
            panel.className = 'text-block-panel';
            if (data.style) panel.classList.add(`promo-${data.style}`);
            if (data.backgroundColor) panel.style.backgroundColor = data.backgroundColor;
            
            const headerEl = document.createElement('h1');
            if (data.header) headerEl.innerHTML = data.header; // CHANGED
            if (data.headerColor) headerEl.style.color = data.headerColor;

            const subheaderEl = document.createElement('h2');
            if (data.subheader) subheaderEl.innerHTML = data.subheader; // CHANGED
            if (data.subheaderColor) subheaderEl.style.color = data.subheaderColor;
            
            const paragraphEl = document.createElement('p');
            if (data.paragraph) paragraphEl.innerHTML = data.paragraph; // CHANGED
            if (data.paragraphColor) {
                paragraphEl.style.color = data.paragraphColor;
            } else if (data.textColor) {
                paragraphEl.style.color = data.textColor;
            }

            if(data.header) panel.appendChild(headerEl);
            if(data.subheader) panel.appendChild(subheaderEl);
            if(data.paragraph) panel.appendChild(paragraphEl);
            break;

        case 'tile':
            panel.className = 'tile';
            panel.style.backgroundImage = `url('${data.image}')`;

            const tileTitle = data.title || (translations[data.titleKey] || '');
            panel.innerHTML = `<h2>${tileTitle}</h2>`;
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

    // Handle internal vs external links
    if (data.nav) {
        if (data.nav.href) {
            const linkWrapper = document.createElement('a');
            linkWrapper.href = data.nav.href;
            linkWrapper.target = "_blank";
            linkWrapper.rel = "noopener noreferrer";
            linkWrapper.classList.add('panel-link');
            linkWrapper.appendChild(panel);
            return linkWrapper;
        } else if (data.nav.page) {
            panel.classList.add('home-nav-tile');
            panel.dataset.page = data.nav.page;
            if (data.nav.category) {
                panel.dataset.categoryStart = data.nav.category;
            }
            panel.style.cursor = 'pointer';
        }
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

