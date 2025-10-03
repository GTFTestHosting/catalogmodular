document.addEventListener('DOMContentLoaded', () => {
    const mainCategoriesContainer = document.getElementById('main-categories');
    const subCategoriesContainer = document.getElementById('sub-categories');
    const modal = document.getElementById('product-modal');
    const closeModal = document.querySelector('.close-button');

    // Navigation history to handle the "Back" button functionality
    let navigationHistory = [];

    // Fetches and displays a list of categories (or sub-categories)
    async function displayCategoryLevel(filePath) {
        mainCategoriesContainer.classList.add('hidden');
        subCategoriesContainer.classList.remove('hidden');
        subCategoriesContainer.className = 'subcategory-grid'; // Use the subcategory layout
        subCategoriesContainer.innerHTML = '<h2>Loading...</h2>';

        try {
            const response = await fetch(filePath);
            if (!response.ok) throw new Error('Could not load data.');
            const items = await response.json();

            subCategoriesContainer.innerHTML = ''; // Clear loading

            // Add back button only if there is history
            if (navigationHistory.length > 0) {
                const backButtonContainer = createBackButton();
                subCategoriesContainer.appendChild(backButtonContainer);
            }

            items.forEach(item => {
                const tile = document.createElement('div');
                tile.className = 'tile';
                // FIX: Added quotes around the image URL to handle special characters
                tile.style.backgroundImage = `url("${item.image}")`;
                tile.innerHTML = `<h2>${item.name}</h2>`;

                tile.onclick = () => {
                    navigationHistory.push(filePath); // Save current level before moving to the next
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

    // Fetches and displays the final list of products from a manifest file
    async function displayProductLevel(manifestFilePath) {
        mainCategoriesContainer.classList.add('hidden');
        subCategoriesContainer.classList.remove('hidden');
        subCategoriesContainer.className = 'product-grid'; // Use the product layout
        subCategoriesContainer.innerHTML = '<h2>Loading...</h2>';

        try {
            const manifestResponse = await fetch(manifestFilePath);
            if (!manifestResponse.ok) throw new Error(`Could not load product manifest: ${manifestFilePath}`);
            const productFiles = await manifestResponse.json();

            // Fetch all individual product JSON files concurrently
            const productPromises = productFiles.map(file => fetch(file).then(res => res.json()));
            const products = await Promise.all(productPromises);

            subCategoriesContainer.innerHTML = ''; // Clear loading

            // Always add a back button on the product level
            const backButtonContainer = createBackButton();
            subCategoriesContainer.appendChild(backButtonContainer);

            if (products.length === 0) {
                subCategoriesContainer.innerHTML += `<p style="grid-column: 1 / -1; text-align: center;">No products in this category yet.</p>`;
            }

            products.forEach(product => {
                const tile = document.createElement('div');
                tile.className = 'tile';
                // FIX: Added quotes around the image URL to handle special characters
                tile.style.backgroundImage = `url("${product.image}")`;
                tile.innerHTML = `<h2>${product.name}</h2>`;
                tile.onclick = () => showProductDetails(product);
                subCategoriesContainer.appendChild(tile);
            });

        } catch (error) {
            console.error("Error loading product level:", error);
            subCategoriesContainer.innerHTML = `<p>Error loading products.</p>`;
        }
    }

    // Function to create a styled "Back" button inside a container
    function createBackButton() {
        const container = document.createElement('div');
        container.style.gridColumn = '1 / -1'; // Ensure container spans the full width
        
        const backButton = document.createElement('button');
        backButton.textContent = 'Back';
        backButton.className = 'back-button';
        backButton.onclick = goBack;
        
        container.appendChild(backButton);
        return container;
    }

    // Handles the "Back" button click
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

    // Shows the product detail modal
    function showProductDetails(product) {
        modal.style.display = 'block';
        document.getElementById('modal-img').src = product.image;
        document.getElementById('modal-title').textContent = product.name;
        document.getElementById('modal-description').textContent = product.description;
        document.getElementById('modal-specs').textContent = product.specs;
        document.getElementById('modal-shipping').textContent = product.shipping;
    }

    // Event listeners for closing the modal
    closeModal.onclick = () => { modal.style.display = 'none'; };
    window.onclick = (event) => { if (event.target == modal) { modal.style.display = 'none'; } };

    // This is the main function that kicks everything off
    async function initializeCatalog() {
        navigationHistory = [];
        subCategoriesContainer.classList.add('hidden');
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
                // FIX: Added quotes around the image URL to handle special characters
                tile.style.backgroundImage = `url("${category.image}")`;
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

    // Start the application
    initializeCatalog();
});
