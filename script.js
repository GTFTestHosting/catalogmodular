document.addEventListener('DOMContentLoaded', () => {
    // ---ELEMENT REFERENCES---
    const pageContentContainer = document.getElementById('page-content');
    const modal = document.getElementById('product-modal');
    const closeModal = document.querySelector('.close-button');
    const langToggle = document.getElementById('lang-toggle-checkbox');
    const printButton = document.getElementById('print-button');
    const backButtonPlaceholder = document.getElementById('back-button-placeholder');
    const hamburgerBtn = document.querySelector('.hamburger-btn');
    const overlay = document.querySelector('.overlay');

    // Navigation elements are now separate
    const mainNav = document.querySelector('.main-nav');
    const mobileNav = document.querySelector('.mobile-nav');
    const allNavLinks = document.querySelectorAll('.nav-link'); // Get all links from both menus

    // ---STATE MANAGEMENT---
    let currentLanguage = 'en';
    let translations = {};
    let navigationHistory = [];

    // --- MOBILE NAVIGATION LOGIC ---
    function openMobileMenu() {
        mobileNav.classList.add('is-open');
        overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeMobileMenu() {
        mobileNav.classList.remove('is-open');
        overlay.classList.add('hidden');
        document.body.style.overflow = '';
    }

    // --- ROUTING & PAGE LOADING LOGIC ---
    function renderPage(page, options = {}) {
        allNavLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.page === page);
        });
        printButton.classList.toggle('hidden', page !== 'catalog');
        
        switch (page) {
            // ... (rest of switch statement is unchanged)
        }
    }
    // ... (rest of the file is unchanged)

    // ---INITIALIZATION AND EVENT LISTENERS---
    hamburgerBtn.addEventListener('click', openMobileMenu);
    overlay.addEventListener('click', closeMobileMenu);
    
    allNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            closeMobileMenu();
            renderPage(link.dataset.page);
        });
    });

    // ... (rest of event listeners are unchanged)

    // ---APPLICATION START---
    async function startApp() {
        await loadLanguage(currentLanguage);
        setTimeout(() => {
            renderPage('home');
        }, 0);
    }
    
    startApp();
});

