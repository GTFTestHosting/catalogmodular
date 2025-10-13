document.addEventListener('DOMContentLoaded', () => {
    // ---ELEMENT REFERENCES---
    const mainCategoriesContainer = document.getElementById('main-categories');
    const subCategoriesContainer = document.getElementById('sub-categories');
    const modal = document.getElementById('product-modal');
    const closeModal = document.querySelector('.close-button');
    const langToggle = document.getElementById('lang-toggle-checkbox');
    const printButton = document.getElementById('print-button');
    const backButtonPlaceholder = document.getElementById('back-button-placeholder');

    // ---STATE MANAGEMENT---
    let currentLanguage = 'en';
    let translations = {};
    let navigationHistory = [];
    let currentViewFunction = null; 
    let currentViewPath = '';

    // ---CORE TRANSLATION FUNCTIONS---
    async function loadLanguage(lang) {
        try {
            const response = await fetch(`lang/${lang}.json`);
            if (!response.ok) throw new Error('Language file not found');
            translations = await response.json();
            currentLanguage = lang;
            applyStaticTranslations();
        } catch (error) {
            console.error(`Failed to load language ${lang}:`, error);
        }
    }

    function applyStaticTranslations() {
        document.querySelectorAll('[data-lang-key]').forEach(elem => {
            const key = elem.getAttribute('data-lang-key');
            if (translations[key]) {
                elem.textContent = translations[key];
            }
        });
    }

    // ---DYNAMIC CONTENT DISPLAY FUNCTIONS---
    async function displayCategoryLevel(filePath) {
        currentViewFunction = () => displayCategoryLevel(filePath);
        currentViewPath = filePath;

        showLoadingMessage(subCategoriesContainer);
        mainCategoriesContainer.classList.add('hidden');
        subCategoriesContainer.classList.remove('hidden');

        try {
            const response = await fetch(filePath);
            const items = await response.json();
            subCategoriesContainer.innerHTML = '';

            showBackButton();

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
                    navigationHistory.push({ type: 'category', path: filePath });
                    const nextPath = item.dataFile;
                    if (item.type === 'subcategories') {
                        displayCategoryLevel(nextPath);
                        preloadSubcategoryImages(nextPath);
                    } else {
                        displayProductLevel(nextPath);
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

    async function displayProductLevel(manifestFilePath) {
        currentViewFunction = () => displayProductLevel(manifestFilePath);
        currentViewPath = manifestFilePath;

        showLoadingMessage(subCategoriesContainer);
        mainCategoriesContainer.classList.add('hidden');
        subCategoriesContainer.classList.remove('hidden');

        try {
            const manifestResponse = await fetch(manifestFilePath);
            const manifest = await manifestResponse.json();
            const basePath = manifest.basePath;
            const files = manifest.files;

            const productPromises = files.map(file => fetch(basePath + file).then(res => res.json()));
            const products = await Promise.all(productPromises);

            subCategoriesContainer.innerHTML = '';
            showBackButton();

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
                    
                    // --- VIDEO LOGIC RESTORED ---
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
                    // --- END OF RESTORED LOGIC ---
                    
                    const contentWrapper = document.createElement('div');
                    contentWrapper.className = 'recipe-panel-content';
                    
                    let content = '';
                    if (product.title) content += `<h3>${product.title}</h3>`;
                    if (product.description) content += `<p class="recipe-description">${product.description}</p>`;
                    if (product.featuredProducts && Array.isArray(product.featuredProducts)) {
                        const featuredTitle = translations.featuredProductsTitle || 'Featured Products:';
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
                    tile.onclick = () => showProductDetails(product);
                }
                gridWrapper.appendChild(tile);
            });
            subCategoriesContainer.appendChild(gridWrapper);

        } catch (error) {
            console.error("Error loading product level:", error);
            subCategoriesContainer.innerHTML = `<p>Error loading products.</p>`;
        }
    }
    
    // --- PRELOADING FUNCTIONS ---
    async function preloadSubcategoryImages(subcategoryFilePath) {
        try {
            const response = await fetch(subcategoryFilePath);
            if (!response.ok) return;
            const subItems = await response.json();
            subItems.forEach(item => {
                if (item.type === 'products') {
                    preloadImagesForManifest(item.dataFile);
                }
            });
        } catch (error) {
            console.warn(`Could not preload subcategory images for ${subcategoryFilePath}`, error);
        }
    }

    async function preloadImagesForManifest(manifestFilePath) {
        try {
            const manifestResponse = await fetch(manifestFilePath);
            if (!manifestResponse.ok) return;
            const manifest = await manifestResponse.json();
            if (manifest && Array.isArray(manifest.files)) {
                const basePath = manifest.basePath;
                const files = manifest.files;
                const productPromises = files.map(file => fetch(basePath + file).then(res => res.json()));
                const products = await Promise.all(productPromises);
                products.forEach(product => {
                    if (product.image) {
                        const img = new Image();
                        img.src = product.image;
                    }
                });
            }
        } catch (error) {
            console.warn(`Preloading failed for ${manifestFilePath}:`, error);
        }
    }


    // ---HELPER FUNCTIONS---
    function showBackButton() {
        backButtonPlaceholder.innerHTML = '';
        const backButton = document.createElement('button');
        backButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
        `;
        backButton.className = 'back-button';
        backButton.onclick = goBack;
        backButtonPlaceholder.appendChild(backButton);
    }

    function hideBackButton() {
        backButtonPlaceholder.innerHTML = '';
    }

    function goBack() {
        const lastState = navigationHistory.pop();
        if (lastState) {
            if (lastState.type === 'catalog') {
                initializeCatalog();
            } else if (lastState.type === 'category') {
                displayCategoryLevel(lastState.path);
            }
        }
    }

    function showLoadingMessage(container) {
        container.innerHTML = `<h2>${translations.loading || 'Loading...'}</h2>`;
    }
    
    function showProductDetails(product) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent body scroll
        document.getElementById('modal-img').src = product.image;
        document.getElementById('modal-title').textContent = product.name;
        document.getElementById('modal-description').textContent = product.description;
        document.getElementById('modal-specs').textContent = product.specs;
        document.getElementById('modal-shipping').textContent = product.shipping;
    }
    
    // --- PRINT-SPECIFIC LOGIC (SIMPLIFIED) ---
    async function handlePrintRequest() {
        printButton.textContent = 'Generating...';
        printButton.disabled = true;
        try {
            const fullCatalogData = await fetchAllData(`data/${currentLanguage}/categories.json`);
            buildPrintHtml(fullCatalogData);
            window.print();
        } catch (error) {
            console.error("Failed to generate print view:", error);
            alert("Sorry, there was an error generating the catalog for printing.");
        } finally {
            printButton.textContent = translations.printButton || 'Print Catalog';
            printButton.disabled = false;
        }
    }

    async function fetchAllData(filePath) {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error(`Failed to fetch ${filePath}`);
        const items = await response.json();
        const processedItems = await Promise.all(items.map(async (item) => {
            if (item.type === 'subcategories') {
                item.children = await fetchAllData(item.dataFile);
            } else if (item.type === 'products') {
                try {
                    const manifestResponse = await fetch(item.dataFile);
                    const manifest = await manifestResponse.json();
                    if (manifest && Array.isArray(manifest.files)) {
                        const productPromises = manifest.files.map(file => fetch(manifest.basePath + file).then(res => res.json()));
                        item.products = await Promise.all(productPromises);
                    } else {
                        item.products = [];
                    }
                } catch (e) {
                    console.warn(`Could not process manifest for ${item.name}`, e);
                    item.products = [];
                }
            }
            return item;
        }));
        return processedItems;
    }
    
    function buildPrintHtml(data) {
        const printContainer = document.getElementById('print-view');
        let fullHtml = '';

        // 1. Build Cover Page
        fullHtml += `
            <div class="print-cover-page">
                <img src="images/logos/GTF_Logo.png" class="cover-logo" alt="Company Logo">
                <h1>Product Catalog</h1>
                <h2>${new Date().getFullYear()}</h2>
                <p>${translations.companyTitle || 'Graciana Tortilla Factory'}</p>
            </div>`;

        // 2. Build Main Content Pages (No Index)
        function renderProducts(products) {
            return products.map(product => `
                <div class="print-product">
                    <div class="print-product-details">
                        <h3>${product.name}</h3>
                        <p>${product.description || ''}</p>
                        <p><strong>${translations.modalSpecs || 'Specifications'}:</strong> ${product.specs || ''}</p>
                        <p><strong>${translations.modalShipping || 'Shipping'}:</strong> ${product.shipping || ''}</p>
                    </div>
                </div>`).join('');
        }

        function renderLevel(items) {
            let contentHtml = '';
            items.forEach(item => {
                if (item.children) {
                     contentHtml += `<div class="print-subcategory"><h2>${item.name}</h2>${renderLevel(item.children)}</div>`;
                } else if (item.products) {
                     contentHtml += `<div class="print-subcategory"><h2>${item.name}</h2>${renderProducts(item.products)}</div>`;
                }
            });
            return contentHtml;
        }

        data.forEach(category => {
            fullHtml += `
                <section class="print-category">
                    <div class="print-category-header">
                        <img src="${category.image}" class="category-banner" alt="${category.name} Banner">
                        <h1>${category.name}</h1>
                    </div>
                    <div class="print-product-list">
                         ${renderLevel(category.children || (category.products ? [category] : []))}
                    </div>
                </section>`;
        });

        printContainer.innerHTML = fullHtml;
    }


    // ---INITIALIZATION AND EVENT LISTENERS---
    
    langToggle.addEventListener('change', async () => {
        const newLang = langToggle.checked ? 'es' : 'en';
        await loadLanguage(newLang);
        if (currentViewFunction) {
            const translatedPath = currentViewPath.replace(/data\/(en|es)\//, `data/${newLang}/`);
            if (currentViewPath.endsWith('categories.json')) {
                 initializeCatalog();
            } else {
                const isProductView = !!subCategoriesContainer.querySelector('.product-grid');
                const newViewFunction = () => (isProductView ? displayProductLevel(translatedPath) : displayCategoryLevel(translatedPath));
                newViewFunction();
            }
        }
    });

    printButton.addEventListener('click', handlePrintRequest);
    closeModal.onclick = () => { 
        modal.style.display = 'none'; 
        document.body.style.overflow = ''; // Restore body scroll
    };
    window.onclick = (event) => { 
        if (event.target == modal) { 
            modal.style.display = 'none'; 
            document.body.style.overflow = ''; // Restore body scroll
        } 
    };

    async function initializeCatalog() {
        navigationHistory = [];
        hideBackButton();
        const categoriesPath = `data/${currentLanguage}/categories.json`;
        currentViewFunction = initializeCatalog;
        currentViewPath = categoriesPath;

        showLoadingMessage(mainCategoriesContainer);
        subCategoriesContainer.classList.add('hidden');
        mainCategoriesContainer.classList.remove('hidden');
        mainCategoriesContainer.className = 'category-container';

        try {
            const response = await fetch(categoriesPath);
            const categories = await response.json();
            mainCategoriesContainer.innerHTML = '';

            categories.forEach(category => {
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.style.backgroundImage = `url("${category.image}")`;
                tile.innerHTML = `<h2>${category.name}</h2>`;
                tile.onclick = () => {
                    navigationHistory.push({ type: 'catalog', path: categoriesPath });
                    const nextPath = category.dataFile;
                    if (category.type === 'subcategories') {
                        displayCategoryLevel(nextPath);
                        preloadSubcategoryImages(nextPath);
                    } else {
                        displayProductLevel(nextPath);
                    }
                };
                mainCategoriesContainer.appendChild(tile);
            });
        } catch (error) {
            console.error("Error initializing catalog:", error);
            mainCategoriesContainer.innerHTML = `<p>Error loading catalog.</p>`;
        }
    }

    // ---APPLICATION START---
    async function startApp() {
        await loadLanguage(currentLanguage);
        initializeCatalog();
    }
    
    startApp();
});

