import { pushHistory } from './state.js';
import { showBackButton, hideBackButton, showLoadingMessage, showProductDetails } from './ui.js';
import { createSlug } from './utils.js';

// Get a reference to the main content container where the catalog will be rendered.
const pageContentContainer = document.getElementById('page-content');

/**
 * Initializes the main catalog view by fetching and displaying the top-level categories.
 * This function also handles deep-linking to a specific category from another page.
 * @param {object} appState - The current state of the application (language, etc.).
 * @param {string|null} startCategorySlug - Optional slug to navigate directly to a category.
 */
export async function initializeCatalog(appState, startCategorySlug = null) {
    // When starting the catalog, reset its specific navigation history and hide the back button.
    appState.navigationHistory = []; 
    hideBackButton();

    // Dynamically create the necessary containers for the catalog view.
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

        // If a start category is provided (e.g., from the homepage), find and navigate to it directly.
        if (startCategorySlug) {
            const targetCategory = categories.find(cat => createSlug(cat.name) === startCategorySlug);
            if (targetCategory) {
                pushHistory({ type: 'catalog' });
                if (targetCategory.type === 'subcategories') {
                    displayCategoryLevel(targetCategory.dataFile, appState);
                } else {
                    displayProductLevel(targetCategory.dataFile, appState);
                }
                return; // Skip rendering the main menu.
            }
        }

        // If no start category, render the main category tiles as usual.
        mainCategoriesContainer.innerHTML = '';
        categories.forEach(category => {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.style.backgroundImage = `url("${category.image}")`;
            tile.innerHTML = `<h2>${category.name}</h2>`;
            tile.onclick = () => {
                pushHistory({ type: 'catalog', path: categoriesPath });
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

/**
 * Displays a grid of subcategories.
 * @param {string} filePath - The path to the JSON file listing the subcategories.
 * @param {object} appState - The current state of the application.
 */
export async function displayCategoryLevel(filePath, appState) {
    showBackButton(appState.translations);
    const subCategoriesContainer = document.getElementById('sub-categories');
    const mainCategoriesContainer = document.getElementById('main-categories');
    if (mainCategoriesContainer) mainCategoriesContainer.classList.add('hidden');
    
    showLoadingMessage(subCategoriesContainer, appState.translations);

    try {
        const response = await fetch(filePath);
        const items = await response.json();
        subCategoriesContainer.innerHTML = '';

        const gridWrapper = document.createElement('div');
        gridWrapper.className = 'subcategory-wrapper';

        items.forEach(item => {
            const cell = document.createElement('div');
            cell.className = 'subcategory-cell';
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.style.backgroundImage = `url("${item.image}")`;
            tile.innerHTML = `<h2>${item.name}</h2>`; 
            tile.onclick = () => {
                pushHistory({ type: 'category', path: filePath });
                const nextPath = item.dataFile;
                if (item.type === 'subcategories') {
                    displayCategoryLevel(nextPath, appState);
                } else {
                    displayProductLevel(nextPath, appState);
                }
            };
            cell.appendChild(tile);
            gridWrapper.appendChild(cell);
        });
        subCategoriesContainer.appendChild(gridWrapper);
    } catch (error) {
        console.error("Error loading category level:", error);
        subCategoriesContainer.innerHTML = `<p>Error loading content.</p>`;
    }
}

/**
 * Displays a grid of products from a manifest file.
 * @param {string} manifestFilePath - The path to the products.json manifest file.
 * @param {object} appState - The current state of the application.
 */
export async function displayProductLevel(manifestFilePath, appState) {
    showBackButton(appState.translations);
    const subCategoriesContainer = document.getElementById('sub-categories');
    const mainCategoriesContainer = document.getElementById('main-categories');
    if (mainCategoriesContainer) mainCategoriesContainer.classList.add('hidden');

    showLoadingMessage(subCategoriesContainer, appState.translations);

    try {
        const manifestResponse = await fetch(manifestFilePath);
        if (!manifestResponse.ok) throw new Error(`Could not load manifest: ${manifestFilePath}`);
        const manifest = await manifestResponse.json();
        
        if (!manifest.basePath || !Array.isArray(manifest.files)) {
             console.error("Invalid manifest format:", manifest);
             subCategoriesContainer.innerHTML = `<p>Error loading products.</p>`;
             return;
        }

        const basePath = manifest.basePath;
        const files = manifest.files;

        const productPromises = files.map(file => fetch(basePath + file).then(res => res.json()));
        const products = await Promise.all(productPromises);

        subCategoriesContainer.innerHTML = '';

        const gridWrapper = document.createElement('div');
        gridWrapper.className = 'product-grid';

        products.forEach(product => {
            const tile = document.createElement('div');
            if (product.type === 'promo-panel') {
                tile.className = 'promo-panel';
                if (product.style) tile.classList.add(`promo-${product.style}`);
                if (product.backgroundColor) tile.style.backgroundColor = product.backgroundColor;
                if (product.textColor) tile.style.color = product.textColor;
                
                let content = '';
                if (product.title) content += `<h3>${product.title}</h3>`;
                if (product.text) content += `<p>${product.text}</p>`;
                tile.innerHTML = content;
            } else if (product.type === 'recipe-panel') {
                tile.className = 'recipe-panel';
                if (product.style) tile.classList.add(`promo-${product.style}`);
                if (product.backgroundVideo) {
                    const video = document.createElement('video');
                    video.autoplay = true;
                    video.loop = true;
                    video.muted = true;
                    video.playsInline = true;
                    const source = document.createElement('source');
                    source.src = product.backgroundVideo;
                    source.type = 'video/mp4';
                    video.appendChild(source);
                    tile.appendChild(video);
                } else if (product.backgroundImage) {
                    tile.style.backgroundImage = `url("${product.backgroundImage}")`;
                }
                const contentWrapper = document.createElement('div');
                contentWrapper.className = 'recipe-panel-content';
                let content = '';
                if (product.title) content += `<h3>${product.title}</h3>`;
                if (product.description) content += `<p class="recipe-description">${product.description}</p>`;
                if (product.featuredProducts && Array.isArray(product.featuredProducts)) {
                    const featuredTitle = appState.translations.featuredProductsTitle || 'Featured Products:';
                    content += `<h4 class="featured-products-title">${featuredTitle}</h4>`;
                    content += '<ul>';
                    product.featuredProducts.forEach(ingredient => {
                        content += `<li>${ingredient}</li>`;
                    });
                    content += '</ul>';
                }
                contentWrapper.innerHTML = content;
                tile.appendChild(contentWrapper);
            } else {
                tile.className = 'tile';
                tile.style.backgroundImage = `url("${product.image}")`;
                tile.innerHTML = `<h2>${product.name}</h2>`;
                tile.onclick = () => showProductDetails(product, appState.translations);
            }
            gridWrapper.appendChild(tile);
        });
        subCategoriesContainer.appendChild(gridWrapper);
    } catch (error) {
        console.error("Error loading product level:", error);
        subCategoriesContainer.innerHTML = `<p>Error loading products.</p>`;
    }
}

