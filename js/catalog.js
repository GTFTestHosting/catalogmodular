import { state, pushHistory } from './state.js';
import { showBackButton, showLoadingMessage, showProductDetails } from './ui.js';
import { createSlug } from './utils.js';

const pageContentContainer = document.getElementById('page-content');

export async function initializeCatalog(appState, startCategorySlug = null) {
    pushHistory({ type: 'catalog' }); // Use this for back button
    
    pageContentContainer.innerHTML = `
        <div id="main-categories" class="category-container"></div>
        <div id="sub-categories"></div>
    `;
    const mainCategoriesContainer = document.getElementById('main-categories');
    
    showLoadingMessage(mainCategoriesContainer, appState.translations);

    try {
        const categoriesPath = `data/${appState.currentLanguage}/categories.json`;
        const response = await fetch(categoriesPath);
        const categories = await response.json();

        if (startCategorySlug) {
            const targetCategory = categories.find(cat => createSlug(cat.name) === startCategorySlug);
            if (targetCategory) {
                if (targetCategory.type === 'subcategories') {
                    displayCategoryLevel(targetCategory.dataFile, appState);
                } else {
                    displayProductLevel(targetCategory.dataFile, appState);
                }
                return;
            }
        }

        mainCategoriesContainer.innerHTML = '';
        categories.forEach(category => {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.style.backgroundImage = `url("${category.image}")`;
            tile.innerHTML = `<h2>${category.name}</h2>`;
            tile.onclick = () => {
                const nextPath = category.dataFile;
                if (category.type === 'subcategories') {
                    displayCategoryLevel(nextPath, appState);
                } else {
                    displayProductLevel(nextPath, appState);
                }
            };
            mainCategoriesContainer.appendChild(tile);
        });
    } catch (error) {
        console.error("Error initializing catalog:", error);
        mainCategoriesContainer.innerHTML = `<p>Error loading catalog.</p>`;
    }
}

export async function displayCategoryLevel(filePath, appState) {
    // ... logic is the same, but now it uses functions from other modules
}

export async function displayProductLevel(manifestFilePath, appState) {
    // ... logic is the same, but now it uses functions from other modules
}
