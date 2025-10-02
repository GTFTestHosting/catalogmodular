document.addEventListener('DOMContentLoaded', () => {
    // Get references to our main page elements
    const mainCategoriesContainer = document.getElementById('main-categories');
    const subCategoriesContainer = document.getElementById('sub-categories');
    const modal = document.getElementById('product-modal');
    const closeModal = document.querySelector('.close-button');

    // This is the main function that kicks everything off
    async function initializeCatalog() {
        try {
            // Fetch the master list of categories
            const response = await fetch('data/categories.json');
            if (!response.ok) throw new Error('Could not load categories.');
            const categories = await response.json();
            displayMainCategories(categories);
        } catch (error) {
            console.error("Error initializing catalog:", error);
            mainCategoriesContainer.innerHTML = `<p>Error loading catalog. Please try again later.</p>`;
        }
    }

    // Displays the main category tiles
    function displayMainCategories(categories) {
        mainCategoriesContainer.innerHTML = '';
        subCategoriesContainer.classList.add('hidden');
        mainCategoriesContainer.classList.remove('hidden');

        categories.forEach(category => {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.style.backgroundImage = `url(${category.image})`;
            tile.innerHTML = `<h2>${category.name}</h2>`;
            // When a tile is clicked, we pass the whole category object
            tile.onclick = () => displaySubCategories(category);
            mainCategoriesContainer.appendChild(tile);
        });
    }

    // Fetches and displays the products for a selected category
    async function displaySubCategories(category) {
        mainCategoriesContainer.classList.add('hidden');
        subCategoriesContainer.classList.remove('hidden');
        subCategoriesContainer.innerHTML = '<h2>Loading...</h2>'; // Show a loading message

        try {
            // Fetch the specific product data file for this category
            const response = await fetch(category.dataFile);
            if (!response.ok) throw new Error(`Could not load ${category.name} products.`);
            const products = await response.json();

            subCategoriesContainer.innerHTML = ''; // Clear loading message

            // Add the "Back to Categories" button
            const backButton = document.createElement('button');
            backButton.textContent = 'Back to Categories';
            backButton.className = 'back-button';
            backButton.onclick = initializeCatalog; // Re-run the main function to go back
            
            const buttonContainer = document.createElement('div');
            buttonContainer.style.gridColumn = '1 / -1';
            buttonContainer.appendChild(backButton);
            subCategoriesContainer.appendChild(buttonContainer);

            // Display a tile for each product
            products.forEach(product => {
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.style.backgroundImage = `url(${product.image})`;
                tile.innerHTML = `<h2>${product.name}</h2>`;
                tile.onclick = () => showProductDetails(product);
                subCategoriesContainer.appendChild(tile);
            });

        } catch (error) {
            console.error("Error loading sub-categories:", error);
            subCategoriesContainer.innerHTML = `<p>Error loading products. Please try again later.</p>`;
        }
    }

    // Shows the product detail modal (this function doesn't need to change)
    function showProductDetails(product) {
        modal.style.display = 'block';
        document.getElementById('modal-img').src = product.image;
        document.getElementById('modal-title').textContent = product.name;
        document.getElementById('modal-description').textContent = product.description;
        document.getElementById('modal-specs').textContent = product.specs;
        document.getElementById('modal-shipping').textContent = product.shipping;
    }

    // Event listeners for closing the modal
    closeModal.onclick = () => {
        modal.style.display = 'none';
    };

    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };

    // Start the application
    initializeCatalog();
});
