document.addEventListener('DOMContentLoaded', () => {
    // ---ELEMENT REFERENCES---
    const pageContentContainer = document.getElementById('page-content');
    const modal = document.getElementById('product-modal');
    const closeModal = document.querySelector('.close-button');
    const langToggle = document.getElementById('lang-toggle-checkbox');
    const printButton = document.getElementById('print-button');
    const backButtonPlaceholder = document.getElementById('back-button-placeholder');
    const navLinks = document.querySelectorAll('.nav-link');
    const hamburgerBtn = document.querySelector('.hamburger-btn');
    const mainNav = document.querySelector('.main-nav');
    const overlay = document.querySelector('.overlay');

    // ---STATE MANAGEMENT---
    let currentLanguage = 'en';
    let translations = {};
    let navigationHistory = [];

    // --- ================================================ ---
    // --- MOBILE NAVIGATION LOGIC ---
    // --- ================================================ ---
    function openMobileMenu() {
        mainNav.classList.add('is-open');
        overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeMobileMenu() {
        mainNav.classList.remove('is-open');
        overlay.classList.add('hidden');
        document.body.style.overflow = '';
    }

    // --- ================================================ ---
    // --- ROUTING & PAGE LOADING LOGIC ---
    // --- ================================================ ---
    function renderPage(page, options = {}) {
        navLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.page === page);
        });
        printButton.classList.toggle('hidden', page !== 'catalog');
        
        switch (page) {
            case 'catalog':
                initializeCatalog(options.startCategory);
                break;
            case 'home':
            case 'about':
            case 'contact':
                loadHtmlContent(page);
                break;
            default:
                loadHtmlContent('home');
        }
    }

    async function loadHtmlContent(page) {
        hideBackButton();
        pageContentContainer.innerHTML = `<h2>${translations.loading || 'Loading...'}</h2>`;
        try {
            const response = await fetch(`pages/${page}.html`);
            if (!response.ok) throw new Error('Page not found');
            const html = await response.text();
            pageContentContainer.innerHTML = html;
            
            if (page === 'home') {
                setupHomeNavTiles();
            }
            applyStaticTranslations(); 
        } catch (error) {
            console.error(`Failed to load page ${page}:`, error);
            pageContentContainer.innerHTML = `<p>Error loading page content.</p>`;
        }
    }
    
    function setupHomeNavTiles() {
        document.querySelectorAll('.home-nav-tile').forEach(tile => {
            tile.addEventListener('click', () => {
                const targetPage = tile.dataset.page;
                const startCategory = tile.dataset.categoryStart;
                renderPage(targetPage, { startCategory });
            });
        });
    }

    // --- ================================================ ---
    // --- CATALOG-SPECIFIC LOGIC ---
    // --- ================================================ ---
    async function initializeCatalog(startCategorySlug = null) {
        navigationHistory = [];
        hideBackButton();
        pageContentContainer.innerHTML = `
            <div id="main-categories" class="category-container"></div>
            <div id="sub-categories"></div>
        `;
        const mainCategoriesContainer = document.getElementById('main-categories');
        
        showLoadingMessage(mainCategoriesContainer);

        try {
            const categoriesPath = `data/${currentLanguage}/categories.json`;
            const response = await fetch(categoriesPath);
            const categories = await response.json();

            if (startCategorySlug) {
                const targetCategory = categories.find(cat => createSlug(cat.name) === startCategorySlug);
                if (targetCategory) {
                    navigationHistory.push({ type: 'catalog' });
                    if (targetCategory.type === 'subcategories') {
                        displayCategoryLevel(targetCategory.dataFile);
                    } else {
                        displayProductLevel(targetCategory.dataFile);
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
                    navigationHistory.push({ type: 'catalog' });
                    const nextPath = category.dataFile;
                    if (category.type === 'subcategories') {
                        displayCategoryLevel(nextPath);
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

    async function displayCategoryLevel(filePath) {
        showBackButton();
        const subCategoriesContainer = document.getElementById('sub-categories');
        const mainCategoriesContainer = document.getElementById('main-categories');
        if (mainCategoriesContainer) mainCategoriesContainer.classList.add('hidden');
        
        showLoadingMessage(subCategoriesContainer);

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
                    navigationHistory.push({ type: 'category', path: filePath });
                    const nextPath = item.dataFile;
                    if (item.type === 'subcategories') {
                        displayCategoryLevel(nextPath);
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
        showBackButton();
        const subCategoriesContainer = document.getElementById('sub-categories');
        const mainCategoriesContainer = document.getElementById('main-categories');
        if (mainCategoriesContainer) mainCategoriesContainer.classList.add('hidden');

        showLoadingMessage(subCategoriesContainer);

        try {
            const manifestResponse = await fetch(manifestFilePath);
            const manifest = await manifestResponse.json();
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

    // ---HELPER FUNCTIONS---
    function createSlug(text) {
        return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

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

    function showBackButton() {
        backButtonPlaceholder.innerHTML = '';
        const backButton = document.createElement('button');
        backButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>`;
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
                renderPage('catalog');
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
        document.body.style.overflow = 'hidden';
        document.getElementById('modal-img').src = product.image;
        document.getElementById('modal-title').textContent = product.name;
        document.getElementById('modal-description').textContent = product.description;
        document.getElementById('modal-specs').textContent = product.specs;
        document.getElementById('modal-shipping').textContent = product.shipping;
    }
    
    // --- PRINT LOGIC ---
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
        printContainer.innerHTML = '';

        let fullHtml = `
            <div class="print-cover-page">
                <img src="images/logos/GTF_Logo.png" class="cover-logo" alt="Company Logo">
                <h1>Product Catalog</h1>
                <h2>${new Date().getFullYear()}</h2>
                <p>${translations.companyTitle || 'Graciana Tortilla Factory'}</p>
            </div>`;

        function renderProducts(products) {
            return products.map(product => `
                <div class="print-product">
                    <img src="${product.image}" alt="${product.name}">
                    <div class="print-product-details">
                        <h3>${product.name}</h3>
                        <p>${product.description || ''}</p>
                        <p><strong>${translations.modalSpecs || 'Specifications'}:</strong> ${product.specs || ''}</p>
                        <p><strong>${translations.modalShipping || 'Shipping'}:</strong> ${product.shipping || ''}</p>
                    </div>
                </div>`).join('');
        }

        function renderLevel(items) {
            let html = '';
            items.forEach(item => {
                if (item.children) {
                     html += `<div class="print-subcategory"><h2>${item.name}</h2>${renderLevel(item.children)}</div>`;
                } else if (item.products) {
                     html += `<div class="print-subcategory"><h2>${item.name}</h2><div class="print-product-list">${renderProducts(item.products)}</div></div>`;
                }
            });
            return html;
        }
        
        data.forEach(category => {
            fullHtml += `
                <section class="print-category">
                    <div class="print-category-header">
                        <img src="${category.image}" class="category-banner" alt="${category.name} Banner">
                        <h1>${category.name}</h1>
                    </div>
                    ${renderLevel(category.children || (category.products ? [category] : []))}
                </section>`;
        });
        
        printContainer.innerHTML = fullHtml;
    }


    // ---INITIALIZATION AND EVENT LISTENERS---
    hamburgerBtn.addEventListener('click', openMobileMenu);
    overlay.addEventListener('click', closeMobileMenu);
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            closeMobileMenu();
            renderPage(link.dataset.page);
        });
    });

    langToggle.addEventListener('change', async () => {
        const newLang = langToggle.checked ? 'es' : 'en';
        await loadLanguage(newLang);
        const activeLink = document.querySelector('.nav-link.active');
        if (activeLink) {
            renderPage(activeLink.dataset.page);
        }
    });
    
    printButton.addEventListener('click', handlePrintRequest);

    closeModal.onclick = () => { 
        modal.style.display = 'none'; 
        document.body.style.overflow = '';
    };
    window.onclick = (event) => { 
        if (event.target == modal) { 
            modal.style.display = 'none'; 
            document.body.style.overflow = '';
        } 
    };

    // ---APPLICATION START---
    async function startApp() {
        await loadLanguage(currentLanguage);
        // THIS IS THE KEY FIX: Use a timeout to ensure the DOM is fully ready
        setTimeout(() => {
            renderPage('home');
        }, 0);
    }
    
    startApp();
});

