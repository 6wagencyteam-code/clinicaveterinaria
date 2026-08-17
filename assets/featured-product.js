window.Theme = window.Theme || {};
Theme.FeaturedProduct = (() => {
  let featuredSliders = [], featuredThumbSliders = [];

  function pauseMedia(container) {
    container.querySelectorAll('.yv-youtube-video').forEach(video =>
      video.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*')
    );
    container.querySelectorAll('.yv-vimeo-video').forEach(video =>
      video.contentWindow.postMessage('{"method":"pause"}', '*')
    );
    container.querySelectorAll('video').forEach(video => video.pause());
  }

  function initFeaturedSlider(section = document) {
    const sliders = section.querySelectorAll('[data-flickity-featured-product-slider]');
    sliders.forEach(slider => {
      const optionsStr = slider.getAttribute('data-flickity-featured-product-slider');
      if (!optionsStr) return;

      const options = JSON.parse(optionsStr);
      let instance;

      if (slider.hasAttribute("data-mobile-only")) {
        if ($(window).width() < 768 && !slider.classList.contains('flickity-enabled')) {
          instance = new Flickity(slider, options);
          setTimeout(() => instance.resize(), 300);
        } else if (slider.classList.contains('flickity-enabled')) {
          instance?.destroy();
        }
      } else if (slider.hasAttribute("data-desktop-only")) {
        if ($(window).width() >= 768 && !slider.classList.contains('flickity-enabled')) {
          instance = new Flickity(slider, options);
          setTimeout(() => instance.resize(), 300);
        } else if (slider.classList.contains('flickity-enabled')) {
          instance?.destroy();
        }
      } else {
        if (!slider.classList.contains('flickity-enabled')) {
          instance = new Flickity(slider, options);
          setTimeout(() => instance.resize(), 300);
        }
      }

      if (instance) {
        instance.on('change', () => pauseMedia(slider));
        featuredSliders.push(instance);
      }
    });
  }

  function initFeaturedThumbSlider(section = document) {
    const sliders = section.querySelectorAll('[data-flickity-featured-product-thumb-slider]');
    sliders.forEach(slider => {
      const optionsStr = slider.getAttribute('data-flickity-featured-product-thumb-slider');
      if (!optionsStr) return;

      const options = JSON.parse(optionsStr);
      const gallery = slider.closest('[data-featured-product-container]')?.querySelector('[data-flickity-featured-product-slider]');
      const element = gallery?.querySelector('.flickity-viewport');

      if (element) {
        const height = element.style.height || window.getComputedStyle(element).height;
        const numericHeight = parseInt(height);
        const newHeight = numericHeight + 20 + 'px';
        gallery.style.setProperty('--slide-height', newHeight);
        slider.style.width = newHeight;
      }

      let instance;

      if (slider.hasAttribute("data-mobile-only")) {
        if ($(window).width() < 768 && !slider.classList.contains('flickity-enabled')) {
          instance = new Flickity(slider, options);
          setTimeout(() => instance.resize(), 300);
        } else if (slider.classList.contains('flickity-enabled')) {
          instance?.destroy();
        }
      } else if (slider.hasAttribute("data-desktop-only")) {
        if ($(window).width() >= 768 && !slider.classList.contains('flickity-enabled')) {
          instance = new Flickity(slider, options);
          setTimeout(() => instance.resize(), 300);
        } else if (slider.classList.contains('flickity-enabled')) {
          instance?.destroy();
        }
      } else {
        if (!slider.classList.contains('flickity-enabled')) {
          instance = new Flickity(slider, options);
          setTimeout(() => instance.resize(), 300);
        }
      }

      if (instance) {
        instance.on('change', () => pauseMedia(slider));
        featuredThumbSliders.push(instance);
      }
    });
  }

  function load3DModels(section = document) {
    const models = section.querySelectorAll('[id^="product3DModel-"]');
    if (models.length === 0) return;

    if (!window.ShopifyXR) {
      document.addEventListener('shopify_xr_initialized', () => load3DModels(section));
      return;
    }

    models.forEach(model => {
      window.ShopifyXR.addModels(JSON.parse(model.textContent));
    });

    window.ShopifyXR.setupXRElements();

    document.querySelectorAll('.yv-product-model-item').forEach((model) => {
      const model3D = model.querySelector('model-viewer');
      model.modelViewerUI = new Shopify.ModelViewerUI(model3D);

      model3D.addEventListener('shopify_model_viewer_ui_toggle_play', () => {
        model.querySelectorAll('.close-product-model').forEach(el => el.classList.remove('hidden'));
      });
      model3D.addEventListener('shopify_model_viewer_ui_toggle_pause', () => {
        model.querySelectorAll('.close-product-model').forEach(el => el.classList.add('hidden'));
      });
      model.querySelectorAll('.close-product-model').forEach(el => {
        el.addEventListener('click', () => {
          if (model.modelViewerUI) model.modelViewerUI.pause();
        });
      });
    });
  }

  function onLoad(section = document) {
    initFeaturedSlider(section);
    initFeaturedThumbSlider(section);
    load3DModels(section);
  }

  document.addEventListener('DOMContentLoaded', () => {
    onLoad(document);
  });

  document.addEventListener('shopify:section:load', (event) => {
    onLoad(event.target);
  });

  window.addEventListener('resize', () => {
    initFeaturedSlider();
    initFeaturedThumbSlider();
    load3DModels();
  });

  return {
    initFeaturedSlider,
    initFeaturedThumbSlider
  };
})();
