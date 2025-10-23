import { renderPage } from './router.js';
import { showLoadingMessage, applyStaticTranslations, hideBackButton } from './ui.js';
import { buildPanel, setupHomeNavTiles } from './panel-builder.js'; // Import from the new module

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

    } catch (error) {
        console.error("Failed to load home page:", error);
        pageContentContainer.innerHTML = `<p>Error loading page content.</p>`;
    }
}

// THIS IS THE SECOND KEY FIX: The helper function for the animation
function initCarousel(carouselPanel) {
    const slides = carouselPanel.querySelectorAll('.carousel-slide');
    let currentIndex = 0;

    if (slides.length <= 1) return; // Don't start if there's only one slide

    setInterval(() => {
        if(slides[currentIndex]) slides[currentIndex].classList.remove('is-active');
        currentIndex = (currentIndex + 1) % slides.length;
        if(slides[currentIndex]) slides[currentIndex].classList.add('is-active');
    }, 5000); // Change slide every 5 seconds
}

