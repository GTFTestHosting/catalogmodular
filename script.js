document.addEventListener('DOMContentLoaded', () => {
    // ---ELEMENT REFERENCES---
    const mainCategoriesContainer = document.getElementById('main-categories');
    const subCategoriesContainer = document.getElementById('sub-categories');
    const modal = document.getElementById('product-modal');
    const closeModal = document.querySelector('.close-button');
    const langToggle = document.getElementById('lang-toggle-checkbox');

    // ---STATE MANAGEMENT---
    let currentLanguage = 'en';
    let translations = {};
    let navigationHistory = [];
    let currentViewFunction = null;
    let currentViewPath = '';

    // ---CORE TRANSLATION FUNCTIONS---

    async function loadLanguage(lang) {
        const response = await fetch(`lang/${lang}.json`);
        translations = await response.json();
        currentLanguage = lang;
        applyStaticTranslations();
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
        subCategoriesContainer.className = 'subcategory-grid';

        try {
            const response = await fetch(filePath);
            const items = await response.json();
            subCategoriesContainer.innerHTML = '';

            if (navigationHistory.length > 0) {
                subCategoriesContainer.appendChild(createBackButton());
            }

            items.forEach(item => {
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.style.backgroundImage = `url("${item.image}")`;
                tile.innerHTML = `<h2>${item.name}</h2>`;
                tile.onclick = () => {
                    navigationHistory.push(filePath);
                    const nextPath = item.dataFile.replace('data/en/', `data/${currentLanguage}/`).replace('data/es/', `data/${currentLanguage}/`);
                    if (item.type === 'subcategories') {
                        displayCategoryLevel(nextPath);
                        preloadSubcategoryImages(nextPath);
                    } else {
                        displayProductLevel(nextPath);
                    }
                };
                subCategoriesContainer.appendChild(tile);
            });
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
        subCategoriesContainer.className = 'product-grid';

        try {
            const manifestResponse = await fetch(manifestFilePath);
            const manifest = await manifestResponse.json();
            const basePath = manifest.basePath;
            const files = manifest.files;

            const productPromises = files.map(file => fetch(basePath + file).then(res => res.json()));
            const products = await Promise.all(productPromises);

            subCategoriesContainer.innerHTML = '';
            subCategoriesContainer.appendChild(createBackButton());

            products.forEach(product => {
                const tile = document.createElement('div');

                if (product.type === 'promo-panel') {
                    tile.className = 'promo-panel';
                    if (product.style) {
                        tile.classList.add(`promo-${product.style}`);
                    }
                    if (product.backgroundColor) tile.style.backgroundColor = product.backgroundColor;
                    if (product.textColor) tile.style.color = product.textColor;

                    let content = '';
                    if (product.title) content += `<h3>${product.title}</h3>`;
                    if (product.text) content += `<p>${product.text}</p>`;
                    tile.innerHTML = content;

                } else {
                    tile.className = 'tile';
                    tile.style.backgroundImage = `url("${product.image}")`;
                    tile.innerHTML = `<h2>${product.name}</h2>`;
                    tile.onclick = () => showProductDetails(product);
                }

                subCategoriesContainer.appendChild(tile);
            });
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
                    const translatedDataFile = item.dataFile.replace('data/en/', `data/${currentLanguage}/`).replace('data/es/', `data/${currentLanguage}/`);
                    preloadImagesForManifest(translatedDataFile);
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
        } catch (error) {
            console.warn(`Preloading failed for ${manifestFilePath}:`, error);
        }
    }


    // ---HELPER FUNCTIONS---

    function createBackButton() {
        const container = document.createElement('div');
        container.className = 'back-button-container'; // Class for sticky behavior
        container.style.gridColumn = '1 / -1';
        const backButton = document.createElement('button');
        backButton.textContent = translations.backButton || 'Back';
        backButton.className = 'back-button';
        backButton.onclick = goBack;
        container.appendChild(backButton);
        return container;
    }

    function goBack() {
        const lastPath = navigationHistory.pop();
        if (lastPath) {
            if (lastPath === `data/${currentLanguage}/categories.json`) {
                initializeCatalog();
            } else {
                displayCategoryLevel(lastPath);
            }
        }
    }

    function showLoadingMessage(container) {
        container.innerHTML = `<h2>${translations.loading || 'Loading...'}</h2>`;
    }

    function showProductDetails(product) {
        modal.style.display = 'block';
        document.getElementById('modal-img').src = product.image;
        document.getElementById('modal-title').textContent = product.name;
        document.getElementById('modal-description').textContent = product.description;
        document.getElementById('modal-specs').textContent = product.specs;
        document.getElementById('modal-shipping').textContent = product.shipping;
    }

    // ---INITIALIZATION AND EVENT LISTENERS---

    // NEW: Add a scroll listener to the window to handle the floating back button
    function handleScroll() {
        const backButtonContainer = document.querySelector('.back-button-container');
        if (backButtonContainer) {
            // Add the floating class when user scrolls down more than a small amount (e.g., 20px)
            if (window.scrollY > 20) {
                backButtonContainer.classList.add('is-floating');
            } else {
                backButtonContainer.classList.remove('is-floating');
            }
        }
    }
    window.addEventListener('scroll', handleScroll);


    langToggle.addEventListener('change', async () => {
        const newLang = langToggle.checked ? 'es' : 'en';
        await loadLanguage(newLang);

        if (currentViewFunction) {
            const translatedPath = currentViewPath.replace('data/en/', `data/${newLang}/`).replace('data/es/', `data/${newLang}/`);
            if (currentViewPath.endsWith('categories.json')) {
                initializeCatalog();
            } else {
                const isProductView = subCategoriesContainer.className === 'product-grid';
                currentViewFunction = () => (isProductView ? displayProductLevel(translatedPath) : displayCategoryLevel(translatedPath));
                currentViewFunction();
            }
        }
    });

    closeModal.onclick = () => { modal.style.display = 'none'; };
    window.onclick = (event) => { if (event.target == modal) { modal.style.display = 'none'; } };

    async function initializeCatalog() {
        navigationHistory = [];
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
                    navigationHistory.push(categoriesPath);
                    const nextPath = category.dataFile.replace('data/en/', `data/${currentLanguage}/`).replace('data/es/', `data/${currentLanguage}/`);
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

