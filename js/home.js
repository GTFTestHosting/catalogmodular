import { renderPage } from './router.js';
import { showLoadingMessage, applyStaticTranslations, hideBackButton } from './ui.js';

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
            // THIS IS THE KEY CHANGE: Apply the style class to the cell
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
        console.error("Failed to load home page:", error);
        pageContentContainer.innerHTML = `<p>Error loading page content.</p>`;
    }
}

function buildPanel(data, appState) {
    const panel = document.createElement('div');
    const { translations } = appState;
    
    switch (data.type) {
        case 'promo':
            panel.className = 'promo-panel';
            // The style class is no longer added here
            if (data.backgroundImage) {
                panel.style.backgroundImage = `url('${data.backgroundImage}')`;
                panel.classList.add('has-bg-image');
            } else {
                panel.style.backgroundColor = data.backgroundColor;
            }
            const promoTitle = data.title || (translations[data.titleKey] || '');
            const promoText = data.text || (translations[data.textKey] || '');
            const promoTitleEl = document.createElement('h3');
            promoTitleEl.innerHTML = promoTitle;
            if (data.titleColor) promoTitleEl.style.color = data.titleColor;
            const promoTextEl = document.createElement('p');
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
            // The style class is no longer added here
            if (data.backgroundColor) panel.style.backgroundColor = data.backgroundColor;
            const headerEl = document.createElement('h1');
            if (data.header) headerEl.innerHTML = data.header;
            if (data.headerColor) headerEl.style.color = data.headerColor;
            const subheaderEl = document.createElement('h2');
            if (data.subheader) subheaderEl.innerHTML = data.subheader;
            if (data.subheaderColor) subheaderEl.style.color = data.subheaderColor;
            const paragraphEl = document.createElement('p');
            if (data.paragraph) paragraphEl.innerHTML = data.paragraph;
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
            // The style class is no longer added here
            panel.style.backgroundImage = `url('${data.image}')`;
            const tileTitle = data.title || (translations[data.titleKey] || '');
            panel.innerHTML = `<h2>${tileTitle}</h2>`;
            break;

        case 'recipe':
            panel.className = 'recipe-panel';
            // The style class is no longer added here
            if (data.backgroundImage) panel.style.backgroundImage = `url('${data.backgroundImage}')`;
            const ingredientsHtml = data.featuredProducts.map(item => `<li>${item}</li>`).join('');
            panel.innerHTML = `
                <div class="recipe-panel-content">
                    <h3 data-lang-key="${data.titleKey}">${translations[data.titleKey] || ''}</h3>
                    <p class="recipe-description" data-lang-key="${data.descriptionKey}">${translations[data.descriptionKey] || ''}</p>
                    <h4 class="featured-products-title" data-lang-key="${data.featuredTitleKey}">${translations[data.featuredTitleKey] || 'Featured Products:'}</h4>
                    <ul>${ingredientsHtml}</ul>
                </div>`;
            break;
        default:
            return null;
    }

    if (data.nav) {
        if (data.nav.href) {
            const linkWrapper = document.createElement('a');
            linkWrapper.href = data.nav.href;
            linkWrapper.target = "_blank";
            linkWrapper.rel = "noopener noreferrer";
            linkWrapper.classList.add('panel-link');
            linkWrapper.appendChild(panel);
            return linkWrapper;
        } else {
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

