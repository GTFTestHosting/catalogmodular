import { renderPage } from './router.js';
import { showLoadingMessage, applyStaticTranslations, hideBackButton } from './ui.js';
import { buildPanel, setupHomeNavTiles } from './panel-builder.js'; 
import { initParallax } from './parallax.js'; // Import the parallax module

const pageContentContainer = document.getElementById('page-content');

export async function renderBentoPage(page, appState) {
    hideBackButton();
    showLoadingMessage(pageContentContainer, appState.translations);

    try {
        // 1. Fetch the generic bento-shell.html
        const shellResponse = await fetch('pages/bento-shell.html');
        if (!shellResponse.ok) throw new Error('bento-shell.html not found');
        const shellHtml = await shellResponse.text();
        pageContentContainer.innerHTML = shellHtml;

        // 2. Find the grid container within the shell
        const gridWrapper = pageContentContainer.querySelector('.bento-grid');
        if (!gridWrapper) throw new Error('.bento-grid container not found in shell');

        // 3. Fetch the specific manifest for the current page (e.g., about.json)
        const manifestResponse = await fetch(`data/${appState.currentLanguage}/${page}/${page}.json`);
        if (!manifestResponse.ok) throw new Error(`${page}.json manifest not found`);
        const panelFiles = await manifestResponse.json();

        // 4. Fetch all the individual panel JSON files
        const panelPromises = panelFiles.map(file => fetch(file).then(res => res.json()));
        const panelsData = await Promise.all(panelPromises);
        
        // 5. Build and append each panel to the grid wrapper
        panelsData.forEach(panelData => {
            const cell = document.createElement('div');
            // Use the page name to create a specific cell class for potential styling hooks
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

        // THIS IS THE KEY FIX: Find all carousels and initialize them
        document.querySelectorAll('.carousel-panel').forEach(initCarousel);
        
        // Re-use the nav tile setup function
        setupHomeNavTiles(appState);
        applyStaticTranslations(appState.translations);
        
        initParallax();
        
    } catch (error) {
        console.error(`Failed to load page ${page}:`, error);
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

