document.addEventListener('DOMContentLoaded', () => {
    const mainCategoriesContainer = document.getElementById('main-categories');
    const subCategoriesContainer = document.getElementById('sub-categories');
    const modal = document.getElementById('product-modal');
    const closeModal = document.querySelector('.close-button');

    let navigationHistory = [];

    async function displayCategoryLevel(filePath) {
        mainCategoriesContainer.classList.add('hidden');
        subCategoriesContainer.className = 'subcategory-grid';
        subCategoriesContainer.innerHTML = '<h2>Loading...</h2>';

        try {
            const response = await fetch(filePath);
            if (!response.ok) throw new Error('Could not load data.');
            const items = await response.json();

            subCategoriesContainer.innerHTML = '';

            if (navigationHistory.length > 0) {
                const backButton = createBackButton();
                subCategoriesContainer.appendChild(backButton);
            }

            items.forEach(item => {
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.style.backgroundImage=uˋrl("{item.image}")`;
                tile.innerHTML = `<h2>${item.name}</h2>`;
                
                tile.onclick = () => {
                    navigationHistory.push(filePath);
                    if (item.type === 'subcategories') {
                        displayCategoryLevel(item.dataFile);
                    } else {
                        displayProductLevel(item.dataFile);
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
        mainCategoriesContainer.classList.add('hidden');
        subCategoriesContainer.className = 'product-grid';
        subCategoriesContainer.innerHTML = '<h2>Loading...</h2>';

        try {
            const manifestResponse = await fetch(manifestFilePath);
            if (!manifestResponse.ok) throw new Error('Could not load product manifest.');
            const productPaths = await manifestResponse.json();

            subCategoriesContainer.innerHTML = '';
            const backButton = createBackButton();
            subCategoriesContainer.appendChild(backButton);

            if (productPaths.length === 0) {
                 subCategoriesContainer.innerHTML += `<p style="grid-column: 1 / -1; text-align: center;">No products in this category yet.</p>`;
                 return;
            }

            const productPromises = productPaths.map(path =>
                fetch(path).then(res => {
                    if (!res.ok) throw new Error(`Failed to load product: ${path}`);
                    return res.json();
                })
            );

            const products = await Promise.all(productPromises);

            products.forEach(product => {
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.style.backgroundImage = `url(${product.image})`;
                tile.innerHTML = `<h2>${product.name}</h2>`;
                tile.onclick = () => showProductDetails(product);
                subCategoriesContainer.appendChild(tile);
            });

        } catch (error) {
            console.error("Error loading product level:", error);
            subCategoriesContainer.innerHTML = `<p>Error loading products.</p>`;
        }
    }

    function createBackButton() {
        const wrapper = document.createElement('div');
        wrapper.style.gridColumn = '1 / -1';
        const backButton = document.createElement('button');
        backButton.textContent = 'Back';
        backButton.className = 'back-button';
        backButton.onclick = goBack;
        wrapper.appendChild(backButton);
        return wrapper;
    }

    function goBack() {
        const lastPath = navigationHistory.pop();
        if (lastPath) {
            if (lastPath === 'data/categories.json') {
                initializeCatalog();
            } else {
                displayCategoryLevel(lastPath);
            }
        }
    }

    function showProductDetails(product) {
        modal.style.display = 'block';
        document.getElementById('modal-img').src = product.image;
        document.getElementById('modal-title').textContent = product.name;
        document.getElementById('modal-description').textContent = product.description;
        document.getElementById('modal-specs').textContent = product.specs;
        document.getElementById('modal-shipping').textContent = product.shipping;
    }

    closeModal.onclick = () => { modal.style.display = 'none'; };
    window.onclick = (event) => { if (event.target == modal) { modal.style.display = 'none'; } };

    async function initializeCatalog() {
        navigationHistory = [];
        subCategoriesContainer.className = 'hidden';
        mainCategoriesContainer.classList.remove('hidden');
        mainCategoriesContainer.innerHTML = '<h2>Loading...</h2>';

        try {
            const response = await fetch('data/categories.json');
            if (!response.ok) throw new Error('Could not load categories.');
            const categories = await response.json();

            mainCategoriesContainer.innerHTML = '';

            categories.forEach(category => {
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.style.backgroundImage = `url(${category.image})`;
                tile.innerHTML = `<h2>${category.name}</h2>`;
                tile.onclick = () => {
                     navigationHistory.push('data/categories.json');
                     if (category.type === 'subcategories') {
                        displayCategoryLevel(category.dataFile);
                     } else {
                        displayProductLevel(category.dataFile);
                     }
                };
                mainCategoriesContainer.appendChild(tile);
            });
        } catch (error) {
            console.error("Error initializing catalog:", error);
            mainCategoriesContainer.innerHTML = `<p>Error loading catalog. Please try again later.</p>`;
        }
    }

    initializeCatalog();
});

