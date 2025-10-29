/**
 * This module ties all the other modules together.
 */
import { state, setLanguage, setTranslations, popHistory } from './state.js';
import { openMobileMenu, closeMobileMenu, applyStaticTranslations } from './ui.js';
import { renderPage } from './router.js';
import { handlePrintRequest } from './print.js';
import { displayCategoryLevel } from './catalog.js';
import { initParallax } from './parallax.js'; // 1. Import the new module

// --- ELEMENT REFERENCES ---
const siteHeader = document.querySelector('.site-header');
const langToggle = document.getElementById('lang-toggle-checkbox');
const printButton = document.getElementById('print-button');
const hamburgerBtn = document.querySelector('.hamburger-btn');
const overlay = document.querySelector('.overlay');
const allNavLinks = document.querySelectorAll('.nav-link');
const modal = document.getElementById('product-modal');
const closeModal = document.querySelector('.close-button');

// --- SCROLL LOGIC ---
function handleHeaderScroll() {
    if (window.scrollY > 1) {
        siteHeader.classList.add('is-scrolled');
    } else {
        siteHeader.classList.remove('is-scrolled');
    }
}

// --- LANGUAGE LOGIC ---
async function loadLanguage(lang) {
    try {
        const response = await fetch(`lang/${lang}.json`);
        if (!response.ok) throw new Error('Language file not found');
        const translations = await response.json();
        setLanguage(lang);
        setTranslations(translations);
        applyStaticTranslations(translations);
    } catch (error) {
        console.error(`Failed to load language ${lang}:`, error);
    }
}

// --- NAVIGATION LOGIC ---
function goBack() {
    const lastState = popHistory();
    if (lastState) {
        if (lastState.type === 'catalog') {
            renderPage('catalog', state);
        } else if (lastState.type === 'category') {
            displayCategoryLevel(lastState.path, state);
        }
    }
}

// --- INITIALIZATION AND EVENT LISTENERS ---
window.addEventListener('scroll', handleHeaderScroll);

if (hamburgerBtn) hamburgerBtn.addEventListener('click', openMobileMenu);
if (overlay) overlay.addEventListener('click', closeMobileMenu);

allNavLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        closeMobileMenu();
        renderPage(link.dataset.page, state);
    });
});

if (langToggle) {
    langToggle.addEventListener('change', async () => {
        const newLang = langToggle.checked ? 'es' : 'en';
        await loadLanguage(newLang);
        const activeLink = document.querySelector('.nav-link.active');
        if (activeLink) {
            renderPage(activeLink.dataset.page, state);
        }
    });
}

if (printButton) printButton.addEventListener('click', () => handlePrintRequest(state));

if (closeModal) {
    closeModal.onclick = () => { 
        if (modal) modal.style.display = 'none'; 
        document.body.style.overflow = '';
    };
}
window.onclick = (event) => { 
    if (event.target === modal) { 
        if (modal) modal.style.display = 'none'; 
        document.body.style.overflow = '';
    } 
};

// Make goBack globally accessible to other modules that need it
window.app = { goBack };


// --- APPLICATION START ---
async function startApp() {
    await loadLanguage(state.currentLanguage);
    setTimeout(() => {
        renderPage('home', state);
    }, 0);
    
    // 2. Call the init function to start the effect
    initParallax();
}

startApp();

