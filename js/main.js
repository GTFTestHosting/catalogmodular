import { state, setLanguage, setTranslations } from './state.js';
import { openMobileMenu, closeMobileMenu, showProductDetails, applyStaticTranslations } from './ui.js';
import { renderPage } from './router.js';
import { handlePrintRequest } from './print.js';

// --- ELEMENT REFERENCES ---
const langToggle = document.getElementById('lang-toggle-checkbox');
const printButton = document.getElementById('print-button');
const hamburgerBtn = document.querySelector('.hamburger-btn');
const overlay = document.querySelector('.overlay');
const allNavLinks = document.querySelectorAll('.nav-link');
const modal = document.getElementById('product-modal');
const closeModal = document.querySelector('.close-button');

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

// --- INITIALIZATION AND EVENT LISTENERS ---
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

// --- APPLICATION START ---
async function startApp() {
    await loadLanguage(state.currentLanguage);
    setTimeout(() => {
        renderPage('home', state);
    }, 0);
}

startApp();
