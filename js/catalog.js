import { pushHistory } from './state.js';
import { showBackButton, hideBackButton, showLoadingMessage, showProductDetails } from './ui.js';
import { createSlug } from './utils.js';

const pageContentContainer = document.getElementById('page-content');

export async function initializeCatalog(appState, startCategorySlug = null) {
    appState.navigationHistory = []; 
    hideBackButton();

    pageContentContainer.innerHTML = `
        <div id="main-categories"></div>
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
                pushHistory({ type: 'catalog' });
                if (targetCategory.type === 'subcategories') {
                    displayCategoryLevel(targetCategory.dataFile, appState);
                } else {
                    displayProductLevel(targetCategory.dataFile, appState);
                }
                return;
            }
        }

        mainCategoriesContainer.innerHTML = '';
        
        // THIS IS THE KEY CHANGE: Create a dedicated wrapper for the grid
        const gridWrapper = document.createElement('div');
        gridWrapper.className = 'category-wrapper';

        categories.forEach(category => {
            const cell = document.createElement('div');
            cell.className = 'category-cell';

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
            
            cell.appendChild(tile);
            gridWrapper.appendChild(cell); // Add cell to the new wrapper
        });
        
        mainCategoriesContainer.appendChild(gridWrapper); // Add the wrapper to the main container

    } catch (error) {
        console.error("Error initializing catalog:", error);
        mainCategoriesContainer.innerHTML = `<p>Error loading catalog.</p>`;
    }
}

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

