import { state } from './state.js';
import { renderPage } from './router.js';

const pageContentContainer = document.getElementById('page-content');
let originalPage = null;

// Master function to handle the print process
export async function handlePrintRequest(appState) {
    const printButton = document.getElementById('print-button');
    printButton.textContent = 'Generating...';
    printButton.disabled = true;

    // Store the current page to restore it later
    const activeLink = document.querySelector('.nav-link.active');
    originalPage = activeLink ? activeLink.dataset.page : 'home';

    try {
        // Fetch all data recursively
        const fullCatalogData = await fetchAllData(`data/${appState.currentLanguage}/categories.json`);
        
        // Build and inject the special print-only HTML into the main container
        const printHtml = buildPrintHtml(fullCatalogData, appState.translations);
        pageContentContainer.innerHTML = printHtml;
        
        // Add a class to the body to trigger print-specific styles
        document.body.classList.add('is-printing');

        // Trigger the browser's print dialog
        window.print();

    } catch (error) {
        console.error("Failed to generate print view:", error);
        alert("Sorry, there was an error generating the catalog for printing.");
        restoreOriginalContent(); // Restore content on error
    } 
    // The finally block is removed; restoration is now handled by the 'afterprint' event
}

// Event listener to restore the page after printing is done or cancelled
window.addEventListener('afterprint', () => {
    restoreOriginalContent();
});

function restoreOriginalContent() {
    const printButton = document.getElementById('print-button');
    document.body.classList.remove('is-printing');
    
    // Restore the original page view
    if (originalPage) {
        renderPage(originalPage, state);
    }
    
    // Reset the button text
    if (printButton && state.translations) {
        printButton.textContent = state.translations.printButton || 'Print Catalog';
        printButton.disabled = false;
    }
}


// Recursive function to fetch the entire catalog data structure
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

// Function to build the print-friendly HTML with images
function buildPrintHtml(data, translations) {
    let fullHtml = '';

    // 1. Build Cover Page
    fullHtml += `
        <div class="print-cover-page">
            <img src="images/logos/GTF_Logo.png" class="cover-logo" alt="Company Logo">
            <h1>Product Catalog</h1>
            <h2>${new Date().getFullYear()}</h2>
            <p>${translations.companyTitle || 'Graciana Tortilla Factory'}</p>
        </div>`;

    // 2. Build Main Content Pages
    function renderProducts(products) {
        // Filter out the special panels before mapping
        return products
            .filter(product => product.type !== 'promo-panel' && product.type !== 'recipe-panel')
            .map(product => `
                <div class="print-product">
                    <img src="${product.image}" alt="${product.name}">
                    <div class="print-product-details">
                        <h3>${product.name}</h3>
                        <p>${product.description || ''}</p>
                        <p><strong>${translations.modalSpecs || 'Specifications'}:</strong> ${product.specs || ''}</p>
                        <p><strong>${translations.modalShipping || 'Shipping'}:</strong> ${product.shipping || ''}</p>
                    </div>
                </div>
            `).join('');
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
    
    return fullHtml;
}

