import { renderPage } from './router.js';

export function buildPanel(data, appState) {
    const panel = document.createElement('div');
    const { translations } = appState;
    
    switch (data.type) {
        case 'promo':
            panel.className = 'promo-panel';
            if (data.backgroundImage) {
                panel.style.backgroundImage = `url('${data.backgroundImage}')`;
                panel.classList.add('has-bg-image');
            } else {
                panel.style.backgroundColor = data.backgroundColor;
            }
            const promoTitle = data.title || (translations[data.titleKey] || '');
            const promoText = data.text || (translations[data.textKey] || '');
            const promoTitleEl = document.createElement('h3');
            promoTitleEl.innerHTML = promoTitle;
            if (data.titleColor) promoTitleEl.style.color = data.titleColor;
            const promoTextEl = document.createElement('p');
            promoTextEl.innerHTML = promoText;
            if (data.paragraphColor) {
                promoTextEl.style.color = data.paragraphColor;
            } else if (data.textColor) {
                promoTextEl.style.color = data.textColor;
            }
            panel.appendChild(promoTitleEl);
            panel.appendChild(promoTextEl);
            break;

        case 'text-block':
            panel.className = 'text-block-panel';
            if (data.backgroundColor) panel.style.backgroundColor = data.backgroundColor;
            const headerEl = document.createElement('h1');
            if (data.header) headerEl.innerHTML = data.header;
            if (data.headerColor) headerEl.style.color = data.headerColor;
            const subheaderEl = document.createElement('h2');
            if (data.subheader) subheaderEl.innerHTML = data.subheader;
            if (data.subheaderColor) subheaderEl.style.color = data.subheaderColor;
            const paragraphEl = document.createElement('p');
            if (data.paragraph) paragraphEl.innerHTML = data.paragraph;
            if (data.paragraphColor) {
                paragraphEl.style.color = data.paragraphColor;
            } else if (data.textColor) {
                paragraphEl.style.color = data.textColor;
            }
            if(data.header) panel.appendChild(headerEl);
            if(data.subheader) panel.appendChild(subheaderEl);
            if(data.paragraph) panel.appendChild(paragraphEl);
            break;

        case 'tile':
            panel.className = 'tile';
            panel.style.backgroundImage = `url('${data.image}')`;
            const tileTitle = data.title || (translations[data.titleKey] || '');
            panel.innerHTML = `<h2>${tileTitle}</h2>`;
            break;

        case 'recipe':
            panel.className = 'recipe-panel';
            if (data.backgroundImage) panel.style.backgroundImage = `url('${data.backgroundImage}')`;
            const ingredientsHtml = data.featuredProducts.map(item => `<li>${item}</li>`).join('');
            panel.innerHTML = `
                <div class="recipe-panel-content">
                    <h3 data-lang-key="${data.titleKey}">${translations[data.titleKey] || ''}</h3>
                    <p class="recipe-description" data-lang-key="${data.descriptionKey}">${translations[data.descriptionKey] || ''}</p>
                    <h4 class="featured-products-title" data-lang-key="${data.featuredTitleKey}">${translations[data.featuredTitleKey] || 'Featured Products:'}</h4>
                    <ul>${ingredientsHtml}</ul>
                </div>`;
            break;
        
        case 'carousel-panel':
            panel.className = 'carousel-panel';
            
            const slidesContainer = document.createElement('div');
            slidesContainer.className = 'carousel-slides-container';

            data.slides.forEach((slide, index) => {
                const slideEl = document.createElement('div');
                slideEl.className = 'carousel-slide';
                if (index === 0) {
                    slideEl.classList.add('is-active');
                }

                if (slide.backgroundVideo) {
                    const video = document.createElement('video');
                    video.autoplay = true;
                    video.loop = true;
                    video.muted = true;
                    video.playsInline = true;
                    const source = document.createElement('source');
                    source.src = slide.backgroundVideo;
                    source.type = 'video/mp4';
                    video.appendChild(source);
                    slideEl.appendChild(video);
                } else if (slide.image || slide.backgroundImage) { // Now checks for both
                    slideEl.style.backgroundImage = `url('${slide.image || slide.backgroundImage}')`;
                }

                const contentEl = document.createElement('div');
                contentEl.className = 'carousel-content';

                let content = '';
                if (slide.title) content += `<h3>${slide.title}</h3>`;
                if (slide.restaurant) content += `<p class="restaurant-name">${slide.restaurant}</p>`;
                if (slide.description) content += `<p class="recipe-description">${slide.description}</p>`;
                if (slide.featuredProducts) {
                    const featuredTitle = translations.featuredProductsTitle || 'Featured Products:';
                    content += `<h4 class="featured-products-title">${featuredTitle}</h4>`;
                    const products = Array.isArray(slide.featuredProducts) ? slide.featuredProducts : [slide.featuredProducts];
                    content += `<ul>${products.map(p => `<li>${p}</li>`).join('')}</ul>`;
                }
                contentEl.innerHTML = content;
                
                slideEl.appendChild(contentEl);
                slidesContainer.appendChild(slideEl);
            });

            panel.appendChild(slidesContainer);
            break;

        case 'map-panel':
            panel.className = 'map-panel';
            if (data.title) {
                panel.innerHTML += `<h2>${data.title}</h2>`;
            }
            if (data.iframeSrc) {
                const iframe = document.createElement('iframe');
                iframe.src = data.iframeSrc;
                iframe.width = "100%";
                iframe.height = "100%";
                iframe.style.border = "0";
                iframe.allowFullscreen = true;
                iframe.loading = "lazy";
                iframe.referrerPolicy = "no-referrer-when-downgrade";
                panel.appendChild(iframe);
            }
            break;

        default:
            return null;
    }

    if (data.nav) {
        if (data.nav.href) {
            const linkWrapper = document.createElement('a');
            linkWrapper.href = data.nav.href;
            linkWrapper.target = "_blank";
            linkWrapper.rel = "noopener noreferrer";
            linkWrapper.classList.add('panel-link');
            linkWrapper.appendChild(panel);
            return linkWrapper;
        } else {
            panel.classList.add('home-nav-tile');
            panel.dataset.page = data.nav.page;
            if (data.nav.category) {
                panel.dataset.categoryStart = data.nav.category;
            }
            panel.style.cursor = 'pointer';
        }
    }

    return panel;
}

export function setupHomeNavTiles(appState) {
    document.querySelectorAll('.home-nav-tile').forEach(tile => {
        tile.addEventListener('click', () => {
            const targetPage = tile.dataset.page;
            const startCategory = tile.dataset.categoryStart;
            renderPage(targetPage, appState, { startCategory });
        });
    });
}

