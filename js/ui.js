import { state } from './state.js';

// --- ELEMENT REFERENCES ---
const mobileNav = document.querySelector('.mobile-nav');
const overlay = document.querySelector('.overlay');
const backButtonPlaceholder = document.getElementById('back-button-placeholder');
const modal = document.getElementById('product-modal');

// --- MOBILE NAVIGATION ---
export function openMobileMenu() {
    if (mobileNav) mobileNav.classList.add('is-open');
    if (overlay) overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

export function closeMobileMenu() {
    if (mobileNav) mobileNav.classList.remove('is-open');
    if (overlay) overlay.classList.add('hidden');
    document.body.style.overflow = '';
}

// --- STATIC TRANSLATIONS ---
export function applyStaticTranslations(translations) {
    document.querySelectorAll('[data-lang-key]').forEach(elem => {
        const key = elem.getAttribute('data-lang-key');
        if (translations[key]) {
            elem.textContent = translations[key];
        }
    });
}

// --- BACK BUTTON ---
export function showBackButton(goBackCallback) {
    if (backButtonPlaceholder) {
        backButtonPlaceholder.innerHTML = '';
        const backButton = document.createElement('button');
        backButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>`;
        backButton.className = 'back-button';
        backButton.onclick = goBackCallback;
        backButtonPlaceholder.appendChild(backButton);
    }
}

export function hideBackButton() {
    if (backButtonPlaceholder) {
        backButtonPlaceholder.innerHTML = '';
    }
}

// --- MODAL ---
export function showProductDetails(product) {
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        document.getElementById('modal-img').src = product.image;
        document.getElementById('modal-title').textContent = product.name;
        document.getElementById('modal-description').textContent = product.description;
        document.getElementById('modal-specs').textContent = product.specs;
        document.getElementById('modal-shipping').textContent = product.shipping;
    }
}

// --- LOADING MESSAGE ---
export function showLoadingMessage(container, translations) {
    if(container) {
        container.innerHTML = `<h2>${translations.loading || 'Loading...'}</h2>`;
    }
}
