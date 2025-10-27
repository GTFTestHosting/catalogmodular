// --- Parallax Effect Module ---

let heroCells = null;
let textBlockCells = null;
let heroPlainCells = null; // New variable for the new panel type

// --- Configuration ---
const isMobile = window.innerWidth <= 768;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const PARALLAX_FACTOR_HEROTEXT = 0.48; // For promo-herotext
const PARALLAX_FACTOR_TEXT = 0.01; // For text-block
const PARALLAX_FACTOR_HERO_PLAIN = 0.5; // New speed for promo-hero-plain

// Fade In settings (based on panel TOP)
const FADE_IN_START_VH = 1.0; // Start fading in when TOP is at 100% of viewport height
const FADE_IN_END_VH = 0.45;  // Fully faded in when TOP is at 75% of viewport height

// Fade Out settings (based on panel BOTTOM)
const FADE_OUT_START_VH = 0.5; // Start fading out when BOTTOM is 25% from viewport top
const FADE_OUT_END_VH = 0.0;   // Fully faded out when BOTTOM is at the viewport top


/**
 * The main animation function.
 */
function animateCells() {
    const viewportCenter = window.innerHeight / 2;
    const viewportHeight = window.innerHeight;

    // Animate the Hero Text panels (Fade AND Hero Parallax)
    if (heroCells) {
        for (const cell of heroCells) {
            applyScrollEffects(cell, viewportCenter, viewportHeight, PARALLAX_FACTOR_HEROTEXT, true);
        }
    }
    
    // Animate the regular Text Block panels (Fade AND Text Parallax)
    if (textBlockCells) {
        for (const cell of textBlockCells) {
            applyScrollEffects(cell, viewportCenter, viewportHeight, PARALLAX_FACTOR_TEXT, true);
        }
    }

    // Animate the Hero Plain panels (Parallax ONLY)
    if (heroPlainCells) {
        for (const cell of heroPlainCells) {
            applyScrollEffects(cell, viewportCenter, viewportHeight, PARALLAX_FACTOR_HERO_PLAIN, false);
        }
    }
}

/**
 * Helper function to calculate and apply scroll effects.
 */
function applyScrollEffects(cell, viewportCenter, viewportHeight, parallaxFactor, applyFade) {
    const rect = cell.getBoundingClientRect();
    const panel = cell.firstElementChild;
    if (!panel) return;

    // Check if the panel is fully off-screen
    if (rect.bottom < 0 || rect.top > viewportHeight) {
        // Set to non-visible state and return
        if (applyFade) {
            panel.style.opacity = 0;
        }
        return; 
    }

    // --- 1. Opacity Fade ---
    let opacity = 1;
    if (applyFade) {
        const fadeInStart = viewportHeight * FADE_IN_START_VH;
        const fadeInEnd = viewportHeight * FADE_IN_END_VH;
        const fadeOutStart = viewportHeight * FADE_OUT_START_VH;
        const fadeOutEnd = viewportHeight * FADE_OUT_END_VH;

        const panelTop = rect.top;
        const panelBottom = rect.bottom;

        if (panelTop > fadeInEnd) {
            // Fading IN (panel is near the bottom)
            const progress = (fadeInStart - panelTop) / (fadeInStart - fadeInEnd);
            opacity = Math.max(0, Math.min(1, progress));
        } else if (panelBottom < fadeOutStart) {
            // Fading OUT (panel is near the top)
            const progress = (panelBottom - fadeOutEnd) / (fadeOutStart - fadeOutEnd);
            opacity = Math.max(0, Math.min(1, progress));
        } else {
            // Fully visible (panel is in the middle)
            opacity = 1;
        }
    }
    
    // --- 2. Parallax Translation ---
    const cellCenter = rect.top + rect.height / 2;
    const difference = viewportCenter - cellCenter;
    const translateY = difference * parallaxFactor;
    
    // --- 3. Apply Styles ---
    panel.style.transform = `translateY(${translateY}px)`;
    panel.style.opacity = opacity;
}

/**
 * Attaches the scroll listener to the window.
 */
function handleScroll() {
    window.requestAnimationFrame(animateCells);
}

/**
 * Initializes the parallax effect.
 */
export function initParallax() {
    if (isMobile || prefersReducedMotion) {
        return;
    }

    // Find all hero-style cells
    heroCells = document.querySelectorAll(
        '[class*="-cell"].promo-herotext'
    );
    
    // Find text blocks that are NOT hero text blocks
    textBlockCells = document.querySelectorAll(
        '[class*="-cell"]:has(.text-block-panel):not(.promo-herotext)'
    );

    // Find the new hero-plain-cells
    heroPlainCells = document.querySelectorAll(
        '[class*="-cell"].promo-hero-plain'
    );

    if (!heroCells.length && !textBlockCells.length && !heroPlainCells.length) {
        return; // No cells to animate on this page
    }
    
    // Add will-change for performance optimization
    heroCells.forEach(cell => {
        if(cell.firstElementChild) cell.firstElementChild.style.willChange = 'transform, opacity';
    });
    textBlockCells.forEach(cell => {
        if(cell.firstElementChild) cell.firstElementChild.style.willChange = 'transform, opacity';
    });
    heroPlainCells.forEach(cell => {
        if(cell.firstElementChild) cell.firstElementChild.style.willChange = 'transform';
    });


    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Run once on load
}