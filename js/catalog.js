/**
 * This module handles the logic for rendering the catalog section.
 */
import { pushHistory } from './state.js';
import { showBackButton, hideBackButton, showLoadingMessage, showProductDetails } from './ui.js';
import { createSlug } from './utils.js';

const pageContentContainer = document.getElementById('page-content');

export async function initializeCatalog(appState, startCategorySlug = null) {
    appState.navigationHistory = []; 
    hideBackButton();

    pageContentContainer.innerHTML = `
        <div id="main-categories"></div>
        <div id="sub-categories" class="hidden"></div>
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
        const gridWrapper = document.createElement('div');
        gridWrapper.className = 'category-wrapper';

        categories.forEach(category => {
            const cell = document.createElement('div');
            cell.className = 'category-cell';
            if (category.style) {
                cell.classList.add(`promo-${category.style}`);
            }

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
            gridWrapper.appendChild(cell);
        });
        
        mainCategoriesContainer.appendChild(gridWrapper);

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
    if (subCategoriesContainer) subCategoriesContainer.classList.remove('hidden');
    
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
            if (item.style) {
                cell.classList.add(`promo-${item.style}`);
            }

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
    if (subCategoriesContainer) subCategoriesContainer.classList.remove('hidden');


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
            const cell = document.createElement('div');
            cell.className = 'product-cell';

            const panel = document.createElement('div');
            
            if (product.style) {
                cell.classList.add(`promo-${product.style}`);
            }

            if (product.type === 'promo-panel') {
                panel.className = 'promo-panel';
                if (product.backgroundImage) {
                    panel.style.backgroundImage = `url('${product.backgroundImage}')`;
                    panel.classList.add('has-bg-image');
                } else {
                    panel.style.backgroundColor = product.backgroundColor;
                }
                const promoTitle = product.title || (appState.translations[product.titleKey] || '');
                const promoText = product.text || (appState.translations[product.textKey] || '');
                const promoTitleEl = document.createElement('h3');
                promoTitleEl.innerHTML = promoTitle;
                if (product.titleColor) promoTitleEl.style.color = product.titleColor;
                const promoTextEl = document.createElement('p');
                promoTextEl.innerHTML = promoText;
                if (product.paragraphColor) {
                    promoTextEl.style.color = product.paragraphColor;
                } else if (product.textColor) {
                    promoTextEl.style.color = product.textColor;
                }
                panel.appendChild(promoTitleEl);
                panel.appendChild(promoTextEl);

            } else if (product.type === 'recipe-panel') {
                panel.className = 'recipe-panel';
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
                    panel.appendChild(video);
                } else if (product.backgroundImage) {
                    panel.style.backgroundImage = `url("${product.backgroundImage}")`;
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
                panel.appendChild(contentWrapper);
            } else {
                panel.className = 'tile';
                panel.style.backgroundImage = `url("${product.image}")`;
                panel.innerHTML = `<h2>${product.name}</h2>`;
                panel.onclick = () => showProductDetails(product, appState.translations);
            }
            
            cell.appendChild(panel);
            gridWrapper.appendChild(cell);
        });
        subCategoriesContainer.appendChild(gridWrapper);
    } catch (error) {
        console.error("Error loading product level:", error);
        subCategoriesContainer.innerHTML = `<p>Error loading products.</p>`;
    }
}

