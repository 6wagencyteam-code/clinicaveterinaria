window.Theme = window.Theme || {};
Theme.Product = (() => {
  // let productSlider, productThumbSlider; // already declared globally in theme-scripts.liquid
  let currentVideo = null;

  const getMousePos = (e) => {
    var pos = e.currentTarget.getBoundingClientRect();
    return {
      x: e.clientX - pos.left,
      y: e.clientY - pos.top,
    };
  };

  function pauseMedia(container) {
    container.querySelectorAll('.yv-youtube-video').forEach(video =>
      video.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*')
    );
    container.querySelectorAll('.yv-vimeo-video').forEach(video =>
      video.contentWindow.postMessage('{"method":"pause"}', '*')
    );
    container.querySelectorAll('video').forEach(video => video.pause());
  }

 function initProductSlider(section = document) {
    let sliderMain = section.querySelector('[data-flickity-product-slider]');
    if (!sliderMain) return;

    let optionContainer = sliderMain.getAttribute('data-flickity-product-slider');
    if (!optionContainer) return;

    let options = JSON.parse(optionContainer);

    function destroyIfEnabled() {
      if (sliderMain.classList.contains('flickity-enabled')) {
        productSlider?.destroy();
      }
    }

    if (sliderMain.hasAttribute("data-mobile-only")) {
      if ($(window).width() < 768) {
        if (!sliderMain.classList.contains('flickity-enabled')) {
          productSlider = new Flickity(sliderMain, options);
          setTimeout(() => productSlider.resize(), 300);
        }
      } else {
        destroyIfEnabled();
      }
    } else if (sliderMain.hasAttribute("data-desktop-only")) {
      if ($(window).width() >= 768) {
        if (!sliderMain.classList.contains('flickity-enabled')) {
          productSlider = new Flickity(sliderMain, options);
          setTimeout(() => productSlider.resize(), 300);
        }
      } else {
        destroyIfEnabled();
      }
    } else {
      if (!sliderMain.classList.contains('flickity-enabled')) {
        productSlider = new Flickity(sliderMain, options);
        setTimeout(() => productSlider.resize(), 300);
      }
    }

    if (productSlider) {
      productSlider.on('change', function () {
        pauseMedia(productSlider.element);
      });
    }
  }

  function initProductThumbSlider(section = document) {
    let sliderMain = section.querySelector('[data-flickity-product-thumb-slider]');
    if (!sliderMain) return;

    let optionContainer = sliderMain.getAttribute('data-flickity-product-thumb-slider');
    if (!optionContainer) return;

    let options = JSON.parse(optionContainer);

    function destroyIfEnabled() {
      if (sliderMain.classList.contains('flickity-enabled')) {
        productThumbSlider?.destroy();
      }
    }

    if (sliderMain.hasAttribute("data-mobile-only")) {
      if ($(window).width() < 768) {
        if (!sliderMain.classList.contains('flickity-enabled')) {
          productThumbSlider = new Flickity(sliderMain, options);
          setTimeout(() => productThumbSlider.resize(), 300);
        }
      } else {
        destroyIfEnabled();
      }
    } else if (sliderMain.hasAttribute("data-desktop-only")) {
      if ($(window).width() >= 768) {
        if (!sliderMain.classList.contains('flickity-enabled')) {
          productThumbSlider = new Flickity(sliderMain, options);
          setTimeout(() => productThumbSlider.resize(), 300);
        }
      } else {
        destroyIfEnabled();
      }
    } else {
      if (!sliderMain.classList.contains('flickity-enabled')) {
        productThumbSlider = new Flickity(sliderMain, options);
        setTimeout(() => productThumbSlider.resize(), 300);
      }
    }

    if (productThumbSlider) {
      productThumbSlider.on('change', function () {
        pauseMedia(productThumbSlider.element);
      });
    }
  }

  function findVisibleItems() {
    let mainSliderParent = document.getElementById('yv-product-gallery-slider');
    if (mainSliderParent) {
      let elements = mainSliderParent.getElementsByClassName('gallery-main-item');
      let thumbs = mainSliderParent.getElementsByClassName('gallery-thumbs-item');

      window.addEventListener('scroll', () => {
        Array.from(elements).forEach(item => {
          if (isOnScreen(item)) {
            let relatedThumb = mainSliderParent.querySelector('.gallery-thumbs-item[data-image="' + item.id + '"]');
            if (relatedThumb) {
              Array.from(thumbs).forEach(thumb => thumb.classList.remove('active'));
              relatedThumb.classList.add('active');
            }
          }
        });
      });
    }
    let mainTabsContent =  document.getElementById('yvProductFeatureListwrapper');
    if(mainTabsContent){
      let contentTabs = document.getElementsByClassName('yv-product-feature');	
      window.addEventListener('scroll', function(event){     
        Array.from(contentTabs).forEach(function(item) {
          if (isOnScreen(item)) {
            let headTabs = document.getElementsByClassName('feature-link');
            Array.from(headTabs).forEach(function(head) {
              head.parentNode.classList.remove('active');
            });
            var relatedHead = document.querySelector('.feature-link[href="#'+item.id+'"]');
            if(relatedHead){
              relatedHead.parentNode.classList.add('active');
            }
          }
        });
      });
    }
  }

  function sizeChart() {
    let sizeChartInit = document.querySelectorAll('.sizeChart-label');
    let sizeChartModel = document.getElementById('sizeChartModel');
    if (sizeChartInit && sizeChartModel) {
      let sizeChartClose = sizeChartModel.querySelector('#sizeChartClose');
      sizeChartInit.forEach(label => {
        label.addEventListener("click", e => {
          e.preventDefault();
          // $(sizeChartModel).fadeIn(100);
          document.body.classList.add('sizeChartOpen');
          sizeChartClose.focus();
        });
      });
      sizeChartClose.addEventListener("click", () => {
        document.body.classList.remove('sizeChartOpen');
        // $(sizeChartModel).fadeOut(100);
      });
    }
  }

  function initStickyAddToCart() {
    let mainProductForm = document.querySelector('.main-product-form');
    let stickyBar = document.getElementById('yvProductStickyBar');

    if (mainProductForm && stickyBar) {
      window.addEventListener('scroll', () => {
        if (isOnScreen(mainProductForm, true) || window.scrollY < mainProductForm.offsetTop) {
          stickyBar.classList.remove('show');
        } else {
          stickyBar.classList.add('show');
        }
      });
    }
  }

  function onReadyEvent() {
    setTimeout(function () {
      var thumbnails = document.querySelector('.yv-product-gallery-thumbs-container');
      var lastKnownY = window.scrollY;
      var currentTop = 0;
      if (thumbnails) {
        var initialTopOffset = parseInt(window.getComputedStyle(thumbnails).top);
        window.addEventListener('scroll', function (event) {
          var bounds = thumbnails.getBoundingClientRect(),
            maxTop = bounds.top + window.scrollY - thumbnails.offsetTop + initialTopOffset,
            minTop = thumbnails.clientHeight - window.innerHeight;
          if (window.scrollY < lastKnownY) {
            currentTop -= window.scrollY - lastKnownY;
          } else {
            currentTop += lastKnownY - window.scrollY;
          }
          currentTop = Math.min(Math.max(currentTop, -minTop), maxTop, initialTopOffset);
          lastKnownY = window.scrollY;
          thumbnails.style.top = "".concat(currentTop, "px");
        });
      }
    }, 1000);

    // jQuery('body').on('click', '.gallery-thumbs-item', function (e) {
    //   e.preventDefault();
    //   var destination = jQuery(this).attr('data-image');
    //   var top = jQuery('.shopify-section-main-header').height() + 10;
    //   if (jQuery('#' + destination + '.gallery-main-item').length > 0) {
    //     jQuery('html,body').animate({ scrollTop: (jQuery('#' + destination + '.gallery-main-item').offset().top) - top });
    //   }
    // });

    jQuery('body').on('click', '.pdp-view-close', function (e) {
      e.preventDefault();
      jQuery('#yvProductStickyBar').remove();
    });

    jQuery('body').on('click', '.feature-link', function (e) {
      e.preventDefault();
      let destination = jQuery(this).attr('href');
      let top = jQuery('.shopify-section-main-header').height() + 90;
      if (jQuery(destination).length > 0) {
        jQuery('html,body').animate({ scrollTop: (jQuery(destination).offset().top) - top });
      }
    });

    jQuery('body').on('change', '.sticky-bar-product-options', function () {
      let _section = jQuery(this).closest('.shopify-section');
      let option = jQuery(this).attr('data-name');
      let value = jQuery(this).val();
      let mainOption = _section.find('.productOption[name="' + option + '"]');
      if (mainOption.is(':radio')) {
        _section.find('.productOption[name="' + option + '"][value="' + CSS.escape(value) + '"]').attr('checked', true).trigger('click');
      } else {
        mainOption.val(value);
        let sectionId = document.querySelector('#' + _section.attr('id'));
        if (sectionId) {
          let optionSelector = document.querySelector('.productOption[name="' + option + '"]');
          if (optionSelector) {
            optionSelector.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      }
    });

    if (typeof fancySelector !== 'undefined') {
      Fancybox.bind(fancySelector, {
        touch: false,
        thumbs: {
          autoStart: true
        },
        on: {
          load: () => pauseMedia(document),
          done: () => pauseMedia(document)
        },
        Toolbar: {
          display: ["close"]
        }
      });
    }
  }

  function productZoomInit() {
    $('.yv-product-zoom').mouseenter(function (e) {
      $('.yv-product-zoom').removeClass('show');
      if ($(window).width() > 1021) {
        $(this).addClass('show');
      }
    });
    $('.yv-product-zoom').mousemove(function (e) {
      if ($(window).width() > 1021) {
        let t = getMousePos(e);
        this.querySelector('.gallery-cursor').style.translate = `${t.x}px ${t.y}px`;
      }
    });
    $('.yv-product-zoom').mouseleave(function (e) {
      $('.yv-product-zoom').removeClass('show');
    });
  }

  function load3DModel() {
    if (!window.Shopify) return;

    Shopify.loadFeatures([
      {
        name: 'shopify-xr',
        version: '1.0',
        onLoad: () => {
          if (!window.ShopifyXR || typeof window.ShopifyXR.addModels !== 'function') {
            document.addEventListener('shopify_xr_initialized', () => {
              load3DModel();
            });
            return;
          }

          document.querySelectorAll('[id^="product3DModel-"]').forEach((model) => {
            window.ShopifyXR.addModels(JSON.parse(model.textContent));
          });
          window.ShopifyXR.setupXRElements();
        }

      },
      {
        name: 'model-viewer-ui',
        version: '1.0',
        onLoad: () => {
          document.querySelectorAll('.yv-product-model-item').forEach((model) => {
            let model3D = model.querySelector('model-viewer');
            model.modelViewerUI = new Shopify.ModelViewerUI(model3D);
            model3D.addEventListener('shopify_model_viewer_ui_toggle_play', () => {
              model.querySelectorAll('.close-product-model').forEach(el => el.classList.remove('hidden'));
              if (productSlider) {
                productSlider.options.draggable = false;
                productSlider.updateDraggable();
              }
            });
            model3D.addEventListener('shopify_model_viewer_ui_toggle_pause', () => {
              model.querySelectorAll('.close-product-model').forEach(el => el.classList.add('hidden'));
              if (productSlider) {
                productSlider.options.draggable = true;
                productSlider.updateDraggable();
              }
            });
            model.querySelectorAll('.close-product-model').forEach(el => {
              el.addEventListener('click', () => model.modelViewerUI.pause());
            });
          });
        }
      }
    ]);
  }

  function onLoad(section = document) {
    initProductSlider(section);
    initProductThumbSlider(section);
if (typeof findVisibleItems === 'function') {
  findVisibleItems();
}
    productZoomInit();
    sizeChart();
    initStickyAddToCart();
    load3DModel();
    onReadyEvent();
  }

  $(document).ready(function () {
    onLoad(document);
    onReadyEvent();

    function playVideo() {
      currentVideo = $('[data-reel-content] video')[0];
      if (currentVideo) {
        currentVideo.load();
        currentVideo.play();
      }
    }

    function pauseVideo() {
      if (currentVideo) {
        currentVideo.pause();
      }
    }
  });

  return {
    initProductSlider,
    initProductThumbSlider
  };
})();

if (document.querySelector('[data-flickity-product-slider]')) {
  window.addEventListener('resize', function(event) {
    Theme.Product.initProductSlider();
    Theme.Product.initProductThumbSlider();
    if (typeof findVisibleItems === 'function') {
      findVisibleItems();
    }
  });
}


