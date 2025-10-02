document.addEventListener('DOMContentLoaded', () => {
    const mainCategoriesContainer = document.getElementById('main-categories');
    const subCategoriesContainer = document.getElementById('sub-categories');
    const modal = document.getElementById('product-modal');
    const closeModal = document.querySelector('.close-button');

    // NEW: Navigation history to handle the "Back" button functionality
    let navigationHistory = [];

    // Fetches and displays a list of categories (or sub-categories)
    async function displayCategoryLevel(filePath) {
        mainCategoriesContainer.classList.add('hidden');
        subCategoriesContainer.classList.remove('hidden');
        subCategoriesContainer.innerHTML = '<h2>Loading...</h2>';

        try {
            const response = await fetch(filePath);
            if (!response.ok) throw new Error('Could not load data.');
            const items = await response.json();

            subCategoriesContainer.innerHTML = ''; // Clear loading

            // Add back button only if there is history
            if (navigationHistory.length > 0) {
                const backButton = createBackButton();
                subCategoriesContainer.appendChild(backButton);
            }

            items.forEach(item => {
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.style.backgroundImage = `url(${item.image})`;
                tile.innerHTML = `<h2>${item.name}</h2>`;
                
                // CRITICAL: Check the type to decide what to do on click
                tile.onclick = () => {
                    navigationHistory.push(filePath); // Save current level before moving to the next
                    if (item.type === 'subcategories') {
                        displayCategoryLevel(item.dataFile); // Display next level of categories
                    } else {
                        displayProductLevel(item.dataFile); // Display final product list
                    }
                };
                subCategoriesContainer.appendChild(tile);
            });

        } catch (error) {
            console.error("Error loading category level:", error);
            subCategoriesContainer.innerHTML = `<p>Error loading content.</p>`;
        }
    }

    // Fetches and displays the final list of products
    async function displayProductLevel(filePath) {
        mainCategoriesContainer.classList.add('hidden');
        subCategoriesContainer.classList.remove('hidden');
        subCategoriesContainer.innerHTML = '<h2>Loading...</h2>';

        try {
            const response = await fetch(filePath);
            if (!response.ok) throw new Error('Could not load products.');
            const products = await response.json();

            subCategoriesContainer.innerHTML = ''; // Clear loading

            // Always add a back button on the product level
            const backButton = createBackButton();
            subCategoriesContainer.appendChild(backButton);

            if (products.length === 0) {
                 subCategoriesContainer.innerHTML += `<p style="grid-column: 1 / -1; text-align: center;">No products in this category yet.</p>`;
            }

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
    
    // Function to create a styled "Back" button
    function createBackButton() {
        const backButton = document.createElement('button');
        backButton.textContent = 'Back';
        backButton.className = 'back-button';
        backButton.style.gridColumn = '1 / -1'; // Ensure it spans the full width
        backButton.onclick = goBack;
        return backButton;
    }

    // Handles the "Back" button click
    function goBack() {
        const lastPath = navigationHistory.pop();
        if (lastPath) {
            // Check if we are going back to the top level
            if(lastPath === 'data/categories.json') {
                initializeCatalog();
            } else {
                displayCategoryLevel(lastPath);
            }
        }
    }
    
    // Shows the product detail modal (this function doesn't change)
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
        navigationHistory = []; // Reset history
        subCategoriesContainer.classList.add('hidden');
        mainCategoriesContainer.classList.remove('hidden');
        mainCategoriesContainer.innerHTML = '<h2>Loading...</h2>';

        try {
            const response = await fetch('data/categories.json');
            if (!response.ok) throw new Error('Could not load categories.');
            const categories = await response.json();

            mainCategoriesContainer.innerHTML = ''; // Clear loading

            categories.forEach(category => {
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.style.backgroundImage = `url(${category.image})`;
                tile.innerHTML = `<h2>${category.name}</h2>`;
                tile.onclick = () => {
                     navigationHistory.push('data/categories.json'); // Save the root level
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

