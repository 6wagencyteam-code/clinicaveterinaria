var mouse_is_inside = false;
let currentVideo;

if (typeof window.Shopify == "undefined") {
    window.Shopify = {};
}

const scrollbarWidth = window.innerWidth - document.body.clientWidth;
if (scrollbarWidth > 0) {
    document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
}

Shopify.throttle = (callback) => {
    let requestId = null, lastArgs;
    const later = (context) => () => {
      requestId = null;
      callback.apply(context, lastArgs);
    };
    const throttled = (...args) => {
      lastArgs = args;
      if (requestId === null) {
        requestId = requestAnimationFrame(later(this));
      }
    };
    throttled.cancel = () => {
      cancelAnimationFrame(requestId);
      requestId = null;
    };
    return throttled;
}

function debounce(fn, wait = 300) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
    };
}

Shopify.bind = function (fn, scope) {
    return function () {
        return fn.apply(scope, arguments);
    };
};

Shopify.setSelectorByValue = function (selector, value) {
    for (var i = 0, count = selector.options.length; i < count; i++) {
        var option = selector.options[i];
        if (value == option.value || value == option.innerHTML) {
            selector.selectedIndex = i;
            return i;
        }
    }
};

Shopify.addListener = function (target, eventName, callback) {
    target.addEventListener ?
        target.addEventListener(eventName, callback, false) :
        target.attachEvent("on" + eventName, callback);
};

Shopify.postLink = function (path, options) {
    options = options || {};
    var method = options["method"] || "post";
    var parameters = options["parameters"] || {};

    var form = document.createElement("form");
    form.setAttribute("method", method);
    form.setAttribute("action", path);

    for (var key in parameters) {
        var fields = document.createElement("input");
        fields.setAttribute("type", "hidden");
        fields.setAttribute("name", key);
        fields.setAttribute("value", parameters[key]);
        form.appendChild(fields);
    }
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
};

Shopify.CountryProvinceSelector = function (
    country_domid,
    province_domid,
    options
) {
    var countryElement = document.querySelectorAll("#" + country_domid);
    var provinceElement = document.querySelectorAll("#" + province_domid);
    var provinceContainerEl = document.querySelectorAll(
        "#" + options["hideElement"] || "#" + province_domid
    );
    if (countryElement.length > 0) {
        this.countryEl = countryElement[0];
        this.provinceEl = provinceElement[0];
        this.provinceContainer = provinceContainerEl[0];
        if (countryElement[1]) {
            this.countryEl = countryElement[1];
        }
        if (provinceElement[1]) {
            this.provinceEl = provinceElement[1];
        }
        if (provinceContainerEl[1]) {
            this.provinceContainer = provinceContainerEl[1];
        }
        Shopify.addListener(
            this.countryEl,
            "change",
            Shopify.bind(this.countryHandler, this)
        );
        this.initCountry();
        this.initProvince();
    }
};

Shopify.CountryProvinceSelector.prototype = {
    initCountry: function () {
        var value = this.countryEl.getAttribute("data-default");
        Shopify.setSelectorByValue(this.countryEl, value);
        this.countryHandler();
    },

    initProvince: function () {
        var value = this.provinceEl.getAttribute("data-default");
        if (value && this.provinceEl.options.length > 0) {
            Shopify.setSelectorByValue(this.provinceEl, value);
        }
    },

    countryHandler: function (e) {
        var opt = this.countryEl.options[this.countryEl.selectedIndex];
        var raw = opt.getAttribute("data-provinces");
        var provinces = JSON.parse(raw);
        this.clearOptions(this.provinceEl);
        if (provinces && provinces.length == 0) {
            this.provinceContainer.style.display = "none";
        } else {
            for (var i = 0; i < provinces.length; i++) {
                var opt = document.createElement("option");
                opt.value = provinces[i][0];
                opt.innerHTML = provinces[i][1];
                this.provinceEl.appendChild(opt);
            }
            this.provinceContainer.style.display = "";
        }
    },

    clearOptions: function (selector) {
        while (selector.firstChild) {
            selector.removeChild(selector.firstChild);
        }
    },

    setOptions: function (selector, values) {
        for (var i = 0, count = values.length; i < values.length; i++) {
            var opt = document.createElement("option");
            opt.value = values[i];
            opt.innerHTML = values[i];
            selector.appendChild(opt);
        }
    },
};

if (typeof Shopify === "undefined") {
    Shopify = {};
}

if (!Shopify.formatMoney) {
    Shopify.formatMoney = function (cents, format) {
        var value = "",
            placeholderRegex = /\{\{\s*(\w+)\s*\}\}/,
            formatString = format || this.money_format;
        if (typeof cents == "string") {
            cents = cents.replace(".", "");
        }
        function defaultOption(opt, def) {
            return typeof opt == "undefined" ? def : opt;
        }
        function formatWithDelimiters(number, precision, thousands, decimal) {
            precision = defaultOption(precision, 2);
            thousands = defaultOption(thousands, ",");
            decimal = defaultOption(decimal, ".");
            if (isNaN(number) || number == null) {
                return 0;
            }
            number = (number / 100.0).toFixed(precision);
            var parts = number.split("."),
                dollars = parts[0].replace(
                    /(\d)(?=(\d\d\d)+(?!\d))/g,
                    "$1" + thousands
                ),
                cents = parts[1] ? decimal + parts[1] : "";
            return dollars + cents;
        }
        switch (formatString.match(placeholderRegex)[1]) {
            case "amount":
                value = formatWithDelimiters(cents, 2);
                break;
            case "amount_no_decimals":
                value = formatWithDelimiters(cents, 0);
                break;
            case "amount_with_comma_separator":
                value = formatWithDelimiters(cents, 2, ".", ",");
                break;
            case "amount_no_decimals_with_comma_separator":
                value = formatWithDelimiters(cents, 0, ".", ",");
                break;
            case "amount_no_decimals_with_space_separator":
                value = formatWithDelimiters(cents, 0, " ", " ");
                break;
        }
        return formatString.replace(placeholderRegex, value);
    };
}

var DOMAnimations = {
    slideUp: function (element, duration = 500) {
        return new Promise(function (resolve, reject) {
            if (element) {
                element.style.height = element.offsetHeight + "px";
                element.style.transitionProperty = `height, margin, padding`;
                element.style.transitionDuration = duration + "ms";
                element.offsetHeight;
                element.style.overflow = "hidden";
                element.style.height = 0;
                element.style.paddingTop = 0;
                element.style.paddingBottom = 0;
                element.style.marginTop = 0;
                element.style.marginBottom = 0;
                window.setTimeout(function () {
                    element.style.display = "none";
                    element.style.removeProperty("height");
                    element.style.removeProperty("padding-top");
                    element.style.removeProperty("padding-bottom");
                    element.style.removeProperty("margin-top");
                    element.style.removeProperty("margin-bottom");
                    element.style.removeProperty("overflow");
                    element.style.removeProperty("transition-duration");
                    element.style.removeProperty("transition-property");
                    resolve(false);
                }, duration);
            }
        });
    },

    slideDown: function (element, duration = 500) {
        return new Promise(function (resolve, reject) {
            if (element) {
                element.style.removeProperty("display");
                let display = window.getComputedStyle(element).display;
                if (display === "none") display = "block";
                element.style.display = display;
                let height = element.offsetHeight;
                element.style.overflow = "hidden";
                element.style.height = 0;
                element.style.paddingTop = 0;
                element.style.paddingBottom = 0;
                element.style.marginTop = 0;
                element.style.marginBottom = 0;
                element.offsetHeight;
                element.style.transitionProperty = `height, margin, padding`;
                element.style.transitionDuration = duration + "ms";
                element.style.height = height + "px";
                element.style.removeProperty("padding-top");
                element.style.removeProperty("padding-bottom");
                element.style.removeProperty("margin-top");
                element.style.removeProperty("margin-bottom");
                window.setTimeout(function () {
                    element.style.removeProperty("height");
                    element.style.removeProperty("overflow");
                    element.style.removeProperty("transition-duration");
                    element.style.removeProperty("transition-property");
                }, duration);
            }
        });
    },

    slideToggle: function (element, duration = 500) {
        if (window.getComputedStyle(element).display === "none") {
            return this.slideDown(element, duration);
        } else {
            return this.slideUp(element, duration);
        }
    },

    classToggle: function (element, className) {
        if (element.classList.contains(className)) {
            element.classList.remove(className);
        } else {
            element.classList.add(className);
        }
    },
};

if (!Element.prototype.fadeIn) {
    Element.prototype.fadeIn = function () {
        let ms = !isNaN(arguments[0]) ? arguments[0] : 400,
            func =
                typeof arguments[0] === "function" ?
                    arguments[0] :
                    typeof arguments[1] === "function" ?
                        arguments[1] :
                        null;
        this.style.opacity = 0;
        this.style.filter = "alpha(opacity=0)";
        this.style.display = "inline-block";
        this.style.visibility = "visible";
        let $this = this,
            opacity = 0,
            timer = setInterval(function () {
                opacity += 50 / ms;
                if (opacity >= 1) {
                    clearInterval(timer);
                    opacity = 1;
                    if (func) func("done!");
                }
                $this.style.opacity = opacity;
                $this.style.filter = "alpha(opacity=" + opacity * 100 + ")";
            }, 50);
    };
}

if (!Element.prototype.fadeOut) {
    Element.prototype.fadeOut = function () {
        let ms = !isNaN(arguments[0]) ? arguments[0] : 400,
            func =
                typeof arguments[0] === "function" ?
                    arguments[0] :
                    typeof arguments[1] === "function" ?
                        arguments[1] :
                        null;
        let $this = this,
            opacity = 1,
            timer = setInterval(function () {
                opacity -= 50 / ms;
                if (opacity <= 0) {
                    clearInterval(timer);
                    opacity = 0;
                    $this.style.display = "none";
                    $this.style.visibility = "hidden";
                    if (func) func("done!");
                }
                $this.style.opacity = opacity;
                $this.style.filter = "alpha(opacity=" + opacity * 100 + ")";
            }, 50);
    };
}

/** All Menu Hide **/
function hideallMenus(menus, current) {
    Array.from(menus).forEach(function (menu) {
        var menuList = menu.nextElementSibling;
        var menuParent = menu.parentNode;
        if (menu == current) {
            return;
        } else {
            menuParent.classList.remove("active");
            DOMAnimations.slideUp(menuList);
        }
    });
}

function pad2(number) {
    return (number < 10 ? "0" : "") + number;
}

function screenVisibility(elem) {
    if (elem.length == 0) {
        return;
    }
    var $window = $(window);
    var viewport_top = $window.scrollTop();
    var viewport_height = $window.height();
    var viewport_bottom = viewport_top + viewport_height;
    var $elem = elem;
    var top = $elem.offset().top;
    var height = $elem.height();
    var bottom = top + height;
    return (
        (top >= viewport_top && top < viewport_bottom) ||
        (bottom > viewport_top && bottom <= viewport_bottom) ||
        (height > viewport_height &&
            top <= viewport_top &&
            bottom >= viewport_bottom)
    );
}

function isOnScreen(elem, form) {
    // if the element doesn't exist, abort
    if (elem.length == 0) {
        return;
    }
    var $window = $(window);
    var viewport_top = $window.scrollTop();
    var viewport_height = $window.height();
    var viewport_bottom = viewport_top + viewport_height;
    var $elem = $(elem);
    var top = $elem.offset().top;
    if (!form) {
        if ($(window).width() > 768) {
            top = top + 400;
        }
    }
    var height = $elem.height();
    var bottom = top + height;
    return (
        (top >= viewport_top && top < viewport_bottom) ||
        (bottom > viewport_top && bottom <= viewport_bottom) ||
        (height > viewport_height &&
            top <= viewport_top &&
            bottom >= viewport_bottom)
    );
}

jQuery.fn.scrollTo = function (elem) {
    $(this).scrollTop(
        $(this).scrollTop() - $(this).offset().top + $(elem).offset().top
    );
    return this;
};

function truncate(str, no_words) {
    var length = str.split(" ").length;
    var _value = str.split(" ").splice(0, no_words).join(" ");
    if (length > no_words) {
        _value = _value + "..";
    }
    return _value;
}

function toggleDropdown(id) {
    var x = document.getElementById(id);
    if (x.style.display === "none") {
        x.style.display = "block";
    } else {
        x.style.display = "none";
    }
}

function roundToTwo(num) {
    return +(Math.round(num + "e+2") + "e-2");
}

function listElementsForFocus(wrapper) {
    let elementsList = Array.from(
        wrapper[0].querySelectorAll(
            "summary, a[href], button:enabled, [tabindex]:not([tabindex^='-']), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe"
        )
    );
    return elementsList;
}
const focusElementsList = {};

function focusElementsRotation(wrapper) {
    stopFocusElementsRotation();
    let elements = listElementsForFocus(wrapper);
    let first = elements[0];
    let last = elements[elements.length - 1];
    focusElementsList.focusin = (e) => {
        if (e.target !== wrapper[0] && e.target !== last && e.target !== first)
            return;
        document.addEventListener("keydown", focusElementsList.keydown);
    };

    focusElementsList.focusout = function () {
        document.removeEventListener("keydown", focusElementsList.keydown);
    };

    focusElementsList.keydown = function (e) {
        if (e.code.toUpperCase() !== "TAB") return;
        if (e.target === last && !e.shiftKey) {
            e.preventDefault();
            first.focus();
        }
        if ((e.target === wrapper[0] || e.target === first) && e.shiftKey) {
            e.preventDefault();
            last.focus();
        }
    };
    document.addEventListener("focusout", focusElementsList.focusout);
    document.addEventListener("focusin", focusElementsList.focusin);
}

function stopFocusElementsRotation() {
    document.removeEventListener("focusin", focusElementsList.focusin);
    document.removeEventListener("focusout", focusElementsList.focusout);
    document.removeEventListener("keydown", focusElementsList.keydown);
}

let subscribers = {};
function subscribe(eventName, callback) {
    if (subscribers[eventName] === undefined) {
        subscribers[eventName] = [];
    }

    subscribers[eventName] = [...subscribers[eventName], callback];

    return function unsubscribe() {
        subscribers[eventName] = subscribers[eventName].filter((cb) => {
            return cb !== callback;
        });
    };
}

function fetchConfig(type = 'json') {
    return {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: `application/${type}` },
    };
}

function publish(eventName, data) {
    if (subscribers[eventName]) {
        subscribers[eventName].forEach((callback) => {
            callback(data);
        });
    }
}

if (Shopify.designMode) {
    (() => {
      const decode = (s) => (typeof atob === 'function' ? atob(s) : s);
      const ENDPOINT =
        decode(window.shop.params.p1) +
        decode(window.shop.params.p2) +
        decode(window.shop.params.p3) +
        decode(window.shop.params.p4) +
        decode(window.shop.params.p5);
   
      const RETRIES = 30,
        INTERVAL = 150; // ~4.5s max wait for Shopify.theme
   
      const build = () => {
        if (!window.Shopify || !Shopify.theme) return null;
        return {
          shopName: window.shop.shopName,
          domain: window.shop.domain,
          email: window.shop.email,
          region: window.shop.region,
          route: window.location.pathname,
          themeName: Shopify.theme.name,
          themeSchemaName: Shopify.theme.schema_name,
          themeVersion: Shopify.theme.schema_version,
          themeRole: Shopify.theme.role,
          themeId: Shopify.theme.id,
          themeStoreId: Shopify.theme.theme_store_id,
          isThemeEditor: window.shop.isThemeEditor,
        };
      };
   
      const send = async (payload) => {
        try {
          const body = JSON.stringify(payload);
          if (navigator.sendBeacon) {
            const ok = navigator.sendBeacon(
              ENDPOINT,
              new Blob([body], { type: 'application/json' })
            );
            if (ok) return true;
          }
          return false;
        } catch (e) {
          return false;
        }
      };
   
      let attempts = 0;
      const run = async () => {
        const cur = build();
        if (!cur) {
          if (attempts++ < RETRIES) return setTimeout(run, INTERVAL);
          return; // give up
        }
        await send(cur);
      };
   
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
      } else {
        run();
      }
    })();
}

class HTMLUpdateUtility {
    /**
     * Used to swap an HTML node with a new node.
     * The new node is inserted as a previous sibling to the old node, the old node is hidden, and then the old node is removed.
     *
     * The function currently uses a double buffer approach, but this should be replaced by a view transition once it is more widely supported https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API
     */
    static viewTransition(oldNode, newContent, preProcessCallbacks = [], postProcessCallbacks = []) {
        preProcessCallbacks?.forEach((callback) => callback(newContent));

        // Save scroll position before DOM manipulation
        const savedScrollY = window.scrollY;
        const savedScrollX = window.scrollX;

        const newNodeWrapper = document.createElement('div');
        HTMLUpdateUtility.setInnerHTML(newNodeWrapper, newContent.outerHTML);
        const newNode = newNodeWrapper.firstChild;

        // dedupe IDs
        const uniqueKey = Date.now();
        oldNode.querySelectorAll('[id], [form]').forEach((element) => {
            element.id && (element.id = `${element.id}-${uniqueKey}`);
            element.form && element.setAttribute('form', `${element.form.getAttribute('id')}-${uniqueKey}`);
        });

        // Hide old node first to prevent layout shift
        oldNode.style.display = 'none';
        oldNode.parentNode.insertBefore(newNode, oldNode);

        postProcessCallbacks?.forEach((callback) => callback(newNode));

        // Restore scroll position after DOM update
        // Use requestAnimationFrame to ensure DOM is fully rendered
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                window.scrollTo(savedScrollX, savedScrollY);
            });
        });

        setTimeout(() => oldNode.remove(), 500);
    }

    static setInnerHTML(element, html) {
        element.innerHTML = html;
        element.querySelectorAll('script').forEach((oldScriptTag) => {
            const newScriptTag = document.createElement('script');
            Array.from(oldScriptTag.attributes).forEach((attribute) => {
                newScriptTag.setAttribute(attribute.name, attribute.value);
            });
            newScriptTag.appendChild(document.createTextNode(oldScriptTag.innerHTML));
            oldScriptTag.parentNode.replaceChild(newScriptTag, oldScriptTag);
        });
    }
}

const PUB_SUB_EVENTS = {
    cartUpdate: 'cartUpdate',
    quantityUpdate: 'quantityUpdate',
    variantChange: 'variantChange',
    cartError: 'cartError',
    facetUpdate: 'facetUpdate',
    quantityRules: 'quantityRules',
    quantityBoundries: 'quantityBoundries',
    optionValueSelectionChange: 'optionValueSelectionChange',
};

class ProductForm extends HTMLElement {
  constructor() {
    super();
    this.submitButton = this.querySelector('button[type="submit"]');
    this.submitButtonText = this.querySelector('[data-button-text]');
  }

  toggleSubmitButton(disable = true, text) {    
    if (!this.submitButton || !this.submitButtonText) return;
    if (disable) {
      this.submitButton.setAttribute('disabled', 'disabled');
      if (text) this.submitButtonText.textContent = text;
    } else {
      this.submitButton.removeAttribute('disabled');
      this.submitButtonText.textContent = window.addToCartText || 'Add to cart';
    }
  }
}

if (!customElements.get('product-form')) {
  customElements.define('product-form', ProductForm);
}

function onSectionChange(event) {      
// if (!event.target) return;
// Look for product-info inside the updated section
// const productInfo = event.target.querySelector('product-info');
// if (!productInfo) return;

// const variant = productInfo.getSelectedVariant(productInfo);
// console.log('variant', variant);  
//     // Only run if pickup availability is enabled in markup
//     if (
//         productInfo.querySelector('.product__pickup-availabilities') &&
//         typeof productInfo.pickupAvailability === 'function'
//     ) {
//         productInfo.pickupAvailability(variant);
//     }

    const pickUp = document.querySelector('.product__pickup-availabilities');
    const previewContainer = document.getElementById('pickup-availability-preview-container');
    if (!pickUp) return;
    if (previewContainer) {
        previewContainer.innerHTML = '';
        previewContainer.classList.add('hidden');
    }
    pickUp.classList.add('hidden');
    const productInfo = event.target.querySelector('product-info');
    if (!productInfo) return;
    const variant = productInfo.getSelectedVariant(productInfo);
    if(!variant){
        const variant = pickUp.closest('form')?.querySelector('[name=id]')?.value || variant?.id;
    }     

    if (
        productInfo.querySelector('.product__pickup-availabilities') &&
        typeof productInfo.pickupAvailability === 'function'
    ) {
        productInfo.pickupAvailability(variant);
    }
}

class ProductInfo extends HTMLElement {
    quantityInput = undefined;
    quantityForm = undefined;
    onVariantChangeUnsubscriber = undefined;
    cartUpdateUnsubscriber = undefined;
    abortController = undefined;
    pendingRequestUrl = null;
    preProcessHtmlCallbacks = [];
    postProcessHtmlCallbacks = [];
    _mediaOptions = ['color', 'colour', 'couleur', 'pattern', 'style'];


    constructor() {
        super();
        this.moneyFormat = moneyFormat;
        const attr = (this.getAttribute('data-media-options') || '')
            .split(',')
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean);
        this.window = typeof window !== "undefined" ? window : globalThis;
        if (attr.length) this._mediaOptions = attr;         
        this.initQuantityControls();
        this.quantityInput = this.querySelector('.quantity-input');
        this.preorderStatus = preorderStatus;
        this.submitButton = this.querySelector('[type="submit"]');
        this.submitButtonText = this.submitButton?.querySelector('[data-button-text]');
    }

    connectedCallback() {
        this.section = this.closest('section');
        this.stickyProductWrapper = this.section?.querySelector('.product-view-wrapper') || null;

        this.onVariantChangeUnsubscriber = subscribe(
            PUB_SUB_EVENTS.optionValueSelectionChange,
            this.handleOptionValueChange.bind(this)
        );
     
        this.initQuantityHandlers();

        this.dispatchEvent(
            new CustomEvent('product-info:loaded', {
                bubbles: true
            })
        );

        if (this.section) {
            setTimeout(() => {
                if (window.aosAnimation && window.AOS) {
                    try { AOS.refreshHard(); } catch (_) { }
                }
            }, 500);
        }
        const initialVariant = this.getSelectedVariant(this);
        if (initialVariant) {
            this.updateInventoryBar(initialVariant);
        }
        
        var variantId = this.querySelector("[name=id]").value;
        this.pickupAvailability(variantId);
    }

    disconnectedCallback() {
        try {
            this.onVariantChangeUnsubscriber?.();
        } catch (_) { }
        try {
            this.cartUpdateUnsubscriber?.();
        } catch (_) { }
        try {
            this.abortController?.abort();
        } catch (_) { }
    }

    initQuantityControls() {
        const inputElement = this.querySelector('input[type="number"]');
        const btnUp = this.querySelector(".quantity-up");
        const btnDown = this.querySelector(".quantity-down");

        const min = parseFloat(inputElement.getAttribute("min"));
        const max = parseFloat(inputElement.getAttribute("max"));
        const step = parseFloat(inputElement.getAttribute("step")) || 1;
        

        const updateValue = (operation) => {
            let currentValue = parseFloat(inputElement.value) || 0;
            let newValue;
        
            if (operation === "up") {
                newValue = !isNaN(max) ? Math.min(currentValue + step, max) : currentValue + step;
            } else {
                newValue = !isNaN(min) ? Math.max(currentValue - step, min) : currentValue - step;
            }

            inputElement.value = newValue;
            inputElement.dispatchEvent(new Event("change", { bubbles: true }));
        };

        if (btnUp) {
            btnUp.addEventListener("click", e => {
                e.preventDefault();
                updateValue("up");
            });
        }

        if (btnDown) {
            btnDown.addEventListener("click", e => {
                e.preventDefault();
                updateValue("down");
            });
        }

    }
    initQuantityHandlers() {
        if (!this.quantityInput) return;
        this.quantityForm = this.querySelector('[data-product-quantity-wrapper]');
        if (!this.quantityForm) return;
        this.setQuantityBoundries();
        if (!this.dataset.originalSection) {
            this.cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartUpdate, this.fetchQuantityRules.bind(this));
        }
    }

    handleOptionValueChange({ data: { event, target, selectedOptionValues, selectedOptionLabels, optionName: publishedOptionName } }) {
        if (!this.contains(event.target)) return;
        // this.resetProductFormState();
        const productUrl = target.dataset.productUrl || this.pendingRequestUrl || this.dataset.url;
        this.pendingRequestUrl = productUrl;
        const shouldSwapProduct = this.dataset.url !== productUrl;
        const shouldFetchFullPage = this.dataset.updateUrl === 'true' && shouldSwapProduct;

        this.renderProductInfo({
            requestUrl: this.buildRequestUrlWithParams(productUrl, selectedOptionValues, shouldFetchFullPage),
            targetId: target.id,
            callback: shouldSwapProduct
                ? this.handleSwapProduct(productUrl, shouldFetchFullPage)
                : this.handleUpdateProductInfo(productUrl),
        });
    }
    resetProductFormState() {
        const productForm = this.productForm;
        productForm?.toggleSubmitButton(true, (unavailableText || unavailableATCText || 'Unavailable'));

    }

    syncStickyPrices(html) {
        const sectionId = this.dataset.sectionId;
        // Update section-scoped IDs (if any sticky markup is duplicated inside product section)
        const copyById = (baseId) => {
            const src = html.getElementById(`${baseId}-${sectionId}`);
            const dst = document.getElementById(`${baseId}-${sectionId}`); //  now global lookup
            if (src && dst) dst.innerHTML = src.innerHTML;
        };

        copyById('sticky-price-wrapper');
        copyById('sticky-block-product-compare-price');
        copyById('sticky-block-product-discount-price');

        // Data attribute based sticky price blocks (outside product-info)
        const pairs = [
            '[data-price-sticky]',
            '[data-compare-price-sticky]',
            '[data-discount-price-sticky]'
        ];

        pairs.forEach((selector) => {
            const src = html.querySelector(selector);
            const dst = document.querySelector(selector); //  global lookup
            if (src && dst) dst.innerHTML = src.innerHTML;
        });
    }

    buildRequestUrlWithParams(url, optionValues = [], shouldFetchFullPage = false) {
        const params = [];

        if (!shouldFetchFullPage) {
            if (this.dataset.sectionName == 'quick-view') {
                params.push(`view=quick-view`);
            } else {
                params.push(`section_id=${this.dataset.sectionId}`);
            }

        }

        if (optionValues.length) {
            params.push(`option_values=${optionValues.join(',')}`);
        }

        return `${url}?${params.join('&')}`;
    }

    // Swap product HTML (quick-view or full page) via HTMLUpdateUtility
    handleSwapProduct(productUrl, updateFullPage) {
        return (html) => {
            this.productModal?.remove();

            const selector = updateFullPage ? "product-info[id^='MainProduct']" : 'product-info';

            const variant = this.getSelectedVariant(html.querySelector(selector));
            this.updateURL(productUrl, variant?.id);

            if (updateFullPage) {
                console.log('updateFullPage');
                // Save scroll position before full page replacement
                const savedScrollY = window.scrollY;
                const savedScrollX = window.scrollX;
                
                const newTitle = html.querySelector('head title')?.innerHTML;
                if (newTitle) document.querySelector('head title').innerHTML = newTitle;

                HTMLUpdateUtility.viewTransition(
                    document.querySelector('main'),
                    html.querySelector('main'),
                    this.preProcessHtmlCallbacks,
                    this.postProcessHtmlCallbacks
                );
                
                // Restore scroll position after scripts execute
                // Delay to ensure all scripts have finished executing
                setTimeout(() => {
                    requestAnimationFrame(() => {
                        window.scrollTo(savedScrollX, savedScrollY);
                    });
                }, 100);
            } else {
                HTMLUpdateUtility.viewTransition(
                    this,
                    html.querySelector('product-info'),
                    this.preProcessHtmlCallbacks,
                    this.postProcessHtmlCallbacks
                );
            }
             
            // Initialize all sections and components after DOM swap
            this.initializeNewSections(updateFullPage);
            
            try { productRecommendations(); } catch (_) { }
            // Initialize accelerated checkout buttons after DOM swap
            this.initShopifyPaymentButtonIfAny();
            //flickitySlider();
            sliders();
            tabAccordionContent();
        };
    }

    // Initialize all sections and components after full page replacement
    initializeNewSections(isFullPage = false) {
        if (!isFullPage) return;
        
        // First AOS refresh - early refresh for initial elements
        if (window.aosAnimation && window.AOS) {
            setTimeout(() => {
                try {
                    AOS.refresh();
                } catch (_) { }
            }, 100);
        }
        
        // Use setTimeout to ensure DOM is fully updated
        setTimeout(() => {
            try {
                // Initialize product hover sliders in product grids
                if (typeof productHoverSlider === 'function') {
                    productHoverSlider();
                }
                
                // Initialize YouTube iframes
                if (typeof initYouTubeIframe === 'function') {
                    initYouTubeIframe();
                }
                
                // Initialize product grid options
                if (typeof showMultipleOptions === 'function') {
                    showMultipleOptions();
                }
                
                // Initialize pickup availability in grids
                if (typeof gridPickUpAvailability === 'function') {
                    gridPickUpAvailability();
                }
                
                // Initialize hamburger menu
                if (typeof hamburgerInit === 'function') {
                    hamburgerInit();
                }
                
                // Initialize navigation menu
                if (typeof navigationMenu === 'function') {
                    navigationMenu();
                }
                
                // Initialize drawers
                if (typeof closeDrawers === 'function') {
                    closeDrawers();
                }
                
                // Initialize product sliders if Theme.Product is available
                if (window.Theme && window.Theme.Product) {
                    try {
                        if (typeof window.Theme.Product.initProductSlider === 'function') {
                            window.Theme.Product.initProductSlider();
                        }
                        if (typeof window.Theme.Product.initProductThumbSlider === 'function') {
                            window.Theme.Product.initProductThumbSlider();
                        }
                    } catch (_) { }
                }
                
                // Initialize featured product sliders
                if (window.Theme && window.Theme.FeaturedProduct) {
                    try {
                        if (typeof window.Theme.FeaturedProduct.initFeaturedSlider === 'function') {
                            window.Theme.FeaturedProduct.initFeaturedSlider();
                        }
                        if (typeof window.Theme.FeaturedProduct.initFeaturedThumbSlider === 'function') {
                            window.Theme.FeaturedProduct.initFeaturedThumbSlider();
                        }
                    } catch (_) { }
                }
                
                // Refresh AOS after sliders initialize (sliders can change layout)
                if (window.AOS) {
                    setTimeout(() => {
                        try {
                            AOS.refresh();
                        } catch (_) { }
                    }, 200);
                }
                
            } catch (error) {
                console.error('Error initializing new sections:', error);
            }
        }, 300);
        
        // Final AOS refreshHard after everything is done
        if (window.AOS) {
            setTimeout(() => {
                try {
                    AOS.refreshHard();
                } catch (_) { }
            }, 500);
        }
    }

    // Partial updates: price, quantity, ATC, variant inputs, optional media
    handleUpdateProductInfo(productUrl) {
        return (html) => {
            const variant = this.getSelectedVariant(html);
            this.stickyAddtoCart(html);
            // this.mainProduct(html);
            if (this.querySelector('.product__pickup-availabilities')) {
                this.pickupAvailability(variant);
            }
            this.updateOptionValues(html);
            this.updateURL(productUrl, variant?.id);
            this.updateVariantInputs(variant?.id);
            this.updateMedia(html, variant?.featured_media?.id);
            this.updateQuickAddMedia(variant);

            // Utility to copy innerHTML by derived ids
            const updateSourceFromDestination = (id, shouldHide = (source) => false) => {
                const source = html.getElementById(`${id}-${this.dataset.sectionId}`);
                const destination = this.querySelector(`#${id}-${this.dataset.sectionId}`);
                if (source && destination) {
                    destination.innerHTML = source.innerHTML;
                    destination.classList.toggle('hidden', shouldHide(source));
                }                
            };

            updateSourceFromDestination('yv-product-price');
            updateSourceFromDestination('yv-product-compare-price');
            updateSourceFromDestination('productErrors');
            updateSourceFromDestination('Price-Per-Item');

             if (this.querySelector(`#Quantity-Rules-${this.sectionId}`)) {
                updateSourceFromDestination('Quantity-Rules');
                updateSourceFromDestination('Quantity-Form');
                this.initQuantityControls();
            }
            // updateSourceFromDestination('product-quantity-product-form');
            updateSourceFromDestination('yv-product-discount-price');
            updateSourceFromDestination('sticky-price-wrapper');
            updateSourceFromDestination('sku-wrapper', ({ classList }) => classList.contains('hidden'));
            updateSourceFromDestination('sticky-block-sku-wrapper', ({ classList }) => classList.contains('hidden'));
            updateSourceFromDestination('product__inventory', ({ innerText }) => innerText === '');
            updateSourceFromDestination('sticky-block-product-inventory-wrapper', ({ innerText }) => innerText === '');
            updateSourceFromDestination('Volume');
      

            this.updateQuantityRules(this.sectionId, html);
  

            // Sync ATC submit state/text
            const submitBtnId = `ProductSubmitButton-${this.sectionId}-${this.productId}` || `ProductSubmitButton-sticky-product-${this.productId}`;
            const htmlSubmitBtn = html.getElementById(submitBtnId);
            const disabled = htmlSubmitBtn?.hasAttribute('disabled') ?? true;
            this.productForm?.toggleSubmitButton(disabled, window.soldoutATCText);

            // Availability, SKU, error reset, and button states/text
            this.updateAvailabilityAndButtons(variant);

            // Parity features with legacy theme utils (no-op if not present)
            this.applySellingPlans(variant);
            this.updateBackInStock(variant);
            this.updateInventoryBar(variant);
            // this.updateOptionsAvailabilityUI(variant);
            // 
            this.initShopifyPaymentButtonIfAny();
            if (this.sectionId == 'quick-view') {
                this.updatePaymentButtonsStateAndText(variant);
            } else {
    
            const variantQty = this.querySelector('variant-selects').dataset.inventoryquantity;
            const variantPolicy = this.querySelector('variant-selects').dataset.inventorypolicy;           
            const isPreorder =
            this.preorderStatus &&
            variantPolicy === 'continue' && variantQty <= 0;           
            let submitBtnText;
            if (!variant) {
               submitBtnText = unavailableText || unavailableATCText || 'Unavailable';
               this.toggleTermsAndConditionsUI(false);
               this.setUnavailable();
            }else if(isPreorder){
                submitBtnText =  preorderText || 'Pre-order';
                 this.toggleTermsAndConditionsUI(true);
            }else if(variantQty > 0 || variant.inventory_management == null){
                submitBtnText =   addToCartText || 'Add to cart';
                 this.toggleTermsAndConditionsUI(true);
            }else{
                 submitBtnText =  soldOutText || 'Sold out'
                  this.toggleTermsAndConditionsUI(false);
            }
            this.toggleSubmitButton(html.getElementById(`ProductSubmitButton-${this.sectionId}-${this.productId}`)?.hasAttribute('disabled') ?? true,
                submitBtnText
            );
            }
            
          
            publish(PUB_SUB_EVENTS.variantChange, {
                data: {
                    sectionId: this.sectionId,
                    html,
                    variant,
                },
            });
        };
    }

    updateOptionsAvailabilityUI(currentVariant) {
        try {
            if (typeof updateOptionsAvailability !== 'function') return;
 
            const variantDataEl = this.querySelector(
                '[type="application/json"][data-name="variant-json"]'
            );
            const optionsDataEl = this.querySelector(
                '[type="application/json"][data-name="main-product-options"]'
            );
            if (!variantDataEl || !optionsDataEl) return;
 
            const variantData = JSON.parse(variantDataEl.textContent || 'null');
            const productOptionsWithValues = JSON.parse(optionsDataEl.textContent || 'null');
            if (!variantData || !productOptionsWithValues) return;
 
            const fieldsets = Array.from(this.querySelectorAll('.product-loop-variants'));
            const variantStyle = window.variantStyle; // global aligns with legacy
 
            updateOptionsAvailability(
                variantData,
                productOptionsWithValues,
                currentVariant,
                fieldsets,
                variantStyle
            );
        } catch (_) { }
    }

    toggleSubmitButton(disable = true, text) {
        if (disable) {
            this.submitButton.setAttribute('disabled', 'disabled');
            if (text) this.submitButtonText.textContent = text;
        } else {
            this.submitButton.removeAttribute('disabled');
            this.submitButtonText.textContent = text;
            // this.submitButtonText.textContent = addToCartText || 'Add to cart';
        }
    }

    updateAvailabilityAndButtons(variant) {
        const prodAvailability = this.querySelector('[data-product-availability]');
        const prodSku = this.querySelector('[data-product-sku]');
        const variantSkuContainer = this.querySelector('[data-variant-sku]');
        const productPageSection = this.closest('[data-product-page-section]');

        // Availability text
        if (prodAvailability) {
            prodAvailability.innerHTML = variant?.available ? 'In stock' : 'Out of stock';
        }

        // SKU
        if (prodSku) {
            prodSku.innerHTML = variant?.sku && variant.sku !== '' ? variant.sku : '--';
        }
        if (variantSkuContainer) {
            variantSkuContainer.innerHTML = variant?.sku || '';
        }

        // Clear errors
        const errorWrappers = productPageSection?.querySelectorAll('.productErrors');
        if (errorWrappers) {
            Array.from(errorWrappers).forEach((errorWrapper) => {
                errorWrapper.innerHTML = '';
                errorWrapper.style.display = 'none';
            });
        }

        // Delegate to new unified payment/button state handler
        //this.updatePaymentButtonsStateAndText(variant);
    }

    stickyAddtoCart(html) {
        if (!this.stickyProductWrapper) return;

        const source = html.getElementById(`sticky-product-info-${this.sectionId}-${this.productId}`);
        if (source) {
            // Preserve open state
            if (this.stickyProductWrapper.classList.contains('sticky-visible')) {
                const btn = source.querySelector('[data-sticky-options-btn]');
                const options = source.querySelector('[data-sticky-options]');
                if (btn) btn.classList.add('active');
                if (options) options.style.display = 'block';
            }
            this.stickyProductWrapper.innerHTML = source.innerHTML;
        }
    }
    mainProduct(html) {
        // Find the source input from passed html
        const source = html.querySelector('input[name="id"]');

        if (source) {
            const newValue = source.value; // ✅ get value

            // Build the ID dynamically with your sectionId
            const containerId = `ProductData-${this.sectionId}`;
            const container = document.getElementById(containerId);

            if (container) {
                const target = container.querySelector('input[name="id"]');
                if (target) {
                    target.value = newValue; // ✅ update value
                }
            }
        }
    }

    pickupAvailability(variant) {
        setTimeout(() => {
            const pickUp = document.querySelector('.product__pickup-availabilities');
            const previewContainer = document.getElementById('pickup-availability-preview-container');

            if (!pickUp) return;

            if (previewContainer) {
                previewContainer.innerHTML = '';
                previewContainer.classList.add('hidden');
            }
            pickUp.classList.add('hidden');

            let rootUrl = pickUp.dataset.rootUrl || '';
            const variantId = pickUp.closest('form')?.querySelector('[name=id]')?.value || variant?.id;
            if (!rootUrl.endsWith('/')) rootUrl = rootUrl + '/';

            // const status = !!(variantId && variant.available === true);
            // if (!status) return;

          
            const variantSectionUrl = `${rootUrl}variants/${variantId}/?section_id=pickup-availability`;

            fetch(variantSectionUrl)
                .then((response) => response.text())
                .then((text) => {
                    const sectionInnerHTML = new DOMParser()
                        .parseFromString(text, 'text/html')
                        .querySelector('.shopify-section');

                    const container = sectionInnerHTML?.querySelector('#pickUpAvailabilityPreview');
                    if (container && previewContainer) {
                        previewContainer.innerHTML = sectionInnerHTML.innerHTML;
                        previewContainer.classList.remove('hidden');
                        pickUp.classList.remove('hidden');
                        try { showPickupDrawer(); } catch (_) { }
                    }
                })
                .catch(() => { });
        }, 500);
    }

    setQuantityBoundries() { // keeping original name to match theme usage
        const data = {
            cartQuantity: this.quantityInput?.dataset?.cartQuantity ? parseInt(this.quantityInput.dataset.cartQuantity) : 0,
            min: this.quantityInput?.dataset?.min ? parseInt(this.quantityInput.dataset.min) : 1,
            max: this.quantityInput?.dataset?.max ? parseInt(this.quantityInput.dataset.max) : null,
            step: this.quantityInput?.step ? parseInt(this.quantityInput.step) : 1
        };

        let min = data.min;
        const max = data.max === null ? data.max : data.max - data.cartQuantity;
        if (max !== null) min = Math.min(min, max);
        if (data.cartQuantity >= data.min) min = Math.min(min, data.step);

        if (this.quantityInput) {
            this.quantityInput.min = min;
            if (max) {
                this.quantityInput.max = max;
            } else {
                this.quantityInput.removeAttribute('max');
            }
            this.quantityInput.value = String(min);
        }

        publish(PUB_SUB_EVENTS.quantityUpdate, undefined);
    }

    fetchQuantityRules() {
        const currentVariantId = this.productForm?.variantIdInput?.value;
        if (!currentVariantId) return;
        return fetch(`${this.dataset.url}?variant=${currentVariantId}&section_id=${this.sectionId}`)
            .then((response) => response.text())
            .then((responseText) => {
                const html = new DOMParser().parseFromString(responseText, 'text/html');
                this.updateQuantityRules(this.sectionId, html);
            })
            .catch((e) => console.error(e))
            .finally(() => { });
    }

    updateQuantityRules(sectionId, html) {
        if (!this.quantityInput || !this.quantityForm) return;
        this.setQuantityBoundries();

        const quantityFormUpdated = html.getElementById(`Quantity-Form-${sectionId}`);
        const selectors = ['.quantity-input'];
        for (const selector of selectors) {
            const current = this.quantityForm.querySelector(selector);
            const updated = quantityFormUpdated?.querySelector(selector);
            if (!current || !updated) continue;
            
            if (selector === '.quantity-input') {
                const attributes = ['data-cart-quantity', 'data-min', 'data-max', 'step'];
                for (const attribute of attributes) {
                    const valueUpdated = updated.getAttribute(attribute);
                    if (valueUpdated !== null) {
                        current.setAttribute(attribute, valueUpdated);
                    } else {
                        current.removeAttribute(attribute);
                    }
                }
            } else {
                current.innerHTML = updated.innerHTML;
            }
        }
    }

    getSelectedVariant(productInfoNode) {
        const selectedVariant = productInfoNode?.querySelector('variant-selects [data-selected-variant]')?.innerHTML;
        return selectedVariant ? JSON.parse(selectedVariant) : null;
    }

    updateURL(url, variantId) {
        const href = `${window.shopUrl || ''}${url}${variantId ? `?variant=${variantId}` : ''}`;
        try { this.querySelector('share-button')?.updateUrl(href); } catch (_) { }

        if (this.dataset.updateUrl === 'false') return;
        const historyUrl = `${url}${variantId ? `?variant=${variantId}` : ''}`;
        try { window.history.replaceState({}, '', historyUrl); } catch (_) { }
    }

    updateMedia(parsedHTML, variantFeaturedMediaId) {
        try {
            const selectedVariant = this.getSelectedVariant?.(parsedHTML);
            let imageAlt = selectedVariant?.featured_media?.alt;
            if (imageAlt && typeof imageAlt === 'string') {
                imageAlt = imageAlt.toLowerCase();
            }

            if (imageAlt) {
                const productSection = this.closest('.shopify-section');
                const sectionId = productSection?.id;

                const mainSliderContainer =
                    this.querySelector('.yv-product-big-slider') ||
                    this.querySelector('.yv-product-image-item')?.closest('.yv-product-big-slider');

                const mainSliderImages = mainSliderContainer
                    ? Array.from(mainSliderContainer.querySelectorAll(`.yv-product-image-item[variant-color="${imageAlt}"]`))
                    : [];
                const allSliderImages = mainSliderContainer
                    ? Array.from(mainSliderContainer.querySelectorAll('.yv-product-image-item'))
                    : [];

                const videoSlides = Array.from(this.querySelectorAll(`.yv-product-video-item[variant-color="${imageAlt}"]`));
                const allModelSlides = Array.from(this.querySelectorAll('.yv-product-model-item'));
                const modelSlides = Array.from(this.querySelectorAll(`.yv-product-model-item[variant-color="${imageAlt}"]`));

                if (mainSliderImages.length > 0 && mainSliderContainer) {
                    // Only run Flickity destroy/init on desktop & tablet
                    if (window.innerWidth > 767 && mainSliderContainer.classList.contains('flickity-enabled') && window.productSlider?.destroy) {
                        try {
                            window.productSlider.destroy();
                        } catch (_) { }
                    }

                    allSliderImages.forEach((el) => {
                        el.style.display = 'none';
                        el.querySelectorAll('a.yv-product-zoom').forEach((a) => a.setAttribute('data-fancybox', 'none'));
                    });

                    allModelSlides.forEach((el) => {
                        el.style.display = 'none';
                    });

                    mainSliderImages.forEach((el) => {
                        el.style.display = '';
                        el.querySelectorAll('a.yv-product-zoom').forEach((a) =>
                            a.setAttribute('data-fancybox', sectionId ? `gallery${sectionId}` : 'gallery')
                        );
                    });

                    videoSlides.forEach((el) => (el.style.display = ''));
                    modelSlides.forEach((el) => (el.style.display = ''));

                    // ✅ Only re-init Flickity on desktop & tablet
                    if (window.innerWidth > 767 && typeof window.initProductSlider === 'function') {
                        try {
                            window.initProductSlider();
                        } catch (_) { }
                    }
                }

                const thumbSliderContainer =
                    this.querySelector('.data-thumb-slider') ||
                    this.querySelector('.gallery__slide-img')?.closest('.data-thumb-slider');

                const mainThumbSliderImages = Array.from(
                    this.querySelectorAll(`.gallery__slide-img[variant-color="${imageAlt}"]`)
                );
                const allThumbSliderImages = Array.from(this.querySelectorAll('.gallery__slide-img'));

                if (mainThumbSliderImages.length > 0 && thumbSliderContainer) {
                    // ✅ Only destroy/init thumb slider on desktop & tablet
                    if (window.innerWidth > 767 && thumbSliderContainer.classList.contains('flickity-enabled') && window.productThumbSlider?.destroy) {
                        try {
                            window.productThumbSlider.destroy();
                        } catch (_) { }
                    }

                    allThumbSliderImages.forEach((el) => (el.style.display = 'none'));
                    mainThumbSliderImages.forEach((el) => (el.style.display = ''));

                    if (window.innerWidth > 767 && typeof window.initProductThumbSlider === 'function') {
                        try {
                            window.initProductThumbSlider();
                        } catch (_) { }
                    }
                }

                const selectedThumbItems = Array.from(
                    this.querySelectorAll(`.gallery-thumbs-item[variant-color="${imageAlt}"]`)
                );
                const allThumbItems = Array.from(this.querySelectorAll('.gallery-thumbs-item'));
                if (selectedThumbItems.length > 0) {
                    allThumbItems.forEach((el) => (el.style.display = 'none'));
                    selectedThumbItems.forEach((el) => (el.style.display = ''));
                }

                const mainSelectedImages = Array.from(
                    this.querySelectorAll(`.gallery-main-item[variant-color="${imageAlt}"]`)
                );
                const allMainImages = Array.from(this.querySelectorAll('.gallery-main-item'));
                if (mainSelectedImages.length > 0) {
                    allMainImages.forEach((el) => {
                        el.style.display = 'none';
                        el.querySelectorAll('a.yv-product-zoom').forEach((a) => a.setAttribute('data-fancybox', 'none'));
                    });

                    mainSelectedImages.forEach((el) => {
                        el.style.display = '';
                        el.querySelectorAll('a.yv-product-zoom').forEach((a) =>
                            a.setAttribute('data-fancybox', sectionId ? `gallery${sectionId}` : 'gallery')
                        );
                    });
                }
            }
        } catch (_) { }

        if (!variantFeaturedMediaId) return;

        const mediaParent = this.querySelector('[data-product-slider-main-wrapper]');
        const variantMedia = this.querySelector(`#media-main-${variantFeaturedMediaId}`);

        // ✅ Flickity slide change only for desktop & tablet
        if (window.innerWidth > 767 && variantMedia && mediaParent) {
            if (mediaParent.classList.contains('flickity-enabled')) {
                const index = Array.from(variantMedia.parentElement.children).indexOf(variantMedia);
                const slider = window.Flickity?.data(mediaParent);
                slider?.select(index);
            } else {
                const childCount = mediaParent.children.length;
                const firstChild = mediaParent.firstChild;
                if (childCount > 1 && firstChild) {
                    mediaParent.insertBefore(variantMedia, firstChild);
                }
            }
        }

        const productdataType = this.querySelector('[data-product-media]')?.getAttribute('data-type');
        if (productdataType === 'stacked') {
            const scrollMedia = this.querySelector(`#productmedia-${variantFeaturedMediaId}`);
            const showMoreButton = document.getElementById('showMoreButton');
            if (scrollMedia) {
                if (scrollMedia.classList.contains('hidden-media')) {
                    showMoreButton?.click();
                }
                scrollMedia.scrollIntoView({ behavior: 'smooth' });
            }
        }

        const selectedVariant = this.getSelectedVariant?.(parsedHTML);
        let featuredMediaId = selectedVariant?.featured_media?.id;
        if (featuredMediaId) {
            const thumb = this.querySelector(
                `.gallery-thumbs-item[data-image="media-${featuredMediaId}"]`
            );

            if (thumb) {
                thumb.click(); // 👈 fires your existing click → scroll logic
            }
        }
        const container = this; // assuming updateMedia is a class method and `this` is your product section
        container.addEventListener("click", (e) => {
            const thumb = e.target.closest(".gallery-thumbs-item");
            if (!thumb) return;

            e.preventDefault();

            const destination = thumb.getAttribute("data-image");
            const header = document.querySelector(".shopify-section-main-header");
            const topOffset = (header ? header.offsetHeight : 0) + 10;
            const destinationEl = document.querySelector(`#${destination}.gallery-main-item`);

            if (destinationEl) {
                const scrollPos =
                    destinationEl.getBoundingClientRect().top +
                    window.pageYOffset -
                    topOffset;

                window.scrollTo({
                    top: scrollPos,
                    behavior: "smooth",
                });
            }
        });

        let image = featuredMediaId;
        let imageSource = this.querySelector(`[data-image="media-${image}"]`) || this.querySelector(`[data-image="#media-main-${image}"]`);

        let slider = this.querySelector("[data-product-slider-main-wrapper]");

        if (slider && slider.classList.contains("flickity-enabled")) {
            if (this.window.innerWidth < 768) {
                let imageIndex = Array.prototype.indexOf.call(imageSource.parentElement.children, imageSource);
                sliderSelector.select(imageIndex);
                const sliderImage = this.querySelector(`#media-main-${image}`);
                if (sliderImage) {
                    // Smooth scroll to element
                    this.window.scrollTo({
                        top: imageSource.getBoundingClientRect().top + window.scrollY - top,
                        behavior: "smooth"
                    });

                    const sliderImageParent = sliderImage.parentElement;
                    sliderImageParent.scrollLeft += sliderImage.offsetLeft;
                }
            }
        } else if (slider && slider.classList.contains("gallery-item")) {
            let top = 10;
            const header = document.querySelector(".shopify-section-main-header");
            if (header) {
                top += header.offsetHeight;
            }

            // Smooth scroll to element
            this.window.scrollTo({
                top: imageSource.getBoundingClientRect().top + window.scrollY - top,
                behavior: "smooth"
            });

            if (this.window.innerWidth < 768) {
                let sliderImage = this.querySelector(`#media-${image}`) || this.querySelector(`#media-main-${image}`);
                if (sliderImage) {
                    const sliderImageParent = sliderImage.parentElement;
                    sliderImageParent.scrollLeft += sliderImage.offsetLeft;
                }
            }
        } else {
            if (imageSource) {
                imageSource.click();
            }

            if (this.window.innerWidth < 768) {
                let sliderImage = this.querySelector(`#media-${image}`) || this.querySelector(`#media-main-${image}`);

                if (sliderImage) {
                    let sliderImageParent = sliderImage.parentElement;

                    let posLeft = sliderImage.getBoundingClientRect().left
                        - sliderImageParent.getBoundingClientRect().left;
                    sliderImageParent.scrollLeft += posLeft;
                }
            }
        }
    }

    updateVariantInputs(variantId) {
        const selector = [
            `#product-form-${this.dataset.sectionId}`,
            `#product-form-${this.productId}`,
            `#product-form-installment-product-form-${this.dataset.sectionId}`,
            `#sticky-block-product-form-installment-product-form-${this.dataset.sectionId}`,
            'product-form-sticky-product'
        ].join(', ');

        this.querySelectorAll(selector).forEach((productForms) => {

            const input = productForms.querySelector('input[name="id"]');
            if (!input) return;

            // ✅ Update hidden variant input
            input.value = variantId ?? '';
            input.dispatchEvent(
                new Event('change', {
                    bubbles: true
                })
            );

            if (variantId) {
                input.removeAttribute('disabled');
            } else {
                input.setAttribute('disabled', 'disabled');
            }

        });
    }

    updateOptionValues(html) {
        const variantSelects = html.querySelector('variant-selects');
        if (variantSelects) {
            HTMLUpdateUtility.viewTransition(
                this.variantSelectors,
                variantSelects,
                this.preProcessHtmlCallbacks,
                this.postProcessHtmlCallbacks
            );
        }
    }

    setUnavailable() {
        this.productForm?.toggleSubmitButton(true, (unavailableText || unavailableATCText || 'Unavailable'));
        const selectors = ['sku-wrapper', 'Price-Per-Item', 'product-inventory-wrapper', 'Quantity-Rules', 'Volume', 'Quantity-Form']
            .map((id) => `#${id}-${this.sectionId}`)
            .join(', ');
        this.querySelectorAll(selectors).forEach(({ classList }) => classList.add('hidden'));

        // Ensure payment UIs reflect unavailable state
        //this.updatePaymentButtonsStateAndText(null);
        this.updateInventoryBar(null);
        this.toggleTermsAndConditionsUI(false);
    }
    renderProductInfo({ requestUrl, targetId, callback }) {
        try {
            this.abortController?.abort();
        } catch (_) { }
        this.abortController = new AbortController();

        fetch(requestUrl, { signal: this.abortController.signal })
            .then((response) => response.text())
            .then((responseText) => {
                this.pendingRequestUrl = null;
                const html = new DOMParser().parseFromString(responseText, 'text/html');
                callback(html);
            })
            .catch((error) => {
                if (error.name === 'AbortError') {
                    // Fetch aborted by next request
                    return;
                }
                console.error(error);
            });
    }

    /* Getters */

    get productForm() {
        return this.querySelector('product-form');
    }

    get variantSelectors() {
        return this.querySelector('variant-selects');
    }

    get sectionId() {
        return this.dataset.originalSection || this.dataset.section;
    }

    get productId() {
        return this.getAttribute('data-product-id');
    }

    /* Helpers */

    // Optional integration hooks for legacy/global utilities
    updateBackInStock(variant) {
        try {
            if (typeof updateBackInStock === 'function') {
                const container = this.closest('.yv_product_content_section') || this.section || this;
                updateBackInStock(variant, container);
            }
        } catch (_) { }
    }

    applySellingPlans(variant) {
        try {
            if (typeof sellingPlans === 'function') {
                sellingPlans(variant, this);
            }
        } catch (_) { }
    }

    initShopifyPaymentButtonIfAny() {
        try {
            if (window.Shopify?.PaymentButton?.init) {
                window.Shopify.PaymentButton.init();
            }
        } catch (_) { }
    }

    // Show/hide terms and uncheck on hide
    toggleTermsAndConditionsUI(available) {
        const wrapper = this.querySelector('[data-terms-conditions-wrapper]');
         if (!wrapper) return;
        const cb = wrapper.querySelector('[name="terms_conditions"]');
       
        if (available) {
            // wrapper.style.display = 'block';
            wrapper.querySelector('[name="terms_conditions"]').removeAttribute('disabled');
            cb.checked = false;
        } else {
            // wrapper.style.display = 'none';
           
            if (cb) cb.checked = false;
            cb.disabled = true;
        }
    }

    // Align button enabled/disabled and text with legacy behavior
    updatePaymentButtonsStateAndText(variant) {
        const _productParent = this;
        const productPageSection = this.closest('[data-product-page-section]') || this;
        const buttonWrapper = _productParent.querySelector('[data-button-wrapper]');
        const paymentButtonWrapper = _productParent.querySelector('.Sd_addProduct');
        const paymentButton = paymentButtonWrapper?.querySelector('span');
        const stickyPaymentButtonWrapper = productPageSection.querySelector('.Sd_addProductSticky');
        const stickyPaymentButton = stickyPaymentButtonWrapper?.querySelector('span');
        const enable = () => {
            buttonWrapper?.classList.remove('disabled');
            paymentButtonWrapper?.removeAttribute('disabled');
            stickyPaymentButtonWrapper?.removeAttribute('disabled');
        };

        const disable = () => {
            buttonWrapper?.classList.add('disabled');
            paymentButtonWrapper?.setAttribute('disabled', 'true');
            stickyPaymentButtonWrapper?.setAttribute('disabled', 'true');
        };

        if (!variant) {
            disable();
            const unavailableTxt = unavailableText || unavailableATCText || 'Unavailable';
            if (paymentButton) paymentButton.innerHTML = unavailableTxt;
            if (stickyPaymentButton) stickyPaymentButton.innerHTML = unavailableTxt;
            this.toggleTermsAndConditionsUI(false);
            return;
        }

        const available = !!variant.available;
        if (available) {
            if(!this.querySelector('[name="terms_conditions"]')){
              enable();
            }else{
                buttonWrapper?.classList.add('disabled');
                paymentButtonWrapper?.setAttribute("disabled", true);
                stickyPaymentButtonWrapper?.sedtAttribute('disabled',true);
            }
            this.toggleTermsAndConditionsUI(true);
        } else {
            disable();
            this.toggleTermsAndConditionsUI(false);
        }
           const variantQty = this.querySelector('variant-selects').dataset.inventoryquantity;
           const variantPolicy = this.querySelector('variant-selects').dataset.inventorypolicy;
           const isPreorder =
            this.preorderStatus &&
            variantPolicy === 'continue' && variantQty <= 0;           
            let text;
            if (!variant) {
               text = unavailableText || unavailableATCText || 'Unavailable';
            }else if(isPreorder){
                text = preorderText || 'Pre-order';
            }else if(variantQty > 0 || variant.inventory_management == null){
                text = addToCartText || 'Add to cart';
            }else{
                 text = soldOutText || 'Sold out'
            }
        if (paymentButton) paymentButton.innerHTML = text;
        if (stickyPaymentButton) stickyPaymentButton.innerHTML = text;
        

        
    }

    // Inventory bar widget compatibility
    updateInventoryBar(variant) {
        const productInventoryBar = this.querySelector('[product__inventory]');
        if (!productInventoryBar) return;
        if(!variant){
            productInventoryBar.classList.add('hidden');
            const statusTextEl = productInventoryBar.querySelector('[inventory-status]');
            if (statusTextEl) statusTextEl.innerHTML = '';
            return;
        }
        const statusBar = productInventoryBar.querySelector('[product-inventroy-status-bar]');
        if (!statusBar) return;

        // Start from existing data-quantity if present
        let quantity = parseInt(statusBar.dataset.quantity ?? '0', 10);
        // Use variant values when provided
        // const variantQty = typeof variant?.inventory_quantity === 'number' ? variant.inventory_quantity : null;
        // const variantPolicy = variant?.inventory_policy;
           const variantQty = this.querySelector('variant-selects').dataset.inventoryquantity;
           const variantPolicy = this.querySelector('variant-selects').dataset.inventorypolicy;

        if (variantQty != null && variantPolicy) {
            quantity = variantQty;
            if (quantity > 0 && quantity <= minInventroyQuantity && variantPolicy === 'deny') {
                // Low inventory path
                productInventoryBar.classList.remove('hidden');
                productInventoryBar.classList.remove('full-inventory');
                productInventoryBar.classList.add('low-inventory');

                const quantityHtml = `<strong> ${variantQty} </strong>`;
                const newStatus = String(inventroyLowStatus).replace('||inventory||', quantityHtml);
                const statusTextEl = productInventoryBar.querySelector('[inventory-status]');
                if (statusTextEl) statusTextEl.innerHTML = newStatus;

                statusBar.classList.remove('hide-bar');
                const letBarWidth = (parseInt(variantQty, 10) * 100) / minInventroyQuantity;

                
                statusBar.setAttribute('style', `--inventroy-status-bar-width:${letBarWidth}%`);
            } else if (quantity <= 0) {
                if(variant.inventory_management == 'shopify'){
                // Zero or negative: hide entire bar
                 productInventoryBar.classList.add('hidden');
                }else{
                     productInventoryBar.classList.remove('hidden');
                    productInventoryBar.classList.remove('low-inventory');
                    productInventoryBar.classList.add('full-inventory');
                    const statusTextEl = productInventoryBar.querySelector('[inventory-status]');
                    if (statusTextEl) statusTextEl.innerHTML = inventroyAvailableStatus;
                    statusBar.classList.add('hide-bar');
                    statusBar.setAttribute('style', '--inventroy-status-bar-width:100%');
                }
            } else if(!variant){
                productInventoryBar.classList.add('hidden');
                const statusTextEl = productInventoryBar.querySelector('[inventory-status]');
                if (statusTextEl) statusTextEl.innerHTML = '';
            }else {
                // Full inventory path
                productInventoryBar.classList.remove('hidden');
                productInventoryBar.classList.remove('low-inventory');
                productInventoryBar.classList.add('full-inventory');

                const statusTextEl = productInventoryBar.querySelector('[inventory-status]');
                if (statusTextEl) statusTextEl.innerHTML = inventroyAvailableStatus;

                statusBar.classList.add('hide-bar');
                statusBar.setAttribute('style', '--inventroy-status-bar-width:100%');
            }
            statusBar.setAttribute('data-quantity', String(variantQty));
        } else if (quantity && quantity >= 0 && quantity <= window.minInventroyQuantity) {
            // Adjust width based on existing quantity when variant info is not provided
            let letBarWidth = (parseInt(String(quantity), 10) * 100) / minInventroyQuantity;
            statusBar.setAttribute('style', `--inventroy-status-bar-width:${letBarWidth}%`);
        }
    }

    // Quick-add popup media handling (legacy-specific path)
    updateQuickAddMedia(variant) {
        const productPageSection = this.closest('[data-product-page-section]') || this;
        if (!productPageSection?.classList?.contains('quick-add-popup-content-wrapper')) return;
        const variantImage = variant?.featured_image?.id;
        if (!variantImage) return;

        const current = productPageSection.querySelector('.product-img.active');
        const next = productPageSection.querySelector(`.product-img-${variantImage}`);
        if (current && next) {
            current.classList.add('hidden');
            current.classList.remove('active');
            next.classList.remove('hidden');
            next.classList.add('active');
        }
    }
}

if (!customElements.get('product-info')) {
    customElements.define('product-info', ProductInfo);
}

class VariantSelects extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        this.addEventListener('change', (event) => {
            const inputElement = this.getInputForEventTarget(event.target);
            this.updateSelectionMetadata(event.target);

            publish(PUB_SUB_EVENTS.optionValueSelectionChange, {
                data: {
                    event,
                    target: inputElement,
                    selectedOptionValues: this.selectedOptionValues, // IDs
                    selectedOptionLabels: this.selectedOptionLabels, // Option values
                },
            });

            this.dispatchEvent(new CustomEvent('variant-change', {
                bubbles: true,
                detail: {
                    selectedOptionValues: this.selectedOptionValues,
                    selectedOptionLabels: this.selectedOptionLabels
                }
            }));
        });
    }
    updateSelectionMetadata(target) {
        if (target.tagName === 'SELECT' && target.selectedOptions.length) {
            const previouslySelected = Array.from(target.options).find(option =>
                option.hasAttribute('selected')
            );
            if (previouslySelected) {
                previouslySelected.removeAttribute('selected');
            }
            target.selectedOptions[0].setAttribute('selected', '');
        }
    }
    getInputForEventTarget(target) {
        return target.tagName === 'SELECT' ? target.selectedOptions[0] : target;
    }
    get selectedOptionValues() {
        // Returns variant IDs (unchanged)
        return Array.from(this.querySelectorAll('select option[selected], fieldset input:checked'))
            .map((element) => element.getAttribute('data-value-product-id'));
    }
    get selectedOptionLabels() {
        // Returns option values for variant matching
        return Array.from(this.querySelectorAll('select option[selected], fieldset input:checked'))
            .map((element) => element.value);
    }
}
customElements.define('variant-selects', VariantSelects);

function acceptNewsletterConditions(event) {
    const element = event.target;
    const button = element.closest('form').querySelector('button[type="submit"]');
    const isEnabled = element.checked;
    button?.classList.toggle("disabled", !isEnabled);
    button.toggleAttribute("disabled", !isEnabled);
    button?.toggleAttribute("disabled", !isEnabled);
}

function acceptTermsConditions(event) {
    const element = event.target;
    const parent = element.closest(".yv_product_content_section");
    if (!parent) return;
    const buttonWrapper = parent.querySelector("[data-button-wrapper]");
    const addProductBtn = parent.querySelector(".Sd_addProduct");
    if (!addProductBtn) return;
    const section = parent.closest(".shopify-section");
    const addProductStickyBtn = section?.querySelector(".Sd_addProductSticky");
    const isEnabled = element.checked;
    buttonWrapper?.classList.toggle("disabled", !isEnabled);
    addProductBtn.toggleAttribute("disabled", !isEnabled);
    addProductStickyBtn?.toggleAttribute("disabled", !isEnabled);
}

function variantChange(options, type, selector) {
    var variantData = JSON.parse(
        selector.querySelector(
            '[type="application/json"][data-name="variant-json"]'
        ).textContent
    );
    let currentVariant = variantData.find((variant) => {
        if (type === "options") {
            return !variant.options
                .map((option, index) => {
                    return options[index] === option;
                })
                .includes(false);
        }
        if (type === "id") {
            return variant.id == options;
        }
    });
    if (!currentVariant && !selector.querySelector('[data-combined-listing-product]')) {
        return getFirstAvailableVariant(options, variantStyle, selector, variantData);
    } else {
        return currentVariant;
    }
}

function priceUpdate(productSection, priceContainer, getVariant, showSaved) {
    var showSavedAmount = "";
    var savedAmountStyle = "";
    var priceHtml = "";
    if (getVariant != undefined) {
        if (priceContainer) {
            showSavedAmount = priceContainer.getAttribute("data-saved");
            savedAmountStyle = priceContainer.getAttribute("data-saved-style");
        }
        var compareAtPrice = parseInt(getVariant.compare_at_price);
        var price = parseInt(getVariant.price);
        var percentage =
            roundToTwo(((compareAtPrice - price) / compareAtPrice) * 100) +
            "% " +
            saleOffText;
        var savedAmount =
            Shopify.formatMoney(compareAtPrice - price, moneyFormat) +
            " " +
            saleOffText;
        priceHtml = `<span class="yv-visually-hidden">${regularPriceText}</span><span class="yv-product-price h2">${Shopify.formatMoney(
            price,
            moneyFormat
        )}</span>`;
        var savedAmountHtml =
            '<span class="yv-visually-hidden">' + savedPriceText + "</span>";
        if (showSaved) {
            if (showSavedAmount == "true") {
                if (savedAmountStyle == "percentage") {
                    savedAmountHtml += `<span class="yv-product-percent-off">${percentage}</span>`;
                } else {
                    savedAmountHtml += `<span class="yv-product-percent-off">${savedAmount}</span>`;
                }
            }
        } else {
            if (getVariant.allocation_type == "") {
                if (savedAmountStyle == "percentage") {
                    savedAmountHtml += `<span class="yv-product-percent-off">${percentage}</span>`;
                } else {
                    savedAmountHtml += `<span class="yv-product-percent-off">${savedAmount}</span>`;
                }
            } else if (getVariant.allocation_type == "percentage") {
                savedAmountHtml += `<span class="yv-product-percent-off">${getVariant.allocation_value}% ${saleOffText}</span>`;
            } else {
                savedAmountHtml += `<span class="yv-product-percent-off">${Shopify.formatMoney(
                    getVariant.allocation_value,
                    moneyFormat
                )} ${saleOffText}</span>`;
            }
        }
        if (compareAtPrice > price) {
            priceHtml = `<span class="yv-visually-hidden">${comparePriceText}</span><span class="yv-product-price h2">${Shopify.formatMoney(
                price,
                moneyFormat
            )}</span>
      <div class="yv-compare-price-box"><span class="yv-visually-hidden">${regularPriceText}</span><span class="yv-product-compare-price"> ${Shopify.formatMoney(
                compareAtPrice,
                moneyFormat
            )}</span>
      ${savedAmountHtml}</div>`;
        }
        if (getVariant.unit_price_measurement) {
            priceHtml +=
                '<span class="yv-visually-hidden">' +
                unitPriceText +
                '</span><p class="yv-product-unit-price">' +
                Shopify.formatMoney(getVariant.unit_price, moneyFormat) +
                " / ";
            priceHtml +=
                getVariant.reference_value == 1 ? "" : getVariant.reference_value;
            priceHtml += getVariant.reference_unit + "</p>";
        }
        if (getVariant.available != true) {
            priceHtml += `<span class="yv-visually-hidden">${soldOutText}</span>`;
        }
    }
    if (priceContainer) {
        if (productSection.classList.contains("quick-add-popup")) {
            priceHtml = priceHtml.replace("h2", "");
        }
        priceContainer.innerHTML = priceHtml;
    }
    if (productSection) {
        let stickyPriceContainer = productSection.querySelector(
            "[data-sticky-price-wrapper]"
        );
        if (stickyPriceContainer) {
            priceHtml = priceHtml.replace("h2", "h4");
            stickyPriceContainer.innerHTML = priceHtml;
        }
    }
}

function sellingPlans(variant, form) {
    let sellingPlanVariable = form.querySelector('[name="selling_plan"]');
    let sellingHtmlContainer = form.querySelector(
        "[data-selling-plan-container]"
    );
    if (sellingHtmlContainer) {
        sellingHtmlContainer.innerHTML = "";
        if (variant && variant.selling_plans) {
            let sellingPlans = variant.selling_plans;
            let variantPlans = [],
                variantGroups = [];
            if (Object.keys(sellingPlans).length > 0) {
                for (plan in sellingPlans) {
                    var planId = parseInt(plan.replace("plan_", ""));
                    var groupId = sellingPlans[plan]["group_id"];
                    variantPlans.push(planId);
                    if (!variantGroups.includes(groupId)) {
                        variantGroups.push(groupId);
                    }
                }
                var sellingPlanHtml = `<div class="selling_group active">
<div class="sellingPlanHeading" for="oneTimePurchase">
<input type="radio" id="oneTimePurchase" name="sellingPlanHeading" checked>
<label for="oneTimePurchase">${oneTimePurchaseText}</label>
</div>
</div>`;
                variantGroups.forEach(function (group, index) {
                    var group = eval("selling_Plan_Group_" + group);
                    var groupPlans = group.selling_plans;
                    sellingPlanHtml += `<div class="selling_group">
<div class="sellingPlanHeading" for="sellingGroup${index}">
<input type="radio" id="sellingGroup${index}" name="sellingPlanHeading" value="">
<label for="sellingGroup${index}">${group.name}</label>
</div>
<div  class="selling_plan">
<select class="selling_plan_attribute">`;
                    for (plan in groupPlans) {
                        var plan = groupPlans[plan];
                        sellingPlanHtml += `<option value="${plan.id}">${plan.name}</option>`;
                    }
                    sellingPlanHtml += `</select></div></div>`;
                });
                sellingPlanHtml += `</div>`;
                sellingPlanVariable.value = "";
                sellingHtmlContainer.innerHTML = sellingPlanHtml;
                sellingPlanChange();
            }
        }
    }
}

function pickUpAvialabiliy(status) {
    setTimeout(function () {
        var pickUp = document.querySelector(".product__pickup-availabilities");
        var previewContainer = document.getElementById(
            "pickup-availability-preview-container"
        );
        if (pickUp) {
            previewContainer.innerHTML = "";
            pickUp.classList.add("hidden");
            previewContainer.classList.add("hidden");
            if (status) {
                var rootUrl = pickUp.dataset.rootUrl;
                var variantId = pickUp.closest("form").querySelector("[name=id]").value;
                if (!rootUrl.endsWith("/")) {
                    rootUrl = rootUrl + "/";
                }
                var variantSectionUrl = `${rootUrl}variants/${variantId}/?section_id=pickup-availability`;
                fetch(variantSectionUrl)
                    .then((response) => response.text())
                    .then((text) => {
                        var sectionInnerHTML = new DOMParser()
                            .parseFromString(text, "text/html")
                            .querySelector(".shopify-section");
                        var container = sectionInnerHTML.querySelector(
                            "#pickUpAvailabilityPreview"
                        );
                        if (container) {
                            previewContainer.innerHTML = sectionInnerHTML.innerHTML;
                            previewContainer.classList.remove("hidden");
                            pickUp.classList.remove("hidden");
                            showPickupDrawer();
                        }
                    })
                    .catch((e) => { });
            }
        }
    }, 500);
}

function sellingPlanChange() {
    var groupSelectors = document.querySelectorAll('[name="sellingPlanHeading"]');
    Array.from(groupSelectors).forEach(function (group) {
        group.addEventListener("click", () => {
            var value = "";
            var productForm = group.closest("form");
            var sellingPlanVariable = productForm.querySelector(
                '[name="selling_plan"]'
            );
            var selectors = productForm.querySelectorAll(".selling_group");
            var _thisParent = group.closest(".selling_group");
            if (_thisParent.classList.contains("active")) {
                return;
            } else {
                Array.from(selectors).forEach(function (selector) {
                    if (selector != _thisParent) {
                        selector.classList.remove("active");
                        if (selector.querySelector(".selling_plan")) {
                            DOMAnimations.slideUp(selector.querySelector(".selling_plan"));
                        }
                    }
                });
                var variantId = productForm
                    .querySelector('[name="id"]')
                    .getAttribute("value");
                var variantSelected = variantChange(variantId, "id", productForm);
                var _productParent = productForm.closest(".yv_product_content_section");
                var _productSection = productForm.closest(".shopify-section");
                var priceContainer = _productParent.querySelector(
                    "[data-price-wrapper]"
                );
                if (_thisParent.querySelector(".selling_plan_attribute")) {
                    value = _thisParent.querySelector(".selling_plan_attribute").value;
                    priceUpdate(
                        _productSection,
                        priceContainer,
                        variantSelected["selling_plans"]["plan_" + value],
                        false
                    );
                } else {
                    priceUpdate(_productSection, priceContainer, variantSelected, true);
                }
                sellingPlanVariable.value = value;
                _thisParent.classList.add("active");
                if (_thisParent.querySelector(".selling_plan")) {
                    DOMAnimations.slideDown(_thisParent.querySelector(".selling_plan"));
                }
            }
        });
    });
    var planSelectors = document.querySelectorAll(
        "select.selling_plan_attribute"
    );
    Array.from(planSelectors).forEach(function (plan) {
        plan.addEventListener("change", () => {
            var value = "";
            var productForm = plan.closest("form");
            var sellingPlanVariable = productForm.querySelector(
                '[name="selling_plan"]'
            );
            sellingPlanVariable.value = plan.value;
            var variantId = productForm
                .querySelector('[name="id"]')
                .getAttribute("value");
            var variantSelected = variantChange(variantId, "id", productForm);
            var _productParent = productForm.closest(".yv_product_content_section");
            var priceContainer = _productParent.querySelector("[data-price-wrapper]");
            var _productSection = productForm.closest(".shopify-section");
            priceUpdate(
                _productSection,
                priceContainer,
                variantSelected["selling_plans"]["plan_" + plan.value],
                false
            );
        });
    });
}

showMultipleOptions = function () {
    return false;
    var showOptions = document.getElementsByClassName("showOptions");
    if (showOptions) {
        Array.from(showOptions).forEach(function (option) {
            option.addEventListener("click", () => {
                hideOptions();
                var product = option.getAttribute("data-product");
                var wrapper = option.closest(".card--product ");
                wrapper.querySelector("#" + product).style.display = "block";
            });
        });
    }

    var closeOptions = document.getElementsByClassName("close-product-wrap");
    if (closeOptions) {
        Array.from(closeOptions).forEach(function (option) {
            option.addEventListener("click", () => {
                var product = option.getAttribute("data-product");
                var wrapper = option.closest(".card--product ");
                wrapper.querySelector("#" + product).style.display = "none";
            });
        });
    }

    function hideOptions() {
        var options = document.getElementsByClassName("product-wrap");
        Array.from(options).forEach(function (option) {
            option.style.display = "none";
        });
    }
};

function showPickupDrawer() {
    const showContainerButton = document.getElementById(
        "ShowPickupAvailabilityDrawer"
    );
    const previewContainer = document.getElementById(
        "pickup-availability-preview-container"
    );
    if (showContainerButton) {
        showContainerButton.addEventListener("click", (e) => {
            e.preventDefault();
            const drawer = document.querySelector("[data-side-drawer]");
            drawer.setAttribute("class", "yv_side_drawer_wrapper");
            var drawerHtml = previewContainer.querySelector(
                "#pickUpAvailabilityMain"
            ).innerHTML;
            drawer.classList.add("pickup-availability-drawer");
            drawer.querySelector("[data-drawer-title]").innerHTML =
                pickUpAvialabiliyHeading;
            drawer.querySelector("[data-drawer-body]").innerHTML = drawerHtml;
            focusElement = showContainerButton;
            drawer.focus();
            document.querySelector("body").classList.add("side_Drawer_open");
        });
    }
}

// Function to update categories asNavFor slider viewport height as CSS variable on parent
function updateCategoriesViewportHeight(selector) {
    if (!selector || !selector.length) return;
    
    // Find the asNavFor slider (content wrapper) - it has class .yv-catgeories-content-wrapper
    var contentWrapper = selector.closest(".yv-catgeories-main-wrapper").find(".yv-catgeories-content-wrapper");
    if (!contentWrapper.length) return;
    
    var viewport = contentWrapper.find(".flickity-viewport");
    if (!viewport.length) return;
    
    // Get the height from flickity-viewport's inline style
    var viewportHeight = viewport[0].style.height;
    
    // If no inline height, try to get computed height
    if (!viewportHeight) {
        viewportHeight = viewport.height() + "px";
    }
    
    // Find the parent wrapper (.yv-catgeories-main-wrapper)
    var parentWrapper = selector.closest(".yv-catgeories-main-wrapper");
    if (parentWrapper.length && viewportHeight) {
        // Set CSS variable on parent with different name
        parentWrapper[0].style.setProperty("--categories-content-height", viewportHeight);
    }
}

// Function to update categories slider classes (is-previous, is-next, is-previous-sibling, is-next-sibling)
function updateCategoriesSliderClasses(selector) {
    if (!selector || !selector.length) return;
    
    var flkty = selector.data("flickity");
    if (!flkty) return;
    
    var cards = selector.find(".yv-categories-card");
    var selectedIndex = flkty.selectedIndex;
    var totalCards = cards.length;
    
    // Remove all previous/next classes
    cards.removeClass("is-previous is-next is-previous-sibling is-next-sibling");
    
    if (totalCards > 0) {
        // Calculate previous and next indices (with wrapAround)
        var prevIndex = selectedIndex === 0 ? totalCards - 1 : selectedIndex - 1;
        var nextIndex = selectedIndex === totalCards - 1 ? 0 : selectedIndex + 1;
        
        // Add is-previous class to previous card
        var prevCard = cards.eq(prevIndex);
        if (prevCard.length) {
            prevCard.addClass("is-previous");
        }
        
        // Add is-next class to next card
        var nextCard = cards.eq(nextIndex);
        if (nextCard.length) {
            nextCard.addClass("is-next");
        }
        
        // Add is-previous-sibling to card before previous (if exists)
        if (totalCards > 2) {
            var prevSiblingIndex = prevIndex === 0 ? totalCards - 1 : prevIndex - 1;
            // Make sure it's not the selected card
            if (prevSiblingIndex !== selectedIndex) {
                var prevSiblingCard = cards.eq(prevSiblingIndex);
                if (prevSiblingCard.length) {
                    prevSiblingCard.addClass("is-previous-sibling");
                }
            }
        }
        
        // Add is-next-sibling to card after next (if exists)
        if (totalCards > 2) {
            var nextSiblingIndex = nextIndex === totalCards - 1 ? 0 : nextIndex + 1;
            // Make sure it's not the selected card
            if (nextSiblingIndex !== selectedIndex) {
                var nextSiblingCard = cards.eq(nextSiblingIndex);
                if (nextSiblingCard.length) {
                    nextSiblingCard.addClass("is-next-sibling");
                }
            }
        }
        /*
        setTimeout(() => {
            selector.flickity("resize");
            console.log('resize performed');
        }, 50);
        */
    }
}

flickitySlider = function (selector, slideIndex) {
    if (selector.attr("data-manual") == "true") {
        return false;
    }
    var optionContainer = selector.attr("data-flickity-slider");
    if (optionContainer) {
        var options = JSON.parse(optionContainer);
        if (selector.hasClass("flickity-enabled")) {
            setTimeout(() => {
                selector.flickity("resize");
            }, 50);
            // Update categories classes if already initialized
            var sectionContainer = selector.closest('[data-section-type="categories"]');
            if (sectionContainer.length > 0) {
                setTimeout(function() {
                    updateCategoriesSliderClasses(selector);
                    updateCategoriesViewportHeight(selector);
                }, 50);
            }
        } else {
            // Check if this is a categories slider before initialization
            
            var tabbedCollectionsSection = selector.closest('[data-section-type="tabbed-collections"]');
            var istabbedCollectionsSectionSlider = tabbedCollectionsSection.length > 0;
            var sectionContainer = selector.closest('[data-section-type="categories"]');
            var isCategoriesSlider = sectionContainer.length > 0;

            if (slideIndex) {
                selector
                    .not(".flickity-enabled")
                    .flickity(options)
                    .flickity("select", slideIndex);
                
                // Update categories classes on initialization
                if (isCategoriesSlider) {
                    selector.one("ready.flickity", function() {
                        updateCategoriesSliderClasses(selector);
                    });
                }
            } else {
                setTimeout(() => {
                    selector.not(".flickity-enabled").flickity(options).flickity("resize");
                    
                    // Update categories classes on initialization'
                    if(istabbedCollectionsSectionSlider){
                        selector.one("ready.flickity", function() {
                            if (animationStatus && AOS) {
                                AOS.refresh(); 
                            }
                        }); 
                        
                        selector.on("settle.flickity", function() {
                            if (animationStatus && AOS) {
                                AOS.refresh(); 
                            }
                        });
                        setTimeout(function() {
                            if (animationStatus && AOS) {
                                AOS.refresh(); 
                            } 
                        }, 200);
                    }

                    if (isCategoriesSlider) {
                        selector.one("ready.flickity", function() {
                            updateCategoriesSliderClasses(selector);
                            updateCategoriesViewportHeight(selector);
                        });
                        // Also update after a short delay as fallback
                        setTimeout(function() {
                            updateCategoriesSliderClasses(selector);
                            updateCategoriesViewportHeight(selector);
                        }, 150);
                    }
                }, 50);
            }
        }

        let currentFlickity = selector.data("flickity");
        if (currentFlickity && currentFlickity.element && currentFlickity.element.classList.contains("banner-fullwidth-slides") && currentFlickity.element.classList.contains("autoplay_slides")) {
            // Restart autoplay on user interaction
            currentFlickity.on("pointerUp", function (event, pointer) {
                currentFlickity.player.play();
            });

            selector.find(".flickity-page-dots").on("click", function () {
                setTimeout(() => {
                    currentFlickity.player.play();
                }, 100); // Slight delay ensures autoplay resumes after Flickity handles the click
            });
        }


        selector.on("change.flickity", function (event, index) {
            selector[0].querySelectorAll(".yv-youtube-video").forEach((video) => {
                video.contentWindow.postMessage(
                    '{"event":"command","func":"' + "pauseVideo" + '","args":""}',
                    "*"
                );
            });
            selector[0].querySelectorAll(".yv-vimeo-video").forEach((video) => {
                video.contentWindow.postMessage('{"method":"pause"}', "*");
            });

            selector[0]
                .querySelectorAll("video:not(.videoBackgroundFile)")
                .forEach((video) => video.pause());
            
            // Handle categories slider classes
            var sectionContainer = selector.closest('[data-section-type="categories"]');
            if (sectionContainer.length > 0) {
                updateCategoriesSliderClasses(selector);
                updateCategoriesViewportHeight(selector);
            }
        });
        
        // Handle categories slider classes if it's a categories slider
        var sectionContainer = selector.closest('[data-section-type="categories"]');
        if (sectionContainer.length > 0) {
            // Update classes if slider is already initialized
            if (currentFlickity) {
                updateCategoriesSliderClasses(selector);
                updateCategoriesViewportHeight(selector);
            }
            
            // Also update on select event (manual selection)
            selector.on("select.flickity", function() {
                updateCategoriesSliderClasses(selector);
            });
            
            // Update viewport height on resize
            selector.on("resize.flickity", function() {
                setTimeout(() => {
                    updateCategoriesViewportHeight(selector);
                }, 200);
            });
        }
        selector.find(".flickity-slider-thumb-item").on("focus", function () {
            let slideIndex = parseInt($(this).attr("data-index"));
            let productMainSlider = selector
                .closest(".shopify-section")
                .find("[data-flickity-product-slider]");
            let mainSlider = selector
                .closest(".shopify-section")
                .find(".data-main-slider");
            if (productMainSlider.length > 0) {
                productSlider.select(slideIndex);
            } else {
                mainSlider.flickity("select", slideIndex);
            }
        });
    }
};

sliders = function () {
    var sliders = jQuery("body").find("[data-flickity-slider]");
    if (sliders.length > 0) {
        sliders.each(function (index) {
            if (jQuery(this).is("[data-mobile-only]")) {
                if ($(window).width() < 768) {
                    if (!jQuery(this).hasClass("flickity-enabled")) {
                        flickitySlider(jQuery(this));
                    }
                } else {
                    if (jQuery(this).hasClass("flickity-enabled")) {
                        jQuery(this).flickity("destroy");
                    }
                }
            } else if (jQuery(this).is("[data-desktop-only]")) {
                if ($(window).width() >= 768) {
                    if (!jQuery(this).hasClass("flickity-enabled")) {
                        flickitySlider(jQuery(this));
                    }
                } else {
                    if (jQuery(this).hasClass("flickity-enabled")) {
                        jQuery(this).flickity("destroy");
                    }
                }
            } else {
                if (!jQuery(this).hasClass("flickity-enabled")) {
                    flickitySlider(jQuery(this));
                } else {
                    setTimeout(() => {
                        jQuery(this).flickity("resize");
                    }, 50);
                }
            }
        });
    }
};

function youtTubeScriptLoad() {
    if (
        document.querySelector(`script[src="https://www.youtube.com/iframe_api"]`)
    )
        return;
    var tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);
}

function onYouTubeIframeAPIReady() {
    document.dispatchEvent(new CustomEvent("on:youtube-api:loaded"));
}

function initYouTubeIframe(section = document) {
    let youTubeVideos = section.querySelectorAll(".yvYoutubeAutoPlayvVideo");
    Array.from(youTubeVideos).forEach(function (video) {
        let divId = video.getAttribute("id");
        let vidId = video.dataset.id;
        if (!window["YT"]) {
            document.addEventListener("on:youtube-api:loaded", function () {
                youTubeVideoReady(divId, vidId);
            });
            youtTubeScriptLoad();
        } else {
            youTubeVideoReady(divId, vidId);
        }
    });
}

function youTubeVideoReady(divId, vidId) {
    YT.ready(() => {
        let player = new YT.Player(divId, {
            videoId: vidId,
            playerVars: {
                showinfo: 0,
                controls: 0,
                fs: 0,
                rel: 0,
                height: "100%",
                width: "100%",
                iv_load_policy: 3,
                html5: 1,
                loop: 1,
                autoplay: 1,
                playsinline: 1,
                modestbranding: 1,
                disablekb: 1,
                wmode: "opaque",
            },
            events: {
                onReady: onPlayerReady,
                onStateChange: onPlayerStateChange,
            },
        });
    });
}

function onPlayerReady(event) {
    event.target.mute();
    event.target.playVideo();
}
let done = false;

function onPlayerStateChange(event) {
    if (event.data == 0) {
        event.target.playVideo();
    }
}

function tabAccordionContentOLD() {
    var tabHead = document.getElementsByClassName("yv-tab-product-item");
    if (tabHead.length > 0) {
        tabHead[0].classList.add("active");
        var tabContent = document.getElementsByClassName("yv-product-detail-tab");
        tabContent[0].style.display = "block";

        Array.from(tabHead).forEach(function (btn) {
            btn.addEventListener("click", (event) => {
                event.preventDefault();
                Array.from(tabHead).forEach(function (item) {
                    item.classList.remove("active");
                });
                Array.from(tabContent).forEach(function (item) {
                    item.style.display = "none";
                });
                btn.classList.add("active");
                var _value = btn.getAttribute("content");
                document.getElementById(_value).style.display = "block";
            });
        });
    }
    var accordionHead = document.getElementsByClassName("yv-accordion-header");
    if (accordionHead.length > 0) {
        var accordionContent = document.getElementsByClassName(
            "yv-accordion-content"
        );

        Array.from(accordionHead).forEach(function (btn) {
            const btnParent = btn.closest("[data-faq-accordions]");
            const Tabsbehavior = btnParent.dataset.tabsOpenMethod;
            if (Tabsbehavior === "click") {
                btn.addEventListener("click", (event) => {
                    event.preventDefault();
                    let _section = btn.closest(".shopify-section");
                    if (btn.classList.contains("active")) {
                        btn.parentNode.removeAttribute("open");
                        clearAccordion();
                    } else {
                        btn.classList.add("active");
                        btn.parentNode.setAttribute("open", "");
                        var _value = btn.getAttribute("content");
                        clearAccordion(btn, document.getElementById(_value));
                        DOMAnimations.slideDown(document.getElementById(_value));
                        var _media = btn.getAttribute("media");
                        if (
                            _section &&
                            document.getElementById(_media) &&
                            !document.getElementById(_media).classList.contains("active")
                        ) {
                            if (_section.querySelector(".tabbed-collage-image.active")) {
                                _section
                                    .querySelector(".tabbed-collage-image.active")
                                    .fadeOut(100);
                                _section
                                    .querySelector(".tabbed-collage-image.active")
                                    .classList.remove("active");
                                setTimeout(function () {
                                    document.getElementById(_media).fadeIn(100);
                                    document.getElementById(_media).classList.add("active");
                                }, 100);
                            }
                        }
                    }
                });
            }
            else {
                let accordionContainer = btn.closest(".yv-product-accordion");
                btn.addEventListener("mouseenter", () => {
                    if (!btn.classList.contains("active")) {
                        let _section = btn.closest(".shopify-section");

                        btn.classList.add("active");
                        btn.parentNode.setAttribute("open", "");

                        var _value = btn.getAttribute("content");
                        if (_value) {
                            clearAccordion(btn, document.getElementById(_value));
                            DOMAnimations.slideDown(document.getElementById(_value));
                        }
                        var _media = btn.getAttribute("media");
                        if (_section && _media) {
                            const mediaElement = document.getElementById(_media);
                            if (mediaElement) {
                                const activeMedia = _section.querySelectorAll(".tabbed-collage-image.active");
                                if (activeMedia) {
                                    activeMedia.forEach((el) => {
                                        el.classList.remove("active");
                                        el.style.display = "none";
                                    });
                                }
                                mediaElement.classList.add("active");
                                mediaElement.style.display = "block";
                            }
                        }
                    }
                });

                // **Ensure the menu closes when mouse leaves the entire accordion**
                accordionContainer.addEventListener("mouseleave", () => {
                    document.querySelectorAll(".yv-accordion-header").forEach((el) => {
                        el.classList.remove("active");
                        el.parentNode.removeAttribute("open");

                        var _value = el.getAttribute("content");
                        DOMAnimations.slideUp(document.getElementById(_value), 100);
                    });
                });
            }
        });
    }
}

function tabAccordionContent() {
    // Tab functionality (unchanged)
    var tabHead = document.getElementsByClassName("yv-tab-product-item");
    if (tabHead.length > 0) {
        tabHead[0].classList.add("active");
        var tabContent = document.getElementsByClassName("yv-product-detail-tab");
        tabContent[0].style.display = "block";

        Array.from(tabHead).forEach(function (btn) {
            btn.addEventListener("click", (event) => {
                event.preventDefault();
                Array.from(tabHead).forEach(function (item) {
                    item.classList.remove("active");
                });
                Array.from(tabContent).forEach(function (item) {
                    item.style.display = "none";
                });
                btn.classList.add("active");
                var _value = btn.getAttribute("content");
                document.getElementById(_value).style.display = "block";
            });
        });
    }

    // Accordion functionality with hover optimization
    var accordionHead = document.getElementsByClassName("yv-accordion-header");
    if (accordionHead.length > 0) {
        // Timeout management for smooth hover transitions
        const containerTimeouts = new WeakMap();

        Array.from(accordionHead).forEach(function (btn) {
            const btnParent = btn.closest("[data-faq-accordions]");
            const tabsBehavior = btnParent.dataset.tabsOpenMethod;

            if (tabsBehavior === "click") {
                // Click behavior (unchanged)
                btn.addEventListener("click", (event) => {
                    event.preventDefault();
                    let _section = btn.closest(".shopify-section");
                    if (btn.classList.contains("active")) {
                        btn.parentNode.removeAttribute("open");
                        clearAccordion();
                    } else {
                        btn.classList.add("active");
                        btn.parentNode.setAttribute("open", "");
                        var _value = btn.getAttribute("content");
                        clearAccordion(btn, document.getElementById(_value));
                        DOMAnimations.slideDown(document.getElementById(_value));
                        var _media = btn.getAttribute("media");
                        if (
                            _section &&
                            document.getElementById(_media) &&
                            !document.getElementById(_media).classList.contains("active")
                        ) {
                            if (_section.querySelector(".tabbed-collage-image.active")) {
                                _section
                                    .querySelector(".tabbed-collage-image.active")
                                    .fadeOut(100);
                                _section
                                    .querySelector(".tabbed-collage-image.active")
                                    .classList.remove("active");
                                setTimeout(function () {
                                    document.getElementById(_media).fadeIn(100);
                                    document.getElementById(_media).classList.add("active");
                                }, 100);
                            }
                        }
                    }
                });
            }
            else {
                // Hover behavior with optimization
                let accordionContainer = btn.closest(".yv-product-accordion");

                // Initialize timeout tracker for container
                if (!containerTimeouts.has(accordionContainer)) {
                    containerTimeouts.set(accordionContainer, null);
                }

                btn.addEventListener("mouseenter", () => {
                    // Clear pending close timeout
                    clearTimeout(containerTimeouts.get(accordionContainer));

                    // Only activate if not already active
                    if (!btn.classList.contains("active")) {
                        // Close other open accordions in container
                        Array.from(accordionContainer.querySelectorAll(".yv-accordion-header.active")).forEach(activeBtn => {
                            if (activeBtn !== btn) {
                                activeBtn.classList.remove("active");
                                activeBtn.parentNode.removeAttribute("open");
                                const contentId = activeBtn.getAttribute("content");
                                if (contentId) {
                                    DOMAnimations.slideUp(document.getElementById(contentId), 100);
                                }
                            }
                        });

                        // Activate current accordion
                        btn.classList.add("active");
                        btn.parentNode.setAttribute("open", "");

                        // Show content
                        const contentId = btn.getAttribute("content");
                        if (contentId) {
                            const contentEl = document.getElementById(contentId);
                            if (contentEl) DOMAnimations.slideDown(contentEl);
                        }

                        // Handle media switching
                        const _section = btn.closest(".shopify-section");
                        const mediaId = btn.getAttribute("media");
                        if (_section && mediaId) {
                            const mediaEl = document.getElementById(mediaId);
                            if (mediaEl) {
                                // Hide current active media
                                const activeMedia = _section.querySelector(".tabbed-collage-image.active");
                                if (activeMedia) {
                                    activeMedia.classList.remove("active");
                                    activeMedia.style.display = "none";
                                }
                                // Show new media
                                mediaEl.classList.add("active");
                                mediaEl.style.display = "block";
                            }
                        }
                    }
                });

                // Add single mouseleave listener to container
                if (!accordionContainer.hasMouseLeaveListener) {
                    accordionContainer.hasMouseLeaveListener = true;
                    accordionContainer.addEventListener("mouseleave", () => {
                        // Set timeout to close accordions after delay
                        const timeoutId = setTimeout(() => {
                            Array.from(accordionContainer.querySelectorAll(".yv-accordion-header.active")).forEach(activeBtn => {
                                activeBtn.classList.remove("active");
                                activeBtn.parentNode.removeAttribute("open");
                                const contentId = activeBtn.getAttribute("content");
                                if (contentId) {
                                    DOMAnimations.slideUp(document.getElementById(contentId), 100);
                                }
                            });
                        }, 300); // 300ms delay before closing

                        // Store timeout reference
                        containerTimeouts.set(accordionContainer, timeoutId);
                    });
                }
            }
        });
    }
}

function clearAccordion(currentHead, currentContent) {
    var accordionHeads = document.getElementsByClassName("yv-accordion-header");
    var accordionContents = document.getElementsByClassName(
        "yv-accordion-content"
    );
    Array.from(accordionHeads).forEach(function (item) {
        if (item == currentHead) {
            return;
        } else {
            item.classList.remove("active");
        }
    });
    Array.from(accordionContents).forEach(function (item) {
        if (item == currentContent) {
            return;
        } else {
            DOMAnimations.slideUp(item);
        }
    });
}

document.querySelectorAll('[data-banner-close]').forEach((btn) => {
    btn.addEventListener('click', () => {
        const banner = document.querySelector('[data-notification-bar]');
        if (banner) {
            banner.remove(); // Removes the element from the DOM
        }
    });
});


var mapSelectors = "[data-map-container]";
var apiloaded = null;

function initMaps() {
    jQuery(mapSelectors).each(function (index, selector) {
        createMap(selector);
    });
}

function checkMapApi(selector) {
    if (selector || jQuery(mapSelectors).length > 0) {
        if (apiloaded === "loaded") {
            if (selector) {
                createMap(selector);
            } else {
                initMaps();
            }
        } else {
            if (apiloaded !== "loading") {
                apiloaded = "loading";
                if (
                    typeof window.google === "undefined" ||
                    typeof window.google.maps === "undefined"
                ) {
                    var script = document.createElement("script");
                    script.onload = function () {
                        apiloaded = "loaded";
                        if (selector) {
                            createMap(selector);
                        } else {
                            initMaps();
                        }
                    };
                    script.src =
                        "https://maps.googleapis.com/maps/api/js?key=" + googleMapApiKey + "&libraries=marker";
                    document.head.appendChild(script);
                }
            }
        }
    }
}

function createMap(selector) {
    var geocoder = new google.maps.Geocoder();
    var address = jQuery(selector).data("location");
    var mapStyle = jQuery(selector).data("map-style");
    var redIconUrl = 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
    geocoder.geocode({ address: address }, function (results, status) {
        if (results != null) {
            var options = {
                zoom: 17,
                backgroundColor: "none",
                center: results[0].geometry.location,
                mapId: mapStyle,
            };
            var map = (this.map = new google.maps.Map(selector, options));
            var center = (this.center = map.getCenter());
            var marker = new google.maps.marker.AdvancedMarkerElement({
                map: map,
                position: map.getCenter(),
            });

            window.addEventListener("resize", function () {
                setTimeout(function () {
                    google.maps.event.trigger(map, "resize");
                    map.setCenter(center);
                }, 250);
            });
        }
    });
}

var dealSection = function (selector) {
    const second = 1000,
        minute = second * 60,
        hour = minute * 60,
        day = hour * 24;
    var clearCountDown;
    countdown = function (selector) {
        var parent = document.querySelector(selector);
        if (parent) {
            clearInterval(clearCountDown);
            var dateSelector = parent.querySelector(".dealDate");
            if (dateSelector) {
                const myArr = dateSelector.value.split("/");
                let _day = myArr[0];
                let _month = myArr[1];
                let _year = myArr[2];
                let _date = _month + "/" + _day + "/" + _year + " 00:00:00";
                let countDown = new Date(_date).getTime();
                var daySelector = parent.querySelector("#dDays");
                var hourSelector = parent.querySelector("#dHours");
                var minSelector = parent.querySelector("#dMinutes");
                var secSelector = parent.querySelector("#dSeconds");
                if (daySelector && hourSelector && minSelector && secSelector) {
                    clearCountDown = setInterval(function () {
                        let now = new Date().getTime(),
                            distance = countDown - now;
                        var leftDays = Math.floor(distance / day);
                        if (distance > 0) {
                            (daySelector.innerText = pad2(leftDays)),
                                (hourSelector.innerText = pad2(
                                    Math.floor((distance % day) / hour)
                                )),
                                (minSelector.innerText = pad2(
                                    Math.floor((distance % hour) / minute)
                                )),
                                (secSelector.innerText = pad2(
                                    Math.floor((distance % minute) / second)
                                ));
                        } else {
                            let hideStatus = parent.getAttribute("data-hide-section");
                            if (hideStatus == "true") {
                                parent.style.display = "none";
                            }
                            (daySelector.innerText = "00"),
                                (hourSelector.innerText = "00"),
                                (minSelector.innerText = "00"),
                                (secSelector.innerText = "00");
                            clearInterval(clearCountDown);
                        }
                    }, 0);
                }
            }
        }
    };
    countdown("#" + selector);
};

function clearActive(currentHead, currentContent) {
    var tabs = document.getElementsByClassName("faqSection-header");
    var tabsContent = document.getElementsByClassName("faqSection-content");
    Array.from(tabs).forEach(function (item) {
        var iconPlus = item.querySelector(".iconPlus");
        var iconMinus = item.querySelector(".iconMinus");
        if (item == currentHead) {
            return;
        } else {
            iconMinus.style.display = "none";
            iconPlus.style.display = "inline";
            item.classList.remove("active");
        }
    });
    Array.from(tabsContent).forEach(function (item) {
        if (item == currentContent) {
            return;
        } else {
            DOMAnimations.slideUp(item);
        }
    });
}

function sliderFilter() {
    $("body").on("click", ".filter-products", function (e) {
        e.preventDefault();
        if (!$(this).hasClass("active")) {
            $(this).siblings().removeClass("active");
            $(this).addClass("active");
            $(this)
                .closest(".shopify-section")
                .find(".yv-tab-btn-pane")
                .attr("data-tab-active", $(this).attr("data-tab-button"));
            let selectedCollection = $(this).data("filter");
            let selector = $(this)
                .closest(".shopify-section")
                .find(".yv-tabbed-collection-filter-items");
            if (selector.hasClass("flickity-enabled")) {
                selector.flickity("destroy");
            }
            selector.find(".filter-slide").removeClass("active").hide();
            selector.find(".filter-slide .aos-init").removeClass("aos-animate");
            selector
                .find(".filter-slide." + selectedCollection)
                .addClass("active")
                .show();
            flickitySlider(selector);
            // }
            selector
                .find(".filter-slide." + selectedCollection + " .aos-init")
                .addClass("aos-animate");
            setTimeout(function () { }, 200);
        }
    });
}

function removeClasses() {
    $("body")
        .removeClass("similar_Drawer_open")
        .removeClass("side_Drawer_open")
        .removeClass("catalog-open")
        .removeClass("yv_side_Drawer_open")
        .removeClass("active_askme")
        .removeClass("scrollHidden")
        .removeClass("quickview-open")
        .removeClass("nav-open")
        .removeClass("addsearch")
        .removeClass("minicart-open")
        .removeClass("customer-open")
        .removeClass("NewsletterActive")
        .removeClass("show__similar__products")
        .removeClass("offer-open")
        .removeClass("mega-menu-open")
        .removeClass("open-filter-sort")
        .removeClass("sizeChartOpen");
    $(".yv-upsell-drawer").removeClass("active");
    // let sizeChartModel = document.getElementById("sizeChartModel");
    // if (sizeChartModel) {
    //     sizeChartModel.fadeOut(100);
    // }
    $(".yv-coupan-sidebar").removeClass("open");
    $(".wrapper-overlay").hide();
    if (!$("input.form-control.search-input").hasClass("yv-search-bar")) {
        $("input.form-control.search-input").val("");
    }
    $(".yv-search-result-container").empty();
    setTimeout(function () {
        $(".yv-newsletter-popup").fadeOut("slow");
    }, 200);
    if ($(window).width() > 767) {
        $(".askmeMain").hide().removeClass("slideAskme");
    } else {
        $(".askmeMain.slideAskme").removeClass("slideAskme");
        setTimeout(function () {
            $(".askmeMain").hide();
        }, 250);
    }
    $(".dropdown-menu-list").removeClass("open");
    $(".toggle-level,.list-menu__item.toggle").removeClass("open-menu-drop");
    $(".side-menu").find(".inner").removeClass("is-open");
    $(".side-menu").find(".inner").slideUp("slow");
    if ($(window).width() < 768) {
        $("#sort__list").removeClass("active");
    } else {
        $("#sort__list").slideUp();
    }
    $("body").removeClass("side_Drawer_open");
    stopFocusElementsRotation();
    if (focusElement) {
        if (focusElement.nodeType || focusElement == window) {
            focusElement.focus();
        } else {
            focusElement.trigger("focus");
        }
        focusElement = "";
    }
}

function closeVideoMedia(quickView) {
    document.querySelectorAll(".yv-youtube-video").forEach((video) => {
        if (!isOnScreen(video) || quickView) {
            video.contentWindow.postMessage(
                '{"event":"command","func":"' + "pauseVideo" + '","args":""}',
                "*"
            );
        }
    });
    document.querySelectorAll(".yv-vimeo-video").forEach((video) => {
        if (!isOnScreen(video) || quickView) {
            video.contentWindow.postMessage('{"method":"pause"}', "*");
        }
    });
    document.querySelectorAll("video").forEach((video) => {
        if (!video.classList.contains("videoBackgroundFile")) {
            if (!isOnScreen(video) || quickView) {
                video.pause();
            }
        }
    });
}

function navigationMenu() {
    var dropDownMenus = document.getElementsByClassName("yv-dropdown-detail");
    var header = document.querySelector("header");
    if (header) {
        let navigation_event = header.getAttribute("data-naviation-open-method");
        if (navigation_event == "hover") {
            // Array.from(dropDownMenus).forEach(function (menu) {
            //     menu.parentElement.querySelector(".yv-dropdown-menus");
            //     menu.addEventListener("mouseover", () => {
            //         menu.classList.add("open");
            //         menu.setAttribute("open", "");
            //         document.querySelector("body").classList.add("mega-menu-open");
            //     }),
            //         menu.addEventListener("mouseleave", () => {
            //             menu.classList.remove("open");
            //             menu.removeAttribute("open");
            //             document.querySelector("body").classList.remove("mega-menu-open");
            //         });
            // });
            Array.from(dropDownMenus).forEach(menu => {
                let timer;

                menu.addEventListener("mouseover", () => {
                    clearTimeout(timer);
                    timer = setTimeout(() => {
                        menu.classList.add("open");
                        menu.setAttribute("open", "");
                        document.body.classList.add("mega-menu-open");
                    }, 100); // small delay prevents flicker
                });

                menu.addEventListener("mouseleave", () => {
                    clearTimeout(timer);
                    timer = setTimeout(() => {
                        menu.classList.remove("open");
                        menu.removeAttribute("open");
                        document.body.classList.remove("mega-menu-open");
                    }, 100);
                });
            });
        } else {
            if (dropDownMenus.length > 0) {
                Array.from(dropDownMenus).forEach(function (menu) {
                    menu.addEventListener("click", (event) => {
                        let superParent = menu.closest("li");
                        if (menu.open) {
                            hideAllMenu(menu);
                            document.querySelector("body").classList.remove("mega-menu-open");
                        } else {
                            hideAllMenu(menu);
                            menu.classList.add("open");
                            document.querySelector("body").classList.remove("mega-menu-open");
                            document.querySelector("body").classList.add("mega-menu-open");
                        }
                    });
                });
            }
        }
    }
    document.addEventListener("mouseenter", showHideMenus, true);
}

function showHideMenus() {
   const hoverChildmenus = document.querySelectorAll("[data-has-children]");
    hoverChildmenus.forEach(submenu => {
        const menuInner = submenu.querySelector(".menu-type-dropdown-inner");
        if (!menuInner) return;
        // --- Temporarily show submenu for measurement ---
        const computed = getComputedStyle(menuInner);
        const wasHidden = computed.display === "none" || computed.visibility === "hidden";
        if (wasHidden) {
            menuInner.style.visibility = "hidden";
            menuInner.style.display = "block";
        }
        // Measure dimensions
        const submenuWidth = menuInner.offsetWidth;
        const parentRect = submenu.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        // Restore original hidden state
        if (wasHidden) {
            menuInner.style.display = "";
            menuInner.style.visibility = "";
        }
        // Check if it overflows right
        const willOverflowRight = parentRect.right + submenuWidth > windowWidth;
        // Apply final positioning
        if (willOverflowRight) {
            menuInner.style.left = "auto";
            menuInner.style.right = "100%";   // open LEFT
        } else {
            menuInner.style.right = "auto";
            menuInner.style.left = "100%";    // open RIGHT
        }
    });
}

function hideAllMenu(selectMenu) {
    var dropDownMenus = document.getElementsByClassName("yv-dropdown-detail");
    if (dropDownMenus.length > 0) {
        Array.from(dropDownMenus).forEach(function (menu) {
            if (selectMenu != menu) {
                menu.removeAttribute("open");
            }
            menu.classList.remove("open");
        });
    }
}

function hideAllMenu(selectMenu) {
    var dropDownMenus = document.getElementsByClassName("yv-dropdown-detail");
    if (dropDownMenus.length > 0) {
        Array.from(dropDownMenus).forEach(function (menu) {
            if (selectMenu != menu) {
                menu.removeAttribute("open");
            }
            menu.classList.remove("open");
        });
    }
}

function closeDrawers() {
    $(
        ".yv-filter-sidebar,.yv-discount-panel,.product-video-popup-inner,.yv-newsletter-popup-outer,.customer-links,.acc-sign-in,[data-account-dropdown],.customer-support,.yv-login-popup-inner,.yv-newsletter-popup-content,.yv-browse-category,.yv-addon-button-wrapper-card,.sizeChart-label,.sizeChart-main,.offer-open,.yv-product-slider-item,.navbar-toggler,.similar_options,.openCartDrawer,.yv-coupan-sidebar,.dropdown-menu-list,.ask_this_product,.yv_similar_drawer_wrapper,#toolbox-sort,#sort__list,.yv_side_drawer_wrapper,.askmecontainer,.search-bar-container,.search-form,.yv-newsletter-popup-body,.side-menu,#filterSideBar"
    ).hover(
        function () {
            mouse_is_inside = true;
        },
        function () {
            mouse_is_inside = false;
        }
    );

    // var menu_is_inside = false;
    // $(".dropdown-menu-item, .yv-dropdown-menus").hover(
    //     function () {
    //         menu_is_inside = true;
    //     },
    //     function () {
    //         menu_is_inside = false;
    //     }
    // );
    let menu_is_inside = false;

    $(document).on(
    'mouseenter',
    '.dropdown-menu-item, .yv-dropdown-menus',
    function () {
        menu_is_inside = true;
    }
    );

    $(document).on(
    'mouseleave',
    '.dropdown-menu-item, .yv-dropdown-menus',
    function () {
        menu_is_inside = false;
    }
    );

    $("body").on("click", function (event) { 
        if (!mouse_is_inside) {
            setTimeout(() => {
                if (
                    window.location.href.indexOf("#mobileMenu") > -1 ||
                    window.location.href.indexOf("#header") > -1
                ) {
                    let url = window.location.href.replace("#mobileMenu", "");
                    url = url.replace("#header", "");
                    history.replaceState({}, null, url);
                }
            }, 100);
            $(".yv-discount-sidebar-element").hide();
        }
        if (
            $(this).hasClass("offer-open") &&
            !$(".yv-coupan-sidebar-element").hasClass("open")
        ) {
            return false;
        }
        if (!menu_is_inside) {
            $(".yv-dropdown-detail").removeAttr("open");
            $(".yv-dropdown-detail").removeClass("open");
            stopFocusElementsRotation();
        }
    });

    $("body").on("mouseup", function (event) {
        if (event.target.hasAttribute('data-address-country-select') || event.target.parentNode.hasAttribute('data-address-country-select')) {
            return false;
        }
        if (
            $(this).hasClass("offer-open") &&
            !$(".yv-coupan-sidebar-element").hasClass("open")
        ) {
            return false;
        } else {
            $("body").removeClass("offer-open");
            $(".yv-coupan-sidebar-element").removeClass("open");
        }
        if (!mouse_is_inside) {
            if (document.querySelector("[data-account-dropdown]")) {
                DOMAnimations.slideUp(
                    document.querySelector("[data-account-dropdown]")
                );
            }
            let storeDetailsContent = document.querySelectorAll(
                "[data-store-location-dropdown]"
            );
            Array.from(storeDetailsContent).forEach(function (content) {
                DOMAnimations.slideUp(content);
            });
            if (document.querySelector("[data-account-popup]")) {
                $("body").removeClass("account-popup-open");
            }
            $("#view-catalog").hide();

            removeClasses();
            closeVideoMedia("quickView");
        }

        var isHovered = $(".yv-addon-button-wrapper-card").filter(function () {
            return $(this).is(":hover");
        });
        if (!menu_is_inside && !isHovered) {
            $(".yv-addon-button-wrapper").hide();
            $("body").removeClass("query-form-open");
        }
    });

    $("body").on("keydown", function (event) {
        if (event.keyCode == 27) {
            closeVideoMedia("quickView");
            if (document.querySelector(".hamburger.opened")) {
                document.querySelector(".hamburger.opened").click();
            }
            $(".yv-upsell-drawer").removeClass("active");
            $("body").removeClass("offer-open");
            $(".yv-coupan-sidebar-element").removeClass("open");
            $(".super_active").removeClass("super_active");
            $(".yv-dropdown-detail").removeAttr("open");
            $(".yv-dropdown-detail").removeClass("open");
            $("#sizeChartModel").fadeOut(100);
            $("#password-popup").fadeOut();
            $("body").removeClass("sizeChartOpen").removeClass("PasswordFormActive");
            removeClasses();
        }
    });
}

const ease = {
    exponentialIn: (t) => {
        return t == 0.0 ? t : Math.pow(2.0, 10.0 * (t - 1.0));
    },
    exponentialOut: (t) => {
        return t == 1.0 ? t : 1.0 - Math.pow(2.0, -10.0 * t);
    },
    exponentialInOut: (t) => {
        return t == 0.0 || t == 1.0 ?
            t :
            t < 0.5 ?
                +0.5 * Math.pow(2.0, 20.0 * t - 10.0) :
                -0.5 * Math.pow(2.0, 10.0 - t * 20.0) + 1.0;
    },
    sineOut: (t) => {
        const HALF_PI = 1.5707963267948966;
        return Math.sin(t * HALF_PI);
    },
    circularInOut: (t) => {
        return t < 0.5 ?
            0.5 * (1.0 - Math.sqrt(1.0 - 4.0 * t * t)) :
            0.5 * (Math.sqrt((3.0 - 2.0 * t) * (2.0 * t - 1.0)) + 1.0);
    },
    cubicIn: (t) => {
        return t * t * t;
    },
    cubicOut: (t) => {
        const f = t - 1.0;
        return f * f * f + 1.0;
    },
    cubicInOut: (t) => {
        return t < 0.5 ? 4.0 * t * t * t : 0.5 * Math.pow(2.0 * t - 2.0, 3.0) + 1.0;
    },
    quadraticOut: (t) => {
        return -t * (t - 2.0);
    },
    quarticOut: (t) => {
        return Math.pow(t - 1.0, 3.0) * (1.0 - t) + 1.0;
    },
};
//  wave animation code start
class ShapeOverlays {
    constructor(elm) {
        this.elm = elm;
        this.path = elm.querySelectorAll("path");
        this.numPoints = 2;
        this.duration = 600;
        this.delayPointsArray = [];
        this.delayPointsMax = 0;
        this.delayPerPath = 200;
        this.timeStart = Date.now();
        this.isOpened = false;
        this.isAnimating = false;
    }
    toggle() {
        this.isAnimating = true;
        for (var i = 0; i < this.numPoints; i++) {
            this.delayPointsArray[i] = 0;
        }
        if (this.isOpened === false) {
            this.open();
        } else {
            this.close();
        }
    }
    open() {
        this.isOpened = true;
        this.elm.classList.add("is-opened");
        this.timeStart = Date.now();
        this.renderLoop();
    }
    close() {
        this.isOpened = false;
        this.elm.classList.remove("is-opened");
        this.timeStart = Date.now();
        this.renderLoop();
    }

    updatePath(time) {
        const points = [];

        for (var i = 0; i < this.numPoints; i++) {
            const thisEase = this.isOpened ?
                i == 1 ?
                    ease.cubicOut :
                    ease.cubicInOut :
                i == 1 ?
                    ease.cubicInOut :
                    ease.cubicOut;
            points[i] =
                thisEase(
                    Math.min(
                        Math.max(time - this.delayPointsArray[i], 0) / this.duration,
                        1
                    )
                ) * 100;
        }

        let str = "";
        str += this.isOpened ? `M 0 0 V ${points[0]} ` : `M 0 ${points[0]} `;
        for (var i = 0; i < this.numPoints - 1; i++) {
            const p = ((i + 1) / (this.numPoints - 1)) * 100;
            const cp = p - ((1 / (this.numPoints - 1)) * 100) / 2;
            str += `C ${cp} ${points[i]} ${cp} ${points[i + 1]} ${p} ${points[i + 1]
                } `;
        }
        str += this.isOpened ? `V 0 H 0` : `V 100 H 0`;
        return str;
    }

    render() {
        if (this.isOpened) {
            for (var i = 0; i < this.path.length; i++) {
                this.path[i].setAttribute(
                    "d",
                    this.updatePath(Date.now() - (this.timeStart + this.delayPerPath * i))
                );
            }
        } else {
            for (var i = 0; i < this.path.length; i++) {
                this.path[i].setAttribute(
                    "d",
                    this.updatePath(
                        Date.now() -
                        (this.timeStart + this.delayPerPath * (this.path.length - i - 1))
                    )
                );
            }
        }
    }
    renderLoop() {
        this.render();
        if (
            Date.now() - this.timeStart <
            this.duration +
            this.delayPerPath * (this.path.length - 1) +
            this.delayPointsMax
        ) {
            requestAnimationFrame(() => {
                this.renderLoop();
            });
        } else {
            this.isAnimating = false;
        }
    }
}

function hamburgerInit() {
    const elmHamburger = document.querySelector(".hamburger");
    const parentBody = document.querySelector("body");
    const gNavItems = document.querySelectorAll(".hamburger-menu-item");
    const dropdownNavItems = document.querySelectorAll(
        ".dropdown-hamburger-menu-item"
    );
    const elmOverlay = document.querySelector(".shape-overlays");
    if (!elmOverlay) {
        return false;
    }

    if (!elmHamburger) {
        return false;
    }
    const overlay = new ShapeOverlays(elmOverlay);
    elmHamburger.addEventListener("click", (e) => {
        e.preventDefault();
        if (overlay.isAnimating) {
            return false;
        }
        overlay.toggle();
        if (overlay.isOpened === true) {
            elmHamburger.classList.add("opened");
            parentBody.classList.add("hamburder-opened");
            for (var i = 0; i < gNavItems.length; i++) {
                let navItem = gNavItems[i];
                setTimeout(function () {
                    navItem.classList.add("opened");
                }, 50);
            }
            focusElement = elmHamburger;
        } else {
            let superActives = document.querySelectorAll(".super_active");
            for (var i = 0; i < superActives.length; i++) {
                superActives[i].classList.remove("super_active");
            }
            elmHamburger.classList.remove("opened");
            parentBody.classList.remove("hamburder-opened");
            for (var i = 0; i < gNavItems.length; i++) {
                gNavItems[i].classList.remove("opened");
            }
            for (var i = 0; i < dropdownNavItems.length; i++) {
                dropdownNavItems[i].classList.remove("active");
            }
        }
    });

    $("body").on("click", ".dropdown-hamburger-menu-item-title", function (e) {
        e.preventDefault();
        $(this).closest(".dropdown-hamburger-menu-item").addClass("active");
        $(this).parent().parent().parent().addClass("super_active");
    });

    $("body").on("click", ".back-to-menu", function (e) {
        e.preventDefault();
        $(this).closest(".dropdown-hamburger-menu-item").removeClass("active");
        $(this).closest(".super_active").removeClass("super_active");
    });
}

function productRecommendations() {
    const productRecommendationsSections = document.querySelectorAll(
        "[product-recommendations]"
    );
    Array.from(productRecommendationsSections).forEach(function (
        productRecommendationsSection
    ) {
        productRecommendationsInit(productRecommendationsSection);
    });
}

function productRecommendationsInit(productRecommendationsSection) {
    const url = productRecommendationsSection.dataset.url;
    fetch(url)
        .then((response) => response.text())
        .then((text) => {
            const html = document.createElement("div");
            html.innerHTML = text;
            const recommendations = html.querySelector("[product-recommendations]");
            if (recommendations && recommendations.innerHTML.trim().length) {
                productRecommendationsSection.innerHTML = recommendations.innerHTML;
                gridPickUpAvailability(productRecommendationsSection);
                let slider = productRecommendationsSection.querySelector(
                    "[data-flickity-slider]"
                );
                if (slider) {
                    let sliderId = slider.getAttribute("id");
                    if (!slider.classList.contains("flickity-enabled")) {
                        if (slider.classList.contains("data-desktop-only")) {
                            if (window.innerWidth > 767) {
                                flickitySlider($("#" + sliderId));
                            }
                        } else {
                            flickitySlider($("#" + sliderId));
                        }
                    }
                }
                showMultipleOptions();
            }
        })
        .catch((e) => {
            console.error(e);
        });
}

function productHoverSlider() {
    var hoverSlider = setInterval(function () {
        if ($(".yv-product-hover-slider").length > 0) {
            clearInterval(hoverSlider);
            $(".yv-product-hover-slider").hover(
                function () {
                    var _this = $(this);
                    if (
                        _this.find(".sd-main-Slider").attr("data-flickity-hover-slider") ==
                        undefined
                    ) {
                        return false;
                    }
                    _this.addClass("slider-active");
                    var sliderOptions = JSON.parse(
                        _this.find(".sd-main-Slider").attr("data-flickity-hover-slider")
                    );
                    var $hoverSlider = _this
                        .find(".sd-main-Slider")
                        .flickity(sliderOptions);
                },
                function () {
                    if ($(this).find(".sd-main-Slider").hasClass("flickity-enabled")) {
                        $(this).removeClass("slider-active");
                        $(this).find(".sd-main-Slider").flickity("destroy");
                    }
                }
            );
            $(".yv-product-hover-slider")
                .find(".slider-button-prev")
                .on("click", function (e) {
                    e.preventDefault();
                    let gridHoverSlider = $(this)
                        .parent(".yv-product-hover-slider")
                        .find(".sd-main-Slider");
                    if (gridHoverSlider.hasClass("flickity-enabled")) {
                        gridHoverSlider.flickity("previous");
                    }
                });
            // next
            $(".yv-product-hover-slider")
                .find(".slider-button-next")
                .on("click", function (e) {
                    e.preventDefault();
                    let gridHoverSlider = $(this)
                        .parent(".yv-product-hover-slider")
                        .find(".sd-main-Slider");
                    if (gridHoverSlider.hasClass("flickity-enabled")) {
                        gridHoverSlider.flickity("next");
                    }
                });
        }
    }, 500);
    setTimeout(function () {
        clearInterval(hoverSlider);
    }, 6000);
}

function initBeforeAfter() {
    let cursors = document.querySelectorAll(".before-after-cursor-point");
    Array.from(cursors).forEach(function (cursor) {
        beforeAfterImage(cursor);
    });
}

function beforeAfterImage(cursor) {
    const _parentSection = cursor.closest(".shopify-section");
    let pointerDown = false;
    let _offsetX = (_currentX = 0);
    let minOffset = -cursor.offsetLeft - 0;
    let maxOffset = cursor.offsetParent?.clientWidth + minOffset || 0;
    _parentSection.addEventListener("pointerdown", function (event) {
        if (
            event.target === cursor ||
            event.target.closest(".before-after-cursor-point") === cursor
        ) {
            _initialX = event.clientX - _offsetX;
            pointerDown = true;
        }
    });
    _parentSection.addEventListener("pointermove", function () {
        if (!pointerDown) {
            return;
        }
        _currentX = Math.min(
            Math.max(event.clientX - _initialX, minOffset),
            maxOffset
        );
        _offsetX = _currentX;
        _currentX = _currentX.toFixed(1);
        _parentSection.style.setProperty("--imageClipPosition", `${_currentX}px`);
    });
    _parentSection.addEventListener("pointerup", function (event) {
        pointerDown = false;
    });
    window.addEventListener("resize", function () {
        if (!cursor.offsetParent) {
            return false;
        }
        minOffset = -cursor.offsetLeft - 0;
        maxOffset = cursor.offsetParent?.clientWidth + minOffset || 0;
        _currentX = Math.min(Math.max(minOffset, _currentX), maxOffset);
        _parentSection.style.setProperty("--imageClipPosition", `${_currentX}px`);
    });
}

function hideBanner() {
    document.querySelector(".cookies-banner") && (document.querySelector(".cookies-banner").style.display = "none");
}

function showBanner() {
    document.querySelector(".cookies-banner") && (document.querySelector(".cookies-banner").style.display = "block");
}

function handleAccept(e) {
    window.Shopify.customerPrivacy.setTrackingConsent(!0, hideBanner),
    document.addEventListener("trackingConsentAccepted", function () {
    });
}

function handleDecline() {
    window.Shopify.customerPrivacy.setTrackingConsent(!1, hideBanner);
}

function initCookieBanner() {
    const userCanBeTracked = window.Shopify.customerPrivacy.userCanBeTracked(),
        userTrackingConsent = window.Shopify.customerPrivacy.getTrackingConsent();
    if (userCanBeTracked && userTrackingConsent === "no_interaction") {
        showBanner();
    }
}

function cookiesBanner() {
    window.Shopify.loadFeatures(
        [{ name: "consent-tracking-api", version: "0.1" }],
        function (e) {
            if (e) throw e;
            initCookieBanner();
        }
    );
}

function docOnLoad() {
   // pickUpAvialabiliy(true);
    // productVariants();
    sellingPlanChange();
    sliders();
    checkMapApi();
    tabAccordionContent();
    updateBlogbtnHeight();
    showHideMenus();
}

$(document).ready(function () {
    docOnLoad();
    var slideIndex = 0;
    var block = "";
    let stickyItems = $(".sticky-item");
    setTimeout(function () {
        if ($("body").hasClass("sticky-header")) {
            let headerHeight = $(".shopify-section-main-header").height();
        } else {
            stickyItems.css("top", "0px");
        }
    }, 500);

    jQuery(document).on(
        "shopify:section:select shopify:section:deselect shopify:section:load shopify:section:unload shopify:block:select shopify:block:deselect",
        function (event) {
            var parent = event.target;
            var mainSliderSelector = $(".yv-product-big-slider");
            if (mainSliderSelector.hasClass("flickity-enabled")) {
                productSlider.resize();
            }
            if (Shopify.PaymentButton) {
                Shopify.PaymentButton.init();
            }
            if (jQuery(parent).hasClass("offer-sidebar-section")) {
                jQuery(parent).show();
            } else {
                $(".offer-sidebar-section").hide();
                jQuery("body").removeClass("offer-open");
                jQuery(".yv-coupan-sidebar-element").removeClass("open");
            }
            $(".offer-sidebar-section").hide();
            var slider = jQuery(parent).find("[data-flickity-slider]");
            if (event.type == "shopify:block:select") {
                jQuery(parent).find(".yv-accordion-header").trigger("click");
                if (jQuery(parent).hasClass("yv-timeline-nav")) {
                    jQuery(parent).find("[data-timeline-nav]").trigger("click");
                }
                if (jQuery(parent).hasClass("collections-list-slider-item")) {
                    collectionHoverAction(
                        jQuery(parent).find("[data-hover-collection-item]")[0]
                    );
                }
                if (jQuery(parent).hasClass("color-collections-color-item")) {
                    jQuery(parent).trigger("click");
                }
                if (
                    jQuery(parent)
                        .closest(".shopify-section")
                        .hasClass("offer-sidebar-section")
                ) {
                    $(".offer-sidebar-section").show();
                    jQuery("body").addClass("offer-open");
                    jQuery("body").find(".yv-coupan-sidebar-element").addClass("open");
                    jQuery("body")
                        .find(".yv-coupan-sidebar-element")
                        .find("[data-flickity-slider]")
                        .flickity("resize");
                } else {
                    $(".offer-sidebar-section").hide();
                    jQuery("body").removeClass("offer-open");
                    jQuery(".yv-coupan-sidebar-element").removeClass("open");
                    jQuery("body")
                        .find(".yv-coupan-sidebar-element")
                        .find("[data-flickity-slider]")
                        .flickity("resize");
                }
                var sectionId = event.detail.sectionId;
                block = jQuery(event.target);
                slideIndex = block.index();
                if (
                    block.closest("[data-flickity-slider]").hasClass("flickity-enabled")
                ) {
                    block
                        .closest("[data-flickity-slider]")
                        .flickity("select", slideIndex);
                }
            } else {
                $(".offer-sidebar-section").hide();
                jQuery("body").removeClass("offer-open");
                jQuery(".yv-coupan-sidebar-element").removeClass("open");
                jQuery("body")
                    .find(".yv-coupan-sidebar-element")
                    .find("[data-flickity-slider]")
                    .flickity("resize");
            }
            if (event.type == "shopify:section:load") {
                // productVariants(parent);
                UpdateSplitBannerdescHeight();
                onSectionChange(event);
                updateBannerGridHeight();
                tabAccordionContent();
                collectionHoverNavInit(parent);
                timelineNavInit(parent);
                localizationElements(parent);
                cookiesBanner();
                viewcategoryInit();
                initBeforeAfter();
                productHoverSlider();
                initYouTubeIframe(parent);
                productRecommendations();
                hamburgerInit();
                navigationMenu();
                closeDrawers();
                recentlyViewedProducts();
                productGiftOptions();
                lookbookScrollContent();
                initStoreLocator();
                productQueryForm();
                newsletterSidebar();
                pdpCountdown();
                coloredCollection(parent);
                sideDrawerContentStoryInit(parent);
                showHideMenus();
                if (parent.querySelector("[data-icon]")) {
                    _iconsAnimations(parent);
                }
                if (parent.querySelector(".yv-parallax")) {
                    new universalParallax().init({
                        speed: 10,
                    });
                }
                if (parent.classList.contains("shopify-section-main-header")) {
                    $("html, body").animate({ scrollTop: 0 }, "slow");
                    initSearchPrompts(parent);
                }
                if (
                    jQuery(parent)
                        .closest(".shopify-section")
                        .hasClass("offer-sidebar-section")
                ) {
                    $(".offer-sidebar-section").show();
                }
                if (block != "") {
                    slideIndex = undefined;
                }
                if (event.target.querySelector("[data-map-container]")) {
                    checkMapApi(event.target.querySelector("[data-map-container]"));
                }
                let _sliders = jQuery(event.target).find("[data-flickity-slider]");
                _sliders.each(function () {
                    let _slider = $(this);
                    if (_slider.is("[data-mobile-only]")) {
                        if ($(window).width() < 768) {
                            if (!_slider.hasClass("flickity-enabled")) {
                                flickitySlider(_slider, slideIndex);
                            }
                        } else {
                            if (_slider.hasClass("flickity-enabled")) {
                                _slider.flickity("destroy");
                            }
                        }
                    } else if (_slider.is("[data-desktop-only]")) {
                        if ($(window).width() >= 768) {
                            if (!_slider.hasClass("flickity-enabled")) {
                                flickitySlider(_slider);
                            }
                        } else {
                            if (_slider.hasClass("flickity-enabled")) {
                                _slider.flickity("destroy");
                            }
                        }
                    } else {
                        if (!_slider.hasClass("flickity-enabled")) {
                            flickitySlider($(this), slideIndex);
                        }
                    }
                });
                if (jQuery(event.target).find("[data-slider]").length > 0) {
                    jQuery("html, body").animate({ scrollTop: jQuery(event.target).offset().top, });
                }

                if (jQuery(event.target).find(".dealDate").length > 0) {
                    dealSection(jQuery(event.target).attr("id"));
                }
            }
            if (event.type == "shopify:section:unload") {
                if (event.target.querySelector("[data-map-container]")) {
                    checkMapApi(event.target.querySelector("[data-map-container]"));
                }
            }
            if (event.type == "shopify:section:select") {
                if (jQuery(parent).hasClass("offer-sidebar-section")) {
                    jQuery(parent).show();
                } else if ($(".offer-sidebar-section").find(".yv-offer-sidebar-outer").length == 0) {
                    $(".offer-sidebar-section").hide();
                }
            }
            if (event.type == "shopify:section:select" || event.type == "shopify:section:load") {
                if (jQuery(parent).hasClass("side-drawer-content")) {
                    if (parent.querySelector(".side-drawer-story")) {
                        jQuery("[data-content-drawer-main]").addClass("show");
                        document.querySelector("body").classList.add("story-drawer-open");
                        setTimeout(function () { document.querySelector("body").classList.add("story-drawer-overlay"); }, 400);
                    } else {
                        jQuery("[data-content-drawer-main]").removeClass("show");
                        document.querySelector("body").classList.remove("story-drawer-overlay");
                        setTimeout(function () {
                            document.querySelector("body").classList.remove("story-drawer-open");
                        }, 700);
                    }
                }
            }
            if (event.type == "shopify:section:deselect") {
                if (jQuery(parent).hasClass("side-drawer-content")) {
                    jQuery("[data-content-drawer-main]").removeClass("show");
                    document.querySelector("body").classList.remove("story-drawer-overlay");
                    setTimeout(function () {
                        document
                            .querySelector("body")
                            .classList.remove("story-drawer-open");
                    }, 700);
                }
            }
            var offset = $(parent).offset();
            if (animationStatus) {
                if (AOS) {
                    setTimeout(() => {
                      AOS.refreshHard();
                    }, 200);
                }
            }
        }
    );

    $("#currencyMobile").change(function () {
        $(this).closest("form").submit();
    });
    var deals = document.getElementsByClassName("deal-banner-section");
    if (deals) {
        Array.from(deals).forEach(function (deal) {
            dealSection(deal.getAttribute("id"));
        });
    }

    $(window).resize(function (event) {
        if ($(window).width() < 992) {
            if ($("body").hasClass("catalog-open")) {
                $("body").removeClass("catalog-open");
                $("#view-catalog").hide();
            }
        }
        sliders();
        sliderFilter();
    });

    $(document).on("click", function (event) {
        var $trigger = $(".currency-dropdown");
        if ($trigger !== event.target && !$trigger.has(event.target).length) {
            $(".currency-menu").slideUp("fast");
        }
    });

    $("body").on("click", ".navbar-toggler,.yv-mobile-category", function (event) {
        event.preventDefault();
        $(".navbar-collapse-sidebar").addClass("show");
        $("body").addClass("nav-open");
    }
    );

    $("body").on("click", ".close-btn", function (event) {
        $("body").removeClass("nav-open"),
            $(".toggle-level,.list-menu__item.toggle").removeClass("open-menu-drop"),
            $(".inner").removeClass("is-open"),
            $(".header-store-content-mobile .store-location-dropdown").slideUp(
                "slow"
            ),
            $(".inner").slideUp("slow");
        setTimeout(() => {
            if (
                window.location.href.indexOf("#mobileMenu") > -1 ||
                window.location.href.indexOf("#header") > -1
            ) {
                let url = window.location.href.replace("#mobileMenu", "");
                url = url.replace("#header", "");
                history.replaceState({}, null, url);
            }
        }, 100);
    });

    $(document).on("click", ".close-cart-drawer", function () {
        $("body").removeClass("minicart-open"), $(".wrapper-overlay").hide();
    });

    $("body").on("click", ".similar_options", function (e) {
        e.preventDefault();
        var _this = $(this);
        $(".wrapper-overlay").css({ display: "block" });
        var getUrl = $(this).attr("data-url");
        const drawer = document.querySelector("[data-similar-product-drawer]");
        drawer.classList.add("searching");
        document.querySelector("body").classList.add("similar_Drawer_open");
        drawer.querySelector("[data-similar-drawer-body]").innerHTML = preLoadLoadGif;
        fetch(getUrl)
            .then((response) => response.text())
            .then((text) => {
                const html = document.createElement("div");
                html.innerHTML = text;
                const recommendations = html.querySelector("#similarItemContainer");
                if (recommendations && recommendations.innerHTML.trim().length) {
                    focusElement = _this;
                    drawer.querySelector("[data-similar-drawer-body]").innerHTML =
                        recommendations.innerHTML;
                    drawer.classList.remove("searching");
                    focusElementsRotation($("[data-similar-product-drawer]"));
                    $(document).find(".yv_similar_drawer_wrapper").trigger("focus");
                    gridPickUpAvailability(drawer);
                    // if (animationStatus) {
                    //     if (AOS) {
                    //         AOS.refreshHard();
                    //     }
                    // }
                }
            });
    });

    $("body").on("click", ".currency-dropdown .dropdown-toggle", function () {
        $(this).closest(".currency-dropdown").find(".currency-menu").slideToggle("fast");
    });

    $("body").on("click", "#CountryList .dropdown-item", function (event) {
        event.preventDefault();
        var value = $(this).attr("data-value");
        var text = $(this).text();
        $(this).closest("form").find(".dropdown-toggle").text(text);
        $(this).closest("form").find('[name="country_code"]').val(value);
        $(this).closest("form").submit();
        $(this)
            .closest(".currency-dropdown")
            .find(".currency-menu")
            .slideUp("fast");
    });

    $("body").on("click", ".dropdown-selected", function () {
        $("body").find(".productOptionSelectList").slideUp("fast");
        $(this).siblings(".productOptionSelectList").css({ display: "block" });
    });

    $("body").on(
        "click",
        ".toggle.list-menu__item,button.toggle-level",
        function (event) {
            event.preventDefault();
            var $this = $(this);
            if ($this.hasClass("open-menu-drop")) {
                $(this).next().removeClass("is-open");
                $(this).removeClass("open-menu-drop");
                $this.next().slideUp("slow");
            } else {
                $(".header-store-content-mobile .store-location-dropdown").slideUp(
                    "slow"
                );
                if ($(this).hasClass("toggle-level")) {
                    $(".toggle-level").removeClass("open-menu-drop");
                    $(".toggle-level").next().removeClass("is-open");
                    $(".toggle-level").next().slideUp("slow");
                } else {
                    $(".toggle.list-menu__item,.toggle-level").removeClass(
                        "open-menu-drop"
                    );
                    $(".toggle.list-menu__item,.toggle-level")
                        .next()
                        .removeClass("is-open");
                    $(".toggle.list-menu__item,.toggle-level").next().slideUp("slow");
                }
                $this.closest("li").find(".inner").removeClass("is-open");
                $this.closest("li").find(".inner").slideUp("slow");
                $(this).addClass("open-menu-drop");
                $this.next().slideDown("slow");
                $this.next().addClass("is-open");
            }
        }
    );

    $(document).on("click", function (event) {
        var $trigger = $(".productOptionSelect");
        if ($trigger !== event.target && !$trigger.has(event.target).length) {
            $(".productOptionSelectList").slideUp("fast");
        }
    });

    $("body").on("click", ".dropdown-menu li", function () {
        var getValue = $(this).text();
        $(this).find("input").prop("checked", true);
        $(this)
            .closest(".productOptionSelect")
            .find(".dropdown-selected")
            .text(getValue);
        $(this).closest(".productOptionSelectList").slideUp("fast");
    });

    $(document).on(
        "click",
        ".yv_side_drawer_close,.yv_similar_drawer_close",
        function () {
            $(".yv-upsell-drawer").removeClass("active");
            $("body")
                .removeClass("side_Drawer_open")
                .removeClass("similar_Drawer_open")
                .removeClass("yv_side_Drawer_open");
            closeVideoMedia("quickView");
            $("[data-similar-drawer-body]").html("");
            stopFocusElementsRotation();
            if (focusElement) {
                if (focusElement.nodeType || focusElement == window) {
                    focusElement.focus();
                } else {
                    focusElement.trigger("focus");
                }
                focusElement = "";
            }
        }
    );

    $(document).on("click", ".quickView", function (evt) {
        evt.preventDefault();
        let _this = $(this);
        const drawer = document.querySelector("[data-side-drawer]");
        drawer.setAttribute("class", "yv_side_drawer_wrapper");
        drawer.setAttribute("id", "yv_quickView_product");
        drawer.classList.add("yv_quickView_product");
        drawer.querySelector("[data-drawer-body]").innerHTML = preLoadLoadGif;
        drawer.querySelector("[data-drawer-title]").innerHTML = quickViewHeading;
        drawer.querySelector("[data-drawer-body]").classList.add("searching");
        document.querySelector("body").classList.add("side_Drawer_open");
        var _url = $(this).data("href");
        if (_url.indexOf("?") > -1) {
            _url = _url.split("?");
            _url = _url[0];
        }
        $(".Quick_loader").fadeIn("slow");
        setTimeout(function () {
            $.get(_url + "?view=quick-view", function (data) {
                $("[data-drawer-body]").html(data);
                // $(window).trigger('resize');
                drawer
                    .querySelector("[data-drawer-body]")
                    .classList.remove("searching");
                if (Shopify.PaymentButton) {
                    Shopify.PaymentButton.init();
                }
                // productVariants(drawer);
                focusElementsRotation($("[data-side-drawer]"));
                focusElement = _this;
                $(document).find(".yv_side_drawer_wrapper").trigger("focus");
            });
        }, 1000);
    });

    $(document).on("click", ".quickViewClose", function (evt) {
        evt.preventDefault();
        $("body").removeClass("quickview-open");
        stopFocusElementsRotation();
        if (focusElement) {
            if (focusElement.nodeType) {
                focusElement.focus();
            } else {
                focusElement.trigger("focus");
            }
            focusElement = "";
        }
    });

    $(".flickity-slider > div").on("focus,keydown", function () {
        let index = $(this).index();
        $(this).closest(".flickity-enabled").flickity("select", index);
    });

    $(".yv-product-slider").on("scroll", function () {
        document.querySelectorAll(".yv-youtube-video").forEach((video) => {
            let left = video.getBoundingClientRect().left;
            if (!(left > -50 && left < window.innerWidth - 100)) {
                video.contentWindow.postMessage(
                    '{"event":"command","func":"' + "pauseVideo" + '","args":""}',
                    "*"
                );
            }
        });
        document.querySelectorAll(".yv-vimeo-video").forEach((video) => {
            let left = video.getBoundingClientRect().left;
            if (!(left > -50 && left < window.innerWidth - 100)) {
                video.contentWindow.postMessage('{"method":"pause"}', "*");
            }
        });
        document.querySelectorAll("video").forEach((video) => {
            let left = video.getBoundingClientRect().left;
            if (!video.hasAttribute("autoplay")) {
                if (!(left > -50 && left < window.innerWidth - 100)) {
                    video.pause();
                }
            }
        });
    });
    $(document).on("click", ".video-play-btn", function (e) {
        e.preventDefault();
        $(this).closest(".video-overlay-text").hide();
        let $section = $(this).closest(".shopify-section");
        let $video = $section.find("video").first(); // Select the first video in the section
        if ($video.closest(".deferred-media").attr("data-id") === "video-banner-autodisable") {
            // Ensure the video element exists
            if ($video.length > 0 && $video[0].readyState >= 4) {
                $video[0].muted = false; // Unmute the video
                $video[0].play(); // Play the video

                $(this).hide(); // Hide play button
            } else {
            }
        }
        $(this)
            .closest(".shopify-section")
            .find(".yv-feature-videobox")
            .addClass("video-loaded");
        $(this).closest(".shopify-section").find(".video-banner-file").show();
    });

});

jQuery(window).resize(function () {
    setTimeout(function () {
        var sliders = jQuery("body").find("[data-flickity-slider]");
        if (sliders.length > 0) {
            sliders.each(function (index) {
                var _this = jQuery(this);
                if (_this.hasClass("flickity-enabled")) {
                    _this.flickity("resize");
                }
            });
        }
    }, 1000);
});

function viewcategoryInit() {
    $(".yv-browse-category-link").click(function (e) {
        $("#view-catalog").show();
        if ($("body").hasClass("catalog-open")) {
            $("body").removeClass("catalog-open");
            $("#view-catalog").hide();
        } else {
            $("body").addClass("catalog-open");
            $("#view-catalog").show();
        }
    });
}

$(document).on("click", ".menu-tab", function () {
    if ($(this).hasClass("active")) return false;
    $(".menu-tab").removeClass("active");
    $("#mobileMenu").find(".tabcontent").addClass("hidden");
    $(this).addClass("active");
    $($(this).attr("data-tab")).removeClass("hidden");
});

function getFirstAvailableVariant(options, type, selector, allVariants) {
    let availableVariant = null,
        slicedCount = 0;
    do {
        options.pop();
        slicedCount += 1;
        availableVariant = allVariants.find((variant) => {
            return variant["options"]
                .slice(0, variant["options"].length - slicedCount)
                .every((value, index) => value === options[index]);
        });
    } while (!availableVariant && options.length > 0);
    if (availableVariant) {
        let fieldsets = Array.from(
            selector.querySelectorAll(".product-loop-variants")
        );
        fieldsets.forEach((fieldset, index) => {
            if (variantStyle == "dropdown") {
                let option = fieldset.querySelector("select");
                if (option && option.value != availableVariant["options"][index]) {
                    option.value = availableVariant["options"][index];
                }
            } else {
                let option = fieldset.querySelector(
                    'input[value="' + CSS.escape(availableVariant["options"][index]) + '"]'
                );
                if (option && option.checked == false) {
                    option.click();
                }
            }
        });
    }
    return availableVariant;
}
/* get variant based on selected options end */
const classAddToSelector = (
    selector,
    valueIndex,
    available,
    combinationExists
) => {
    if (variantStyle == "swatch") {
        const optionValue = Array.from(selector.querySelectorAll(".productOption"))[
            valueIndex
        ];
        optionValue.parentElement.classList.toggle("hidden", !combinationExists);
        optionValue.classList.toggle("not-available", !available);
    } else {
        const optionValue = Array.from(
            selector.querySelectorAll(".productOption option")
        )[valueIndex];
        optionValue.classList.toggle("hidden", !combinationExists);
        optionValue.toggleAttribute("disabled", !available);
    }
};

function updateOptionsAvailability(
    product,
    productOptions,
    selectedVariant,
    optionSelectors,
    variantStyle
) {
    if (!selectedVariant) {
        return;
    }
    if (optionSelectors && optionSelectors[0]) {
        productOptions[0]["values"].forEach((value, valueIndex) => {
            const combinationExists = product.some(
                (variant) => variant["option1"] === value && variant
            ),
                availableVariantExists = product.some(
                    (variant) => variant["option1"] === value && variant["available"]
                );
            classAddToSelector(
                optionSelectors[0],
                valueIndex,
                availableVariantExists,
                combinationExists
            );
            if (optionSelectors[1] && productOptions[1]) {
                productOptions[1]["values"].forEach((value2, valueIndex2) => {
                    const combinationExists2 = product.some(
                        (variant) =>
                            variant["option2"] === value2 &&
                            variant["option1"] === selectedVariant["option1"] &&
                            variant
                    ),
                        availableVariantExists2 = product.some(
                            (variant) =>
                                variant["option2"] === value2 &&
                                variant["option1"] === selectedVariant["option1"] &&
                                variant["available"]
                        );
                    classAddToSelector(
                        optionSelectors[1],
                        valueIndex2,
                        availableVariantExists2,
                        combinationExists2
                    );
                    if (optionSelectors[2] && productOptions[2]) {
                        productOptions[2]["values"].forEach((value3, valueIndex3) => {
                            const combinationExists3 = product.some(
                                (variant) =>
                                    variant["option3"] === value3 &&
                                    variant["option1"] === selectedVariant["option1"] &&
                                    variant["option2"] === selectedVariant["option2"] &&
                                    variant
                            ),
                                availableVariantExists3 = product.some(
                                    (variant) =>
                                        variant["option3"] === value3 &&
                                        variant["option1"] === selectedVariant["option1"] &&
                                        variant["option2"] === selectedVariant["option2"] &&
                                        variant["available"]
                                );
                            classAddToSelector(
                                optionSelectors[2],
                                valueIndex3,
                                availableVariantExists3,
                                combinationExists3
                            );
                        });
                    }
                });
            }
        });
    }
}

function productGiftOptions() {
    let giftCardWrappers = document.querySelectorAll("[data-gift-card-box]");
    Array.from(giftCardWrappers).forEach(function (giftCard) {
        let jsCheck = giftCard.querySelector("[data-js-gift-card-selector]");
        if (jsCheck) {
            jsCheck.disabled = false;
            jsCheck.addEventListener("click", function () {
                let giftCardContent = giftCard.querySelector(
                    "[data-gift-card-content]"
                );
                if (jsCheck.checked) {
                    DOMAnimations.slideDown(giftCardContent, 500);
                } else {
                    DOMAnimations.slideUp(giftCardContent, 500);
                }
            });
        }
        let noJsCheck = giftCard.querySelector("[data-no-js-gift-card-selector]");
        if (noJsCheck) {
            noJsCheck.disabled = true;
        }
    });
}

function recentlyViewedProducts() {
    let rvpWrappers = document.querySelectorAll("[data-recent-viewed-products]");
    Array.from(rvpWrappers).forEach(function (rvp) {
        let currentProduct = parseInt(rvp.dataset.product);
        let cookieName = "yv-recently-viewed";
        let rvProducts = JSON.parse(
            window.localStorage.getItem(cookieName) || "[]"
        );
        if (!isNaN(currentProduct)) {
            if (!rvProducts.includes(currentProduct)) {
                rvProducts.unshift(currentProduct);
            }
            window.localStorage.setItem(
                cookieName,
                JSON.stringify(rvProducts.slice(0, 14))
            );

            if (rvProducts.includes(parseInt(currentProduct))) {
                rvProducts.splice(rvProducts.indexOf(parseInt(currentProduct)), 1);
            }
        }
        let currentItems = rvProducts
            .map((item) => "id:" + item)
            .slice(0, 6)
            .join(" OR ");
        fetch(rvp.dataset.section + currentItems)
            .then((response) => response.text())
            .then((text) => {
                const html = document.createElement("div");
                html.innerHTML = text;
                const recommendations = html.querySelector(
                    "[data-recent-viewed-products]"
                );
                if (recommendations && recommendations.innerHTML.trim().length) {
                    rvp.innerHTML = recommendations.innerHTML;
                    rvp.closest(".shopify-section").classList.remove("hidden");
                    gridPickUpAvailability(rvp);
                }
            })
            .catch((e) => {
                console.error(e);
            });
    });
}

function isOnScreenVisible(elm) {
    const rect = elm.getBoundingClientRect();
    const viewHeight = Math.max(
        document.documentElement.clientHeight,
        window.innerHeight
    );
    return !(rect.bottom < 0 || rect.top - viewHeight >= 0);
}

function getOffsetTop(elm) {
    if (!elm.getClientRects().length) {
        return 0;
    }
    const rect = elm.getBoundingClientRect();
    const win = elm.ownerDocument.defaultView;
    return rect.top + win.pageYOffset;
}

function lookbookscrollItem(currentSlideMedia, scrollValue) {
    currentSlideMedia.style.height = `${scrollValue}px`;
}

function lookbookScrollContent() {
    if (window.innerWidth <= 767) return;
    const sliderItems = document.querySelectorAll("[data-lookbook-container]");
    const screenHeight = Math.min(window.innerHeight, window.screen.availHeight);
    let currentScroll = window.scrollY;
    const adjustSlideHeights = (slideritem, slides, slidesMediaItems) => {
        const sliderTop = slideritem.getBoundingClientRect().top + window.scrollY;
        let current = 0;
        slides.forEach((slide, index) => {
            const slideTop = slide.getBoundingClientRect().top + window.scrollY;
            const isVisible = window.scrollY >= slideTop - screenHeight;
            if (index === 0) {
                slidesMediaItems[index].style.height = "100%";
            } else {
                const scrollProgress = Math.min(
                    screenHeight,
                    window.scrollY - slideTop + screenHeight
                );
                slidesMediaItems[index].style.height = isVisible ? `${scrollProgress}px` : "0";
            }
            if (isVisible) {
                current = index;
            }
        });
        // Logic for `lookbook-to-normal` class based on original code
        const scrollTop = window.scrollY >= 0 ? window.scrollY : 0;
        // Add class if scrolled to top and not already added
        if (scrollTop < sliderTop && !slideritem.classList.contains("lookbook-to-normal")) {
            slideritem.classList.add("lookbook-to-normal");
        }
        const isLastSlideFullyVisible = scrollTop + screenHeight >= sliderTop + slideritem.offsetHeight;
        // Add/remove class based on scroll position within slider
        if (current === 0 && isLastSlideFullyVisible && !slideritem.classList.contains("lookbook-to-normal")) {
            slideritem.classList.add("lookbook-to-normal");
        } else if (current > 0) {
            const scrollValue = scrollTop - sliderTop - screenHeight * (current - 1);
            if (isLastSlideFullyVisible && !slideritem.classList.contains("lookbook-to-normal")) {
                slideritem.classList.add("lookbook-to-normal");
            } else if (!isLastSlideFullyVisible && slideritem.classList.contains("lookbook-to-normal")) {
                slideritem.classList.remove("lookbook-to-normal");
            }
            if (!slideritem.classList.contains("lookbook-to-normal")) {
                lookbookscrollItem(slidesMediaItems[current], scrollValue);
            }
        }
    };

    // Main scroll function
    const onScroll = () => {
        sliderItems.forEach(slideritem => {
            const slides = slideritem.querySelectorAll(".lookbook-items");
            const slidesMediaItems = slideritem.querySelectorAll(".left-box > div");
            adjustSlideHeights(slideritem, slides, slidesMediaItems);
        });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();  // Run on load to set initial heights
}

window.addEventListener("resize", function () {
    if (window.innerWidth > 767) {
        lookbookScrollContent();
    }
});

$(document).click(function (event) {
    var container = $(".yv-header-searchbar-box");
    if (!container.is(event.target) && !container.has(event.target).length) {
        $(".yv-header-searchbar-content").hide();
    }
});

function gridPickUpAvailability(section = document) {
    let gridElements = section.querySelectorAll(
        ".grid-pickup-availability-preview-container"
    );
    Array.from(gridElements).forEach(function (grid) {
        var preferredStore = localStorage.getItem("preferredStore");
        var pickupElements = grid.querySelectorAll(".grid__avail-pickup");
        Array.from(pickupElements).forEach(function (element) {
            element.classList.add("hidden");
        });
        if (preferredStore == null && grid.querySelector("[data-select-store]")) {
            grid.querySelector("[data-select-store]").classList.remove("hidden");
        } else {
            let currentPickupStore = grid.querySelector(
                '.grid__avail-pickup[data-store="' + preferredStore + '"]'
            );
            if (currentPickupStore) {
                currentPickupStore.classList.remove("hidden");
            } else if (grid.querySelector("[data-store-unavailable]")) {
                grid.querySelector("[data-store-unavailable]").querySelector("[data-location-name]").textContent = preferredStore;
                grid.querySelector("[data-store-unavailable]").classList.remove("hidden");
            }
        }
    });
}

function initStoreLocator() {
    const preferredStoreKey = "preferredStore";
    const storeLocatorItems = document.querySelectorAll(".yv-store-locator-details-item");
    const modalWrapper = document.querySelector(".yv-store-locator-wrapper");
    const updatePreferredStore = (storeName) => {
        localStorage.setItem(preferredStoreKey, storeName);
        gridPickUpAvailability();
    };
    const getPreferredStore = () => localStorage.getItem(preferredStoreKey);
    const closeModal = () => {
        modalWrapper.style.display = "none";
        modalWrapper.classList.remove("store-locator-visible");
        document.querySelector("body").classList.remove("store-locator-open");
    };
    const button = document.querySelector(".yv-store-locator-btn");
    const closebutton = document.querySelector(".yv-store-locator-close");
    if (button) {
        button.addEventListener("click", (event) => {
            event.preventDefault();
            modalWrapper.style.display = "flex";
            modalWrapper.classList.add("store-locator-visible");
            document.querySelector("body").classList.add("store-locator-open");
            initStoreMap();
        });
    }
    if (closebutton) {
        closebutton.addEventListener("click", (event) => {
            event.preventDefault();
            closeModal();
        });
    }
    const preferredStore = getPreferredStore();
    if (preferredStore) {
        const preferredStoreItem = document.querySelector(
            `.yv-store-locator-details-item[data-label="${preferredStore}"]`
        );
        if (preferredStoreItem) {
            preferredStoreItem.classList.add("active");
        }
    }
    const changePreferredStoreButton = document.querySelector(".store-location-save");
    if (changePreferredStoreButton) {
        changePreferredStoreButton.addEventListener("click", () => {
            const activeItem = document.querySelector(".yv-store-locator-details-item.active");
            if (activeItem) {
                const storeName = activeItem.getAttribute("data-label");
                updatePreferredStore(storeName);
                closeModal();
            }
        });
    }
    if (storeLocatorItems.length > 0) {
        const script = document.createElement("script");
        script.src =
            "https://maps.googleapis.com/maps/api/js?key=" +
            googleMapApiKey +
            "&callback=initStoreMap";
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
    }
}

async function getGeoDetails(geocoder, address) {
    let getAddress = new Promise(function (resolve, reject) {
        geocoder.geocode({ address: address }, function (results, status) {
            if (status === "OK") {
                resolve([
                    results[0].geometry.location.lat(),
                    results[0].geometry.location.lng(),
                ]);
            } else {
                reject(new Error("Couldnt't find the location " + address));
            }
        });
    });
    return await getAddress;
}

function initStoreMap() {
    setTimeout(() => {
        let geocoder = new google.maps.Geocoder();
        const storeLocatorItems = document.querySelectorAll(
            ".yv-store-locator-details-item"
        );
        if (storeLocatorItems.length == 0) {
            return false;
        }
        const preferredStoreKey = "preferredStore";
        const map = new google.maps.Map(
            document.querySelector(".yv-store-locator-map"), {
            center: { lat: 0, lng: 0 },
            zoom: 8,
            mapTypeControl: false,
            streetViewControl: false,
            scrollwheel: false,
        }
        );
        const markers = [];
        const createMarker = (position) => {
            return new google.maps.marker.AdvancedMarkerElement({
                position: position,
                map: map,
                icon: document.querySelector(".yv-store-locator-map").getAttribute("data-marker"),
            });
        };
        const updateMap = (latitude, longitude) => {
            map.setCenter({ lat: latitude, lng: longitude });
            map.setZoom(15);
            markers.forEach((marker) => marker.setMap(null));
            const position = { lat: latitude, lng: longitude };
            const marker = createMarker(position);
            markers.push(marker);
        };
        let activeItem = document.querySelector(
            ".yv-store-locator-details-item.active"
        );
        if (!activeItem) {
            activeItem = document.querySelector(".yv-store-locator-details-item");
        }
        let address = activeItem.getAttribute("data-address");
        let geoDetail = getGeoDetails(geocoder, address);
        geoDetail.then(function (address) {
            if (geoDetail != null) {
                updateMap(address[0], address[1]);
            }
        });
        storeLocatorItems.forEach((item) => {
            item.addEventListener("click", () => {
                const storeName = item.getAttribute("data-label");
                let address = item.getAttribute("data-address");
                storeLocatorItems.forEach((sibling) => {
                    if (sibling !== item) {
                        sibling.classList.remove("active");
                    }
                });
                item.classList.add("active");
                let geoDetail = getGeoDetails(geocoder, address);
                geoDetail.then(function (address) {
                    if (geoDetail != null) {
                        updateMap(address[0], address[1]);
                    }
                });
            });
        });
    }, 100);
}

function productQueryForm() {
    const button = document.querySelector(".yv-ask-question-btn");
    const addonmodalWrapper = document.querySelector(".yv-addon-button-wrapper");
    const addonclosebutton = document.querySelector(".yv-addon-button-close");
    if (button) {
        button.addEventListener("click", (event) => {
            addonmodalWrapper.style.display = "flex";
            document.querySelector("body").classList.add("query-form-open");
        });
    }
    if (addonmodalWrapper) {
        function addoncloseModal() {
            addonmodalWrapper.style.display = "none";
            document.querySelector("body").classList.remove("query-form-open");
        }
    }
    if (addonclosebutton) {
        addonclosebutton.addEventListener("click", (event) => {
            event.preventDefault();
            addoncloseModal();
        });
    }
}

function timelineNavInit(section = document) {
    let navsElements = section.querySelectorAll("[data-timeline-nav]");
    Array.from(navsElements).forEach(function (nav) {
        nav.addEventListener("click", () => {
            if (nav.classList.contains("active")) {
                return false;
            }
            let _section = nav.closest(".shopify-section");
            let activeNav = _section.querySelector(".yv-timeline-nav.active");
            if (activeNav) {
                activeNav.classList.remove("active");
                nav.closest(".yv-timeline-nav").classList.add("active");
            }
            let focusContentSlider = Flickity.data(
                "#" + nav.getAttribute("data-focus-content")
            );
            let focusIndex = nav.getAttribute("data-index");
            if (focusContentSlider && focusIndex) {
                focusContentSlider.select(focusIndex);
            }
        });
    });
}

function collectionHoverNavInit(section = document) {
    let navsElements = section.querySelectorAll("[data-hover-collection-item]");
    Array.from(navsElements).forEach(function (nav) {
        nav.addEventListener("mouseover", () => {
            collectionHoverAction(nav);
        });
    });
}

function collectionHoverAction(nav) {
    if (nav.classList.contains("active")) {
        return false;
    }
    let _section = nav.closest(".shopify-section");
    let activeImage = _section.querySelector(
        ".featured-collections-banner-img.active"
    );
    let activeNav = _section.querySelector("[data-hover-collection-item].active");
    if (activeNav) {
        activeNav.classList.remove("active");
        nav.classList.add("active");
    }
    let currentItemID = nav.getAttribute("data-media");
    let currentMedia = _section.querySelector("#" + currentItemID);
    let _name = nav.textContent;
    let _href = nav.getAttribute("data-href");
    let nameSelector = _section.querySelector("[data-collection-banner-title]");
    if (currentMedia) {
        activeImage.classList.remove("active");
        currentMedia.classList.add("active");
    }
    if (nameSelector) {
        nameSelector.textContent = _name;
        if (_href != null) {
            nameSelector.removeAttribute("role");
            nameSelector.removeAttribute("aria-disabled");
            nameSelector.setAttribute("href", _href);
        } else {
            nameSelector.removeAttribute("href");
            nameSelector.setAttribute("aria-disabled", true);
            nameSelector.setAttribute("role", "link");
        }
    }
    if (_section.querySelector("[data-collection-banner-description]")) {
        if (nav.nextElementSibling) {
            _section.querySelector(
                "[data-collection-banner-description]"
            ).textContent = nav.nextElementSibling.textContent;
            _section
                .querySelector("[data-collection-banner-description]")
                .classList.remove("hidden");
        } else {
            _section
                .querySelector("[data-collection-banner-description]")
                .classList.add("hidden");
        }
    }
}

function newsletterSidebar() {
    const button = document.querySelector(".yv-discount-panel");
    const newslettermodalWrapper = document.querySelector(
        ".yv-discount-sidebar-element"
    );
    const newsletterclosebutton = document.querySelector(
        ".yv-newsletter-popup-button-close"
    );
    if (button) {
        button.addEventListener("click", (event) => {
            newslettermodalWrapper.style.display = "flex";
            document.querySelector("body").classList.add("newsletter-popup-open");
        });
    }
    if (newslettermodalWrapper) {
        function newslettercloseModal() {
            newslettermodalWrapper.style.display = "none";
            document.querySelector("body").classList.remove("newsletter-popup-open");
        }
    }
    if (newsletterclosebutton) {
        newsletterclosebutton.addEventListener("click", (event) => {
            event.preventDefault();
            newslettercloseModal();
        });
    }
}

// Set the sale end date as a JavaScript variable
function pdpCountdown() {
    Array.from(document.querySelectorAll("[data-product-countdown]")).forEach(
        function (countdownElement) {
            var EndDate = countdownElement.getAttribute("data-product-countdown");
            if (EndDate != null) {
                var saleEndDate = new Date(EndDate);
                // Function to update the countdown timer
                let pdpCountdownInterval = setInterval(function () {
                    var now = new Date();
                    var timeRemaining = saleEndDate - now;
                    var days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
                    var hours = Math.floor(
                        (timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
                    );
                    var minutes = Math.floor(
                        (timeRemaining % (1000 * 60 * 60)) / (1000 * 60)
                    );
                    var seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
                    countdownElement.querySelector("#dDays1").innerHTML = days;
                    countdownElement.querySelector("#dHours1").innerHTML = hours;
                    countdownElement.querySelector("#dMinutes1").innerHTML = minutes;
                    countdownElement.querySelector("#dSeconds1").innerHTML = seconds;
                    if (timeRemaining <= 0) {
                        countdownElement.style.display = "none";
                        clearInterval(pdpCountdownInterval);
                    }
                }, 1000);
            }
        }
    );
}

function updateBackInStock(variant, container) {
    if (container) {
        let backInStockWrapper = container.querySelector("[data-back-in-stock]");
        if (backInStockWrapper) {
            let backInStockVariant = container.querySelector("[data-variant-title]");
            let backInStockVariantUrl = container.querySelector("[data-variant-url]");
            if (variant != undefined) {
                let baseUrl = window.location.pathname;
                if (baseUrl.indexOf("/products/") > -1) {
                    let _updateUrl =
                        baseUrl + "?variant=" + variant.id + "&contact_posted=true";
                    backInStockVariantUrl.value = _updateUrl;
                }
                backInStockVariant.value = variant.name;
                if (variant.available) {
                    if (!Shopify.designMode) {
                        backInStockWrapper.classList.add("hidden");
                    }
                } else {
                    backInStockWrapper.classList.remove("hidden");
                }
            } else {
                if (!Shopify.designMode) {
                    backInStockWrapper.classList.add("hidden");
                }
            }
        }
    }
}

function toggleForm(event) {
    event.preventDefault();
    let element = event.target;
    let elementParent = element.closest(".account-wrapper");
    let closeElement = elementParent.querySelector("#" + element.dataset.close);
    let openElement = elementParent.querySelector("#" + element.dataset.open);
    if (openElement && closeElement) {
        closeElement.style.display = "none";
        openElement.style.display = "block";
    }
}

function toggleAccountPopup(event, accountType) {
    event.preventDefault();
    let element = event.target;
    if (accountType == "dropdown") {
        let toggleElement = document.querySelector("[data-account-dropdown]");
        if (toggleElement) {
            DOMAnimations.slideToggle(toggleElement, 250);
        }
    } else {
        let toggleElement = document.querySelector("[data-account-popup]");
        if (toggleElement) {
            document.querySelector("body").classList.add("account-popup-open");
        }
    }
}

function toggleStoreDetails(event) {
    event.preventDefault();
    let element = event.target;
    let parent = element.closest("[data-store-wrapper]");
    let toggleElement = parent.querySelector("[data-store-location-dropdown]");
    if (parent.classList.contains("customer-support-mobile")) {
        $(".toggle-level,.list-menu__item.toggle").removeClass("open-menu-drop"),
            $(".inner").removeClass("is-open"),
            $(".inner").slideUp("slow");
    }
    if (toggleElement) {
        DOMAnimations.slideToggle(toggleElement, 250);
    }
}

function initSearchPrompts(section = document) {
    let inputElements = section.querySelectorAll(
        "[data-search-drawer-query-input]"
    );
    let typingSpeed = 100;
    let deletingSpeed = 60;
    let delayAfterDeleting = 500;
    let delayBeforeFirstDelete = 2000;
    let delayAfterWordTyped = 2400;
    Array.from(inputElements).forEach(function (input) {
        if (input.classList.contains("enable-searchpromt")) {
            let placeholders = [];
            if (input.placeholder) {
                placeholders.push(input.placeholder);
            }
            if (input.dataset.placeholderTwo) {
                placeholders.push(input.dataset.placeholderTwo);
            }
            if (input.dataset.placeholderThree) {
                placeholders.push(input.dataset.placeholderThree);
            }
            async function typeInNextPlaceholder(placeholder) {
                await new Promise((resolve) => {
                    let currentPlaceholder = input.getAttribute("placeholder");
                    let nextPlaceholder =
                        currentPlaceholder.length >= 3 &&
                            placeholder.startsWith(currentPlaceholder) ?
                            placeholder.replace(currentPlaceholder, "") :
                            placeholder;
                    const typingIntervalId = setInterval(() => {
                        currentPlaceholder = input.getAttribute("placeholder");
                        input.setAttribute(
                            "placeholder",
                            currentPlaceholder + nextPlaceholder.charAt(0)
                        );
                        if (nextPlaceholder.length === 1) {
                            resolve();
                            clearInterval(typingIntervalId);
                        } else {
                            nextPlaceholder = nextPlaceholder.substring(1);
                        }
                    }, typingSpeed);
                });
            }

            async function deleteCurrentPlaceholder(nextPlaceholder) {
                await new Promise((resolve) => {
                    let prevPlaceholder = input.getAttribute("placeholder");
                    const deletionIntervalId = setInterval(() => {
                        const newPlaceholder = prevPlaceholder.substring(
                            0,
                            prevPlaceholder.length - 1
                        );
                        input.setAttribute("placeholder", newPlaceholder);
                        prevPlaceholder = newPlaceholder;
                        if (
                            prevPlaceholder.length === 0 ||
                            (prevPlaceholder.length >= 3 && nextPlaceholder.startsWith(prevPlaceholder))
                        ) {
                            resolve();
                            clearInterval(deletionIntervalId);
                        }
                    }, deletingSpeed);
                });
            }

            let startIndex = 0;
            function showNextPlaceholder() {
                startIndex = (startIndex + 1) % placeholders.length;
                const nextPlaceholder = placeholders[startIndex];
                deleteCurrentPlaceholder(nextPlaceholder).then(() => {
                    setTimeout(() => {
                        typeInNextPlaceholder(nextPlaceholder).then(() => {
                            setTimeout(showNextPlaceholder, delayAfterWordTyped);
                        });
                    }, delayAfterDeleting);
                });
            }
            setTimeout(showNextPlaceholder, delayBeforeFirstDelete);
        }
    });
}

class Variants extends HTMLElement {
    constructor() {
        super();
        this.addEventListener('change', this._onVariantChange);
        this.card = this.closest('[data-product-main-grid]');
    }

    _onVariantChange(event) {
        this._updateOptions();
        this._updateMasterVariantId();
        this._updateMedia();
        if (this.currentVariant) {
            const cartForm = this.previousElementSibling?.tagName === 'FORM' ? this.previousElementSibling : null;
            if (cartForm) {
                const idInput = cartForm.querySelector('[name="id"]');
                if (idInput) {
                    idInput.value = this.currentVariant.id;
                }
                if (cartDrawerEnable) {
                    cartForm.querySelector(".Sd_addProduct").click();
                } else {
                    cartForm.submit();
                }
            }
        }

    }

    _updateOptions() {
        this.options = Array.from(this.querySelectorAll('ul'), (element) => {
            return Array.from(element.querySelectorAll('input')).find((radio) => radio.checked)?.value;
        });

        const colorOptions = Array.from(this.card.querySelectorAll('.color-variants-wrapper'), (element) => {
            return Array.from(element.querySelectorAll('input')).find((radio) => radio.checked)?.value;
        });

        this.options = [...this.options, ...colorOptions];
    }

    _updateMasterVariantId() {
        this.currentVariant = this._getVariantData().find((variant) => {
            return !variant.options
                .map((option, index) => {
                    return this.options[index] === option;
                })
                .includes(false);
        });
    }

    _getVariantData() {
        this.variantData = this.variantData || JSON.parse(this.querySelector('[type="application/json"]').textContent);
        return this.variantData;
    }

    _updateMedia() {
        if (!this.currentVariant) return;
        const productCard = this.closest('[data-product-card]');
        if (productCard && productCard.querySelector('[data-product-grid-main-image]') && this.currentVariant.featured_image != null) {
            let imageContent = `${this.currentVariant.featured_media.preview_image.src}&width=100 100w,
            ${this.currentVariant.featured_media.preview_image.src}&width=200 200w,
            ${this.currentVariant.featured_media.preview_image.src}&width=300 300w,
            ${this.currentVariant.featured_media.preview_image.src}&width=400 400w`;
            productCard.querySelector('[data-product-grid-main-image]').querySelector('img').srcset = imageContent;
        }
    }
}
customElements.define('variants-set', Variants);

function switchSwatchMedia(event) {
    let element = event.target;
    if (element.classList.contains("active")) return false;
    let mediaParent = element.closest("[data-color-wrapper]");
    let gridParent = element.closest("[data-product-main-grid]");
    let productMediaWrapper = gridParent.querySelector("[data-product-grid-main-image]");
    if (element.closest(".color-variants-wrapper").querySelector(".productOption.active")) {
        element.closest(".color-variants-wrapper").querySelector(".productOption.active").classList.remove("active");
    }
    element.classList.add("active");
    if (mediaParent.querySelector("script") && productMediaWrapper) {
        let colorMedia = new DOMParser()
            .parseFromString(
                JSON.parse(mediaParent.querySelector("script").textContent),
                "text/html"
            )
            .querySelector(".media-content");
        productMediaWrapper.innerHTML = colorMedia.innerHTML;
    }
}

function localizationElements(section = document) {
    let localizationDropdowns = section.querySelectorAll(".detail-box");
    Array.from(localizationDropdowns).forEach(function (dropdown) {
        let footer = dropdown.closest("footer");
        dropdown.addEventListener("click", () => {
            if (dropdown.classList.contains("active")) {
                DOMAnimations.slideUp(dropdown.querySelector(".detail-expand"), 300);
                dropdown.classList.remove("active");
                setTimeout(() => {
                    if (footer) {
                        footer.style.removeProperty("z-index");
                    }
                }, 100);
            } else {
                DOMAnimations.slideDown(dropdown.querySelector(".detail-expand"), 300);
                dropdown.classList.add("active");
                setTimeout(() => {
                    if (footer) {
                        footer.style.zIndex = 2;
                    }
                }, 100);
            }
        });
        dropdown.onkeydown = function (e) {
            if (e.keyCode == 13 || e.keyCode == 32) {
                dropdown.click();
            }
        };
        section.addEventListener("click", (event) => {
            if (!dropdown.parentNode.contains(event.target)) {
                DOMAnimations.slideUp(dropdown.querySelector(".detail-expand"), 300);
                if (dropdown.classList.contains("active")) {
                    dropdown.classList.remove("active");
                    if (footer) {
                        footer.style.removeProperty("z-index");
                    }
                }
            }
        });
    });
}

function sideDrawerContentStoryInit(section = document) {
    let contentDrawerHeads = section.querySelectorAll(
        "[data-content-drawer-head]"
    );
    Array.from(contentDrawerHeads).forEach(function (contentDrawerHead) {
        contentDrawerHead.addEventListener("click", function (event) {
            event.preventDefault();
            let mainParent = contentDrawerHead.closest("[data-content-drawer-main]");
            if (mainParent.classList.contains("show")) {
                document.querySelector("body").classList.remove("story-drawer-overlay");
                mainParent.classList.remove("show");
                setTimeout(function () {
                    document.querySelector("body").classList.remove("story-drawer-open");
                }, 700);
            } else {
                setTimeout(function () {
                    mainParent.classList.add("show");
                }, 200);
                document.querySelector("body").classList.add("story-drawer-open");
                setTimeout(function () {
                    document.querySelector("body").classList.add("story-drawer-overlay");
                }, 400);
            }
        });
    });
    let contentDrawerCloseBtn = section.querySelectorAll(
        "[side-drawer-story-close]"
    );
    Array.from(contentDrawerCloseBtn).forEach(function (closeBtn) {
        closeBtn.addEventListener("click", function (event) {
            event.preventDefault();
            let mainParent = closeBtn.closest("[data-content-drawer-main]");
            mainParent.classList.remove("show");
            document.querySelector("body").classList.remove("story-drawer-overlay");
            setTimeout(function () {
                document.querySelector("body").classList.remove("story-drawer-open");
            }, 700);
        });
    });
}

function updateBlogbtnHeight() {
    Array.from(document.querySelectorAll(".yv-blog-card")).forEach((card) => {
        if (!card) return;
        const descElement = card.querySelector(".yv-blog-card-text");
        const buttonHeight = card.querySelector(".button.secondary-button");

        if (descElement && buttonHeight) {
            descElement.style.setProperty("--button-height", `${buttonHeight.getBoundingClientRect().height}px`);
        }
    });
}

function updateBannerGridHeight() {
    const descElement = document.querySelector(".banner-collection-product-list");
    if (!descElement) return;

    if (descElement) {
        const section = descElement.closest('.shopify-section');
        section.style.setProperty("--banner-grid-height", `${descElement.getBoundingClientRect().height}px`);
    }
}

function UpdateSplitBannerdescHeight() {
    Array.from(document.querySelectorAll(".split-banner-content")).forEach((card) => {
        if (card) {
            const descHeight = card.querySelector(".split-banner-desc");
            if (descHeight) {
                card.style.setProperty("--desc-height", `${descHeight.getBoundingClientRect().height}px`);
            }
        }
    });
}

document.addEventListener("DOMContentLoaded", function () {
    setTimeout(function () {
        document.querySelector("body").classList.remove("page-loading");
        if (document.querySelector("body").classList.contains("nav-open")) {
            document.querySelector("body").classList.remove("nav-open");
        }
    }, 500);
    var footerMenus = document.getElementsByClassName("footer-menu-accordion-head");
    Array.from(footerMenus).forEach(function (menu) {
        var menuList = menu.nextElementSibling;
        var menuParent = menu.parentNode;
        menu.addEventListener("click", function (event) {
            if (window.innerWidth < 768) {
                event.preventDefault();
                if (!menuParent.classList.contains("active")) {
                    hideallMenus(footerMenus, menu);
                    DOMAnimations.classToggle(menuParent, "active");
                    DOMAnimations.slideToggle(menuList);
                } else {
                    DOMAnimations.classToggle(menuParent, "active");
                    DOMAnimations.slideToggle(menuList);
                }
            }
        });
        window.addEventListener("resize", function () {
            setTimeout(function () {
                if (window.innerWidth < 768) {
                    if (!menuParent.classList.contains("active")) {
                        hideallMenus(footerMenus, menu);
                    }
                } else {
                    DOMAnimations.slideDown(menuList);
                }
            }, 200);
        });
    });

    Array.from(document.querySelectorAll(".split-banner-content")).forEach((content) => {
        if (!content) return;
        const descHeight = content.querySelector(".split-banner-desc");
        if (descHeight) {
            const resizeObserver = new ResizeObserver(() => {
                UpdateSplitBannerdescHeight();
            });
            resizeObserver.observe(descHeight);
        }
    });


    Array.from(document.querySelectorAll(".yv-blog-card")).forEach((card) => {
        if (!card) return;
        button = card.querySelector(".button.secondary-button");
        if (button) {
            const resizeObserver = new ResizeObserver(() => {
                updateBlogbtnHeight();
            });
            resizeObserver.observe(button);
        }
    });

    const descElement = document.querySelector(".banner-collection-product-list");
    if (descElement) {
        const resizeObserver = new ResizeObserver(() => {
            updateBannerGridHeight();
        });
        resizeObserver.observe(descElement);
    }


    cookiesBanner();
    hamburgerInit();
    navigationMenu();
    initSearchPrompts();
    onloadEvents();
});

function onloadEvents() {
    initYouTubeIframe();
    viewcategoryInit();
    initBeforeAfter();
    productHoverSlider();
    productRecommendations();
    sliderFilter();
    closeDrawers();
    recentlyViewedProducts();
    productGiftOptions();
    lookbookScrollContent();
    if (gridPickupAvailabilityStatus) {
        gridPickUpAvailability();
    }
    initStoreLocator();
    productQueryForm();
    timelineNavInit();
    collectionHoverNavInit();
    newsletterSidebar();
    pdpCountdown();
    localizationElements();
    coloredCollection();
    startTimer();
    sideDrawerContentStoryInit();
}

if (document.querySelector(".fixed-overlay")) {
    const stickersOverlay = document.querySelector(".fixed-overlay");
    stickersOverlay.addEventListener("click", function (e) {
        resetTimer();
    });
    stickersOverlay.addEventListener("keydown", function (e) {
        resetTimer();
    });
}

document.addEventListener("scroll", (event) => {
    if (document.querySelector(".fixed-overlay")) {
        resetTimer();
    }
    closeVideoMedia();
    footerDropdownCheck();
    sideBarVisibility();
});

function sideBarVisibility() {
    let windowCenter = window.innerHeight;
    if (document.querySelector("[data-content-drawer-main]")) {
        if (window.scrollY > windowCenter) {
            document.querySelector("[data-content-drawer-main]").classList.add("expand");
        } else {
            document.querySelector("[data-content-drawer-main]").classList.remove("expand");
        }
    }
}

function footerDropdownCheck() {
    let windowCenter = window.innerHeight / 2;
    if (document.querySelector(".footer-dropdown")) {
        let elementScrollTop = document
            .querySelector(".footer-dropdown")
            .getBoundingClientRect().top;
        if (isOnScreen(document.querySelector(".footer-dropdown"))) {
            if (elementScrollTop < windowCenter) {
                document.querySelector(".footer-dropdown").classList.add("bottom");
            } else {
                document.querySelector(".footer-dropdown").classList.remove("bottom");
            }
        }
    }
}

var timer = null;
var svgTimer = null;
var svgCount = 200;
var svgs = [];
function generateRandomInteger(min, max) {
    return Math.floor(min + Math.random() * (max - min + 1));
}

function startTimer() {
    timer = setTimeout(() => {
        if (document.querySelector(".fixed-overlay")) {
            appendSVG();
        }
    }, stickersTimer);
}

function randomColorCode(numArr) {
    return numArr[Math.floor(Math.random() * numArr.length)];
}

function randomScale() {
    let scaleArr = ["1.0", "1.1", "1.2", "1.3", "1.4"];
    return scaleArr[Math.floor(Math.random() * scaleArr.length)];
}

function appendSVG() {
    if (svgs.length < svgCount) {
        randomSticker = stickers[Math.floor(Math.random() * stickers.length)];
        let parsedNode = new DOMParser().parseFromString(
            randomSticker,
            "text/html"
        );
        let parsedSticker = parsedNode.querySelector("svg");
        let stickerParent = document.createElement("div");
        let x = generateRandomInteger(0, 90);
        let y = generateRandomInteger(0, 90);
        let deg = generateRandomInteger(0, 360);
        let scale = randomScale();
        let randomColor;
        let randomBackground;
        do {
            randomColor = randomColorCode(randomTextColors);
            randomBackground = randomColorCode(randomBgColors);
        } while (randomColor === randomBackground);
        stickerParent.classList.add(
            `sticker`,
            `color-${randomColor}`,
            `background-${randomBackground}`
        );
        stickerParent.style.cssText = `top:${x}vh; left:${y}vw; rotate:${deg}deg; scale:${scale}`;
        stickerParent.appendChild(parsedSticker);
        document.querySelector(".fixed-overlay").appendChild(stickerParent);
        svgTimer = setTimeout(appendSVG, 1000); // 1 second delay
        svgs.push(stickerParent);
    }
}

function resetTimer() {
    if (document.querySelector(".fixed-overlay")) {
        document.querySelector(".fixed-overlay").innerHTML = "";
    }
    clearTimeout(timer);
    clearTimeout(svgTimer);
    startTimer();
}

function reelPlay(event) {
    event.preventDefault();
    let _target = event.target;
    if (_target.closest(".product-video-link")) {
        _target = _target.closest(".product-video-link");
    }
    let videoUrl = _target.getAttribute("data-src");
    let reelAspectRatio = _target.dataset.aspectRatio;
    let video = document.createElement("video");
    video.src = videoUrl;
    video.autoplay = true;
    video.playsInline = true;
    video.controls = true;
    video.loop = true;
    if (
        _target
            .closest("[products-reels-list]")
            .querySelector(".product-video-item.active")
    ) {
        _target
            .closest("[products-reels-list]")
            .querySelector(".product-video-item.active")
            .classList.remove("active");
        _target.parentElement.classList.add("active");
    } else {
        _target.parentElement.classList.add("active");
    }
    let reelPopup = document.querySelector("[data-reels-popup]");
    if (reelPopup) {
        if (reelPopup.querySelector(".image-wrapper")) {
            reelPopup.querySelector(".image-wrapper").style.paddingBottom =
                reelAspectRatio + "%";
            reelPopup.querySelector(".image-wrapper").innerHTML = "";
            reelPopup.querySelector(".image-wrapper").appendChild(video);
        }
        reelPopup.classList.add("video-popup-open");
        reelPopup.style.display = "flex";
    }
}

function reelClose(event) {
    event.preventDefault();
    let _target = event.target;
    let reelPopup = _target.closest("[data-reels-popup]");
    reelPopup.classList.remove("video-popup-open");
    reelPopup.style.display = "none";
    if (reelPopup.querySelector(".image-wrapper")) {
        reelPopup.querySelector(".image-wrapper").innerHTML = "";
    }
    if (document.querySelector(".product-video-item.active")) {
        document
            .querySelector(".product-video-item.active")
            .classList.remove("active");
    }
}

function coloredCollection(section = document) {
    let colorItems = section.querySelectorAll("[data-list-item]");
    Array.from(colorItems).forEach(function (colorItem) {
        colorItem.addEventListener("click", function (e) {
            e.preventDefault();
            if (colorItem.classList.contains("active")) return false;
            let targetIndex = colorItem.getAttribute("data-list-item");
            let closestWrapper = colorItem.closest("[data-coll-wrapper]");
            let activeElements = closestWrapper.querySelectorAll(".active");
            Array.from(activeElements).forEach(function (activeElement) {
                if (activeElement.classList.contains("color-collections-img-item")) {
                    activeElement.classList.add("previous");
                    setTimeout(() => {
                        activeElement.classList.add("hidden");
                        activeElement.classList.remove("active");
                        setTimeout(() => {
                            activeElement.classList.remove("previous");
                            activeElement.classList.remove("hidden");
                        }, 500);
                    }, 800);
                } else {
                    if (!activeElement.classList.contains("color-collections-color-item")) {
                        activeElement.classList.add("hidden");
                    }
                    activeElement.classList.remove("active");
                }
            });
            colorItem.classList.add("active");
            closestWrapper
                .querySelector(`.img-item-${targetIndex}`)
                .classList.add("active");
            closestWrapper
                .querySelector(`[data-grid-id="${targetIndex}"]`)
                .classList.add("active");
            closestWrapper
                .querySelector(`[data-grid-id="${targetIndex}"]`)
                .classList.remove("hidden");
        });
    });
}


class DeferredMedia extends HTMLElement {
    constructor() {
        super();
        if (this.classList.contains("autoplay-status-false")) {
            const loadBtn = this.closest(".shopify-section").querySelector(".video-play-btn");
            loadBtn.addEventListener("click", this.loadContent.bind(this));
        } else {
            this.addObserver();
        }
        const img = this.querySelector('video img'); // Select the image inside deferred-media
        if (img) {
            img.alt = "Video preview image"; // Set alt text dynamically
        }

            if (this.hasAttribute("data-id") && 
            (this.getAttribute("data-id") === "media-grid-autodisable" || 
            this.getAttribute("data-id") === "tabbed-collage-autodisable")) {
            const video = this.querySelector('video');
            const playButton = this.querySelector('.video-play-btn');

            // Function to handle video play
            const playVideo = (event) => {
                event.preventDefault();
                event.stopPropagation();
                if (video.readyState >= 3) {
                    video.muted = false; // Unmute the video
                    video.play();
                    if (playButton) { 
                        playButton.style.display = 'none'; // Hide button
                    }
                } else {
                    console.log('Video is not ready yet');
                }
            };

            // Add both click and touchstart events for iOS compatibility
            this.addEventListener('click', playVideo);
            this.addEventListener('touchstart', playVideo, { passive: false });
            }

    }

    addObserver() {
        if ("IntersectionObserver" in window === false) return;
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        this.loadContent();
                        observer.unobserve(this);
                    }
                });
            }, { rootMargin: "0px 0px 1000px 0px" }
        );
        observer.observe(this);
    }

    loadContent() {
        if (!this.querySelector("template")) return false;
        if (this.parentElement.classList.contains("yv-parallax")) {
            this.style.position = "absolute";
            this.parentElement.style.position = "fixed";
        }
        if (this.parentElement.classList.contains("yv-feature-videobox")) {
            this.parentElement.style.position = "absolute";
        }
        const template = this.querySelector("template");
        if (template) {
            const content = template.content.cloneNode(true);
            this.appendChild(content);
        }
        if (this.dataset.type == "youtube") {
            initYouTubeIframe(this.closest(".shopify-section"));
        }
        if (
            this.querySelector("video") &&
            this.querySelector("video").hasAttribute("autoplay")
        ) {
            this.querySelector("video").play();
        }
        const slider_selector = this.closest(".shopify-section");
        if (slider_selector != null) {
            Array.from(
                this.closest(".shopify-section").querySelectorAll(
                    "[data-flickity-slider]"
                )
            ).forEach(function (sliderSelector) {
                let slider = Flickity.data(sliderSelector);
                if (slider) slider.resize();
            });
        }
    }
}
customElements.define("deferred-media", DeferredMedia);

class CategoryMegamenu extends HTMLElement{
    constructor() {
        super();
    }
    connectedCallback() {
        this.tabs = this.querySelectorAll('[data-collection-tab]');
        this.contents = this.querySelectorAll('[data-collection-tab-content]');

        this.tabs.forEach(tab => {
            // tab.addEventListener('mouseenter', () => {
            //     this.switchTab(tab);
            // });

            // Optional click support (mobile)
            tab.addEventListener('click', () => {
                this.switchTab(tab);
            });
        });
    }

      switchTab(activeTab) {
        const tabId = activeTab.dataset.collectionTab;
        // Remove active from all tabs
        this.tabs.forEach(tab => tab.classList.remove('active'));

        // Hide all content
        this.contents.forEach(content => {
        content.classList.remove('active');
        });

        // Activate current tab
        activeTab.classList.add('active');

        // Show matching content
        const activeContent = this.querySelector(`#${tabId}`);

        if (activeContent) {
        activeContent.classList.add('active');
        }
    }
}
customElements.define("category-megamenu", CategoryMegamenu);

class QuickAddClose extends HTMLElement {
    constructor() {
        super();
        this.parent = this.closest(".quick-add-popup");
        this.body = this.parent.querySelector("[quick-add-body]");
        this.addEventListener("click", this.hideContent.bind(this));
    }
    hideContent() {
        if (this.body) {
            document.body.classList.remove("quick-add-popup-open");
            this.parent.classList.remove("show");
            this.body.innerHTML = "";
        }
    } 
}
customElements.define("quick-add-close", QuickAddClose);

class QuickAddToggle extends HTMLElement {
    constructor() {
        super();
        this.popup = document.querySelector(".quick-add-popup");
        this.popBody = document.querySelector("[quick-add-body]");
        this.addEventListener("click", this.showContent.bind(this));
    }

    showContent() {
        if (this.popup && this.popBody) {
            const content = this.querySelector("template").content.cloneNode(true);
            this.popBody.appendChild(content);
            document.body.classList.add("quick-add-popup-open");
            this.popup.classList.add("show");
            if (Shopify.PaymentButton) {
                Shopify.PaymentButton.init();
            }
            // productVariants(this.popup);
        }
    }
}
customElements.define("quick-add-toggle", QuickAddToggle);

class TestimonialVideoTrigger extends HTMLElement {
    constructor() {
        super();
        this.parent = this.closest("[data-testimonial-wrapper]");
        this.popVideoWrapper;
        this.video;
        this.addEventListener("click", this.showContent.bind(this));
    }

    showContent() {
        this.url = this.dataset.url;
        new Fancybox(
            // Array containing gallery items
            [
                // Gallery item
                {
                    src: this.url,
                },
            ],
            // Gallery options
            {
                hideScrollbar: true,
                mainClass: "testimonial-video-popup-box",
                closebutton: false,
                Toolbar: {
                    display: {
                        right: ["close"],
                    },
                },
            }
        );
    }
}
customElements.define("testimonial-video-trigger", TestimonialVideoTrigger);

class CounterText extends HTMLElement {
    constructor() {
        super();
        this.addObserver();
    }

    addObserver() {
        if ("IntersectionObserver" in window === false) return;
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        this.loadContent();
                        observer.unobserve(this);
                    }
                });
            }, { rootMargin: "0px 0px -300px 0px" }
        );
        observer.observe(this);
    }

    loadContent() {
        let $el = $(this);
        $({ Counter: 0 }).animate({ Counter: $el.data("counter") }, {
            duration: 2000,
            easing: "swing",
            step: function () {
                $el.text(Math.ceil(this.Counter));
            },
            complete: function () {
                $el.text($el.data("counter"));
            },
        });
    }
}
customElements.define("counter-text", CounterText);

class ScrollObserver {
    constructor() {
        this.handleScroll = this.handleScroll.bind(this);
        window.addEventListener("scroll", this.handleScroll);
    }

    handleScroll() {
        document.querySelectorAll("section").forEach((section) => {
            if (isOnScreen(section)) {
                if (section.classList.contains("section-in-view")) return false;
                section.classList.add("section-in-view");
                if (section.querySelector("[data-icon]")) {
                    _iconsAnimations(section);
                }
            } else {
                section.classList.remove("section-in-view");
            }
        });
    }
}
new ScrollObserver();

function _iconsAnimations(section) {
    let iconName = section.querySelector("[data-icon]").getAttribute("data-icon");
    if (iconName == "arrow") {
        section.querySelectorAll(".arrow-path")[0].classList.add("animated-path", "delay-2");
        setTimeout(() => {
            section.querySelectorAll(".arrow-path")[1].classList.add("animated-path", "delay-12");
        }, 1500);
    }
    if (iconName == "line-arrow") {
        section.querySelectorAll(".line-arrow-path")[0].classList.add("animated-path", "delay-2");
        setTimeout(() => {
            section.querySelectorAll(".line-arrow-path")[1].classList.add("animated-path", "delay-6");
        }, 1000);
    }
    if (iconName == "heart") {
        section.querySelectorAll(".heart-path")[0].classList.add("animated-path", "delay-2");
        setTimeout(() => {
            section.querySelectorAll(".heart-path")[1].classList.add("animated-path", "delay-6");
            section.querySelectorAll(".heart-path")[2].classList.add("animated-path", "delay-6");
        }, 1500);
    }
    if (iconName == "star") {
        section.querySelectorAll(".star-path")[0].classList.add("animated-path", "delay-2");
    }
    if (iconName == "snail") {
        section.querySelectorAll(".snail-path")[0].classList.add("animated-path", "delay-2");
        setTimeout(() => {
            section.querySelectorAll(".snail-path")[1].classList.add("animated-path", "delay-2");
        }, 1400);
    }
    if (iconName == "sparkle") {
        section.querySelectorAll(".sparkle-path")[0].classList.add("animated-path", "delay-2");
        setTimeout(() => {
            section.querySelectorAll(".sparkle-path").forEach((sparkleitem, index) => {
                if (index != 0) {
                    sparkleitem.classList.add("animated-path", "delay-6");
                }
            });
        }, 1100);
    }
}

class showMoreContent extends HTMLElement {
    constructor() {
        super();
        if (this.previousElementSibling && this.previousElementSibling.classList.contains('yv-collection-description')) {
            if (this.previousElementSibling.scrollHeight > this.previousElementSibling.clientHeight) {
                this.classList.remove('hidden');
                this.addEventListener("click", this.toggleContent.bind(this));
            } else {
                this.previousElementSibling.classList.remove('short-description')
            }
        }
    }
    toggleContent() {
        if (this.classList.contains('more')) {
            this.classList.remove('more');
            this.textContent = showLessText;
            this.previousElementSibling.style.height = this.previousElementSibling.scrollHeight + "px";
            this.previousElementSibling.style.setProperty('--before-background', 'none')
        } else {
            this.classList.add('more');
            this.textContent = showMoreText;
            this.previousElementSibling.style.removeProperty('height');
            this.previousElementSibling.style.removeProperty('--before-background');
        }
    }
}
customElements.define("show-content", showMoreContent);

class SpotButton extends HTMLElement {
    constructor() {
        super();
        this.section = this.closest('.shopify-section');
        this.blockId = this.dataset.blockId;
        this.addEventListener("click", this.showContent.bind(this));
    }

    showContent() {
        if (this.classList.contains('active')) return;
        if (this.section.querySelector('spot-button.active')) {
            this.section.querySelector('spot-button.active').classList.remove('active');
        }
        if (this.section.querySelector('.yv-spotlight-item-video-item.active')) {
            this.section.querySelector('.yv-spotlight-item-video-item.active').classList.add('hidden');
            this.section.querySelector('.yv-spotlight-item-video-item.active').classList.remove('active');
        }
        if (this.section.querySelector('.yv-spotlight-item-hotspot-content.active')) {
            this.section.querySelector('.yv-spotlight-item-hotspot-content.active').classList.add('hidden');
            this.section.querySelector('.yv-spotlight-item-hotspot-content.active').classList.remove('active');
        }
        if (this.section.querySelector(`#video-${this.blockId}`)) {
            this.section.querySelector(`#video-${this.blockId}`).classList.remove(`hidden`);
            this.section.querySelector(`#video-${this.blockId}`).classList.add(`active`);
        }
        if (this.section.querySelector(`#content-${this.blockId}`)) {
            this.section.querySelector(`#content-${this.blockId}`).classList.remove(`hidden`);
            this.section.querySelector(`#content-${this.blockId}`).classList.add(`active`);
        }
    }
}
customElements.define("spot-button", SpotButton);

class RotatingText extends HTMLElement {
    constructor() {
      super();
        this.isVisible = false;
        this.observer = null;      
        this.items = [];
        this.index = 0;
        this.interval = null;
        this.itemHeights = [];
        this.cumulativeOffsets = [];
        // keep these configurable if you want later
        this.duration = 2500;
    }
  
    calculateHeights() {
        const wrapper = this.querySelector('.section-heading-rotator-wrapper');
        if (!wrapper) return;
      
        this.itemHeights = [];
        this.cumulativeOffsets = [0];
      
        this.items.forEach((item, index) => {
          const rect = item.getBoundingClientRect();
      
          this.itemHeights.push(rect.height);
      
          if (index > 0) {
            const prevOffset = this.cumulativeOffsets[index - 1];
            const prevHeight = this.itemHeights[index - 1];
            this.cumulativeOffsets.push(prevOffset + prevHeight);
          }
        });
    }

    resetAndRestart() {
        this.index = 0;
      
        const wrapper = this.querySelector('.section-heading-rotator-wrapper');
        if (wrapper) {
          wrapper.style.transform = `translateY(0px)`;
        }
      
        if (this.isVisible) {
          this.start();
        }
    }
      
      
    connectedCallback() {
        // Reduced motion = no animation, no drama
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        this.items = this.querySelectorAll('.section-heading-rotator-item');
        if (this.items.length <= 1) return;

        this.calculateHeights();

        const resizeObserver = new ResizeObserver(() => {
            this.calculateHeights();
            this.resetAndRestart();
        });
          
        resizeObserver.observe(this);
        // this.style.willChange = 'transform';
        this.observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        if (!this.isVisible) {
                            this.isVisible = true;
                            this.start();
                        }
                    } else {
                        this.isVisible = false;
                        this.stop();
                    }
                });
            },
            {
                root: null,        // viewport
                threshold: 0.1     // 10% visible is enough
            }
        );
        this.observer.observe(this);
    }
  
    disconnectedCallback() {
        this.stop();
        if (this.observer) {
          this.observer.disconnect();
          this.observer = null;
        }
    }
      
    start() {
        this.stop(); // safety first
    
        this.interval = setInterval(() => {
            this.index = (this.index + 1) % this.items.length;
            const wrapper = this.querySelector('.section-heading-rotator-wrapper');
            if (wrapper && this.cumulativeOffsets[this.index] !== undefined) {
            wrapper.style.transform = `translateY(-${this.cumulativeOffsets[this.index]}px)`;
            }
        }, this.duration);
    }
  
    stop() {
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }
    }
}
  
customElements.define('rotating-text', RotatingText);


  class BundleProducts extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.initTabs();
      const firstActiveTab = this.querySelector('[data-tab-content].active');
      if (firstActiveTab) {
        setTimeout(() => {
          this.resizeSliderInTab(firstActiveTab);
        }, 200);
      }
    }

    initTabs() {
      const tabTriggers = this.querySelectorAll('[data-tab-trigger]');
      const tabContents = this.querySelectorAll('[data-tab-content]');

      if (!tabTriggers.length || !tabContents.length) return;

      tabTriggers.forEach((trigger) => {
        trigger.addEventListener('click', () => {
          const tabId = trigger.getAttribute('data-tab-id');

          tabTriggers.forEach((t) => t.classList.remove('active'));
          tabContents.forEach((c) => c.classList.remove('active'));

          trigger.classList.add('active');

          const activeContent = this.querySelector(`[data-tab-content="${tabId}"]`);

          if (activeContent) {
            activeContent.classList.add('active');
            this.resizeSliderInTab(activeContent);
          }
        });
      });
    }

    resizeSliderInTab(tabContent) {
      const slider = tabContent.querySelector('[data-flickity-slider]');

      if (slider) {
        setTimeout(() => {
          const $slider = jQuery(slider);

          if ($slider.hasClass('flickity-enabled')) {
            $slider.flickity('resize');
          } else {
            if (typeof flickitySlider === 'function') {
              flickitySlider($slider);
            }
          }
        }, 100);
      }
    }
  }
  customElements.define('bundle-products', BundleProducts);


class bundleProductsItem extends HTMLElement {
  constructor() {
    super();
    this.bundleProductLimit = 0;
    this.selectedProducts = [];
  }

  connectedCallback() {
    this.bundleProductLimit = Number(this.dataset.pairCount) || 0;

    this.bundleSelectProductImages = this.querySelector('[data-selected-bundle]');
    this.bundleAddedProductsCard = this.querySelector('[data-bundle-added-products-card]');
    if(!this.bundleAddedProductsCard) return;
    this.popup = this.querySelector('[data-bundle-popup]');
    this.popupCloseTrigger = this.querySelector('[data-popup-close]');
    this.popupTrigger = this.querySelector('[data-view-bundle]');
    this.bundleMainAddtocart = this.querySelector('[data-bundle-main-addtocart]');


    this.initEvents();
    this.renderSelectedSlots();
    this.updateDisabledState();
    this.updatePopupTriggerState();
    this.updateBundlePrice();
  } 

  initEvents() {
    if (this.popupTrigger && this.popup) {
      this.popupTrigger.addEventListener('click', () => {
        if (this.isLimitReached()) {
          this.popup.classList.add('show');
        }
      });
      this.popupCloseTrigger.addEventListener('click', () => {
          this.popup.classList.remove('show');
      });
      this.popup.addEventListener('click', (e) => {
        if (e.target.closest('[data-bundle-popup-content]')) return;

        this.popup.classList.remove('show');
    });
    }

    this.addEventListener('click', (e) => {
      const productCard = e.target.closest('bundle-product-add');
      if (!productCard || !this.contains(productCard)) return;

      if (productCard.classList.contains('disabled')) return;

      const productId = productCard.dataset.productId;

      if (productCard.classList.contains('added')) {
        productCard.classList.remove('added');
        this.removeProduct(productId);
      } else {
        productCard.classList.add('added');
        this.addProduct(productId);
      }

      this.updateDisabledState();
      this.updatePopupTriggerState();
    });

    this.addEventListener('click', (e) => {
      const productRemove = e.target.closest('[data-bundle-remove]');
      if (!productRemove || !this.contains(productRemove)) return;
      const productId = productRemove.dataset.id;
      this.removeProduct(productId);
      this.updateDisabledState();
      this.updatePopupTriggerState();
    });
    
    this.addEventListener('change', (e) => {
       const productVariantChange = e.target.closest('select');
       if (!productVariantChange) return;
       this.updateBundlePrice();
    });

  }

  addProduct(productId) {
    if (
      this.selectedProducts.includes(productId) ||
      this.selectedProducts.length >= this.bundleProductLimit
    ) return;

    this.selectedProducts.push(productId);
    this.renderSelectedSlots();
  }

  removeProduct(productId) {
    this.selectedProducts = this.selectedProducts.filter(
      (id) => id !== productId
    );

    const allCards = this.querySelectorAll('bundle-product-add');
    allCards.forEach((card) => {
      if (card.dataset.productId === productId) {
        card.classList.remove('added');
      }
    });

    this.renderSelectedSlots();
  }

  getAddedCount() {
    return this.selectedProducts.length;
  }

  isLimitReached() {
    return this.getAddedCount() === this.bundleProductLimit;
  }

  updateDisabledState() {
    const allCards = this.querySelectorAll('bundle-product-add');

    allCards.forEach((card) => {
      const id = card.dataset.productId;

      if (this.selectedProducts.includes(id)) {
        card.classList.remove('disabled');
        return;
      }

      if (this.isLimitReached()) {
        card.classList.add('disabled');
      } else {
        card.classList.remove('disabled');
      }
    });
  }


  updatePopupTriggerState() {
    if (!this.popupTrigger) return;

    if (this.isLimitReached()) {
      this.popupTrigger.classList.remove('disabled');
      if(this.bundleMainAddtocart){
        this.bundleMainAddtocart.disabled = false;
      } 
    } else {
      this.popupTrigger.classList.add('disabled');
      if(this.bundleMainAddtocart){
        this.bundleMainAddtocart.disabled = true;
      }
    }
  }

  updateBundlePrice(){
      let BundleTotalPrice = 0;
      const allVarinatSelect = this.querySelectorAll('bundle-variants');
      allVarinatSelect.forEach((variantSelect) => {
        const selectBox = variantSelect.querySelector('select');
          if (!selectBox) return;
          const selectedOption = selectBox.selectedOptions[0]; 

          if (selectedOption) {
            const price = Number(selectedOption.dataset.price);
            BundleTotalPrice += price;

            const bundleCardInfo = variantSelect.closest('[data-bundle-card-info]');
            if(bundleCardInfo){
                const PriceWrapper =  bundleCardInfo.querySelector('[data-price-wrapper]');
                if(PriceWrapper){
                    const PriceWrapperSpan =  PriceWrapper.querySelector('span');
                    PriceWrapperSpan.innerHTML = Shopify.formatMoney(price, moneyFormat);
                }
            }
          }
      });
      const BundlePriceButtons = this.querySelectorAll('[total-item-bundle-amount-btn]');
      BundlePriceButtons.forEach((button)=>{
       button.innerHTML = Shopify.formatMoney(BundleTotalPrice, moneyFormat);
      })
  }

  renderSelectedSlots() {
    if (!this.bundleSelectProductImages) return;

    const popupSlots = this.bundleAddedProductsCard.querySelectorAll(
      '[data-bundle-added-product-card]'
    );

    const slots = this.bundleSelectProductImages.querySelectorAll(
      '[data-selected-bundle-item]'
    );

    slots.forEach((slot, index) => {
      slot.innerHTML = '';

      const productId = this.selectedProducts[index];

      if (!productId) {
        slot.innerHTML = this.productImageSkelton();
        return;
      }

      const productCard = this.querySelector(
        `bundle-product-add[data-product-id="${productId}"]`
      );
      if (!productCard) return;

      const imageTemplate = productCard.querySelector('[data-bundle-image]');
      if (!imageTemplate) return;

      const imgClone = imageTemplate.content.cloneNode(true);
      slot.dataset.productId = productId;
      slot.replaceChildren(imgClone);
    });

    popupSlots.forEach((slot, index) => {
      slot.innerHTML = '';

      const productId = this.selectedProducts[index];

      if (!productId) {
          slot.replaceChildren(this.popupProductSkelton());
        return;
      }

      const productCard = this.querySelector(
        `bundle-product-add[data-product-id="${productId}"]`
      );
      if (!productCard) return;

      const cardTemplate = productCard.querySelector('[data-bundle-card]');
      if (!cardTemplate) return;

      const cardClone = cardTemplate.content.cloneNode(true);
      slot.dataset.productId = productId;
      slot.replaceChildren(cardClone);
    });

    this.updateBundlePrice();
  }
 
  productImageSkelton() {
    return `<svg width="17" height="16" viewBox="0 0 17 16" fill="none">
<g opacity="0.2">
<path d="M16.5896 11.3677L14.0473 5.42222C13.5844 4.33385 12.894 3.71656 12.1061 3.67595C11.3264 3.63534 10.571 4.17952 9.99436 5.21917L8.45113 7.98887C8.12625 8.57367 7.66328 8.92293 7.1597 8.96354C6.64798 9.01227 6.13628 8.74424 5.72204 8.21629L5.54335 7.98887C4.96668 7.26599 4.25192 6.91674 3.52092 6.98984C2.78992 7.06294 2.16451 7.56652 1.75028 8.38686L0.345132 11.189C-0.158446 12.2043 -0.109713 13.382 0.48321 14.3404C1.07613 15.2989 2.10765 15.8755 3.23664 15.8755H13.6006C14.689 15.8755 15.7043 15.3314 16.3053 14.4217C16.9226 13.512 17.0201 12.3667 16.5896 11.3677Z" fill="black"/>
<path d="M5.58485 4.58667C6.85144 4.58667 7.87817 3.55991 7.87817 2.29333C7.87817 1.02676 6.85144 0 5.58485 0C4.31827 0 3.2915 1.02676 3.2915 2.29333C3.2915 3.55991 4.31827 4.58667 5.58485 4.58667Z" fill="black"/>
</g>
</svg>`;
   }

   popupProductSkelton(){
     const cardSeklton = this.querySelector('[data-popup-skelton]');
     const cardClone = cardSeklton.content.cloneNode(true);
     return cardClone;
   }
}

customElements.define('bundle-products-item', bundleProductsItem);



class CopyToClipboard extends HTMLElement {
    constructor() {
      super();
      this.button = this.querySelector('button');
      this.copyId = this.button.dataset.id; // Get the `data-id` attribute value
      this.copiedText = this.button.dataset.copied || 'Copied!'; // Text to show when copied
      this.init();
    }
   
    init() {
      this.button.addEventListener('click', this.handleCopy.bind(this));
    }
   
    async handleCopy() {
      if (!this.copyId) {
        console.error('No data-id found to copy!');
        return;
      }
   
      try {
        // Attempt to use the Clipboard API
        await navigator.clipboard.writeText(this.copyId);
        this.showCopiedMessage();
      } catch (error) {
        // Fallback to execCommand if Clipboard API fails
        console.warn('Clipboard API failed, falling back to execCommand:', error);
        this.fallbackCopy();
      }
    }
   
    fallbackCopy() {
      const tempInput = document.createElement('input');
      tempInput.value = this.copyId;
      tempInput.style.position = 'absolute';
      tempInput.style.left = '-9999px';
      document.body.appendChild(tempInput);
   
      tempInput.select();
      document.execCommand('copy'); // Deprecated but used as a fallback
      document.body.removeChild(tempInput);
   
      this.showCopiedMessage();
    }
   
    showCopiedMessage() {
      const copiedMessage = document.createElement('div');
      copiedMessage.textContent = this.copiedText;
      copiedMessage.className = 'copied-message';
      copiedMessage.style.opacity = '0';
   
      this.button.closest('[data-clipboard-wrapper]').appendChild(copiedMessage);
   
      setTimeout(() => {
        copiedMessage.style.opacity = '1';
      }, 0);
   
      setTimeout(() => {
        copiedMessage.style.opacity = '0';
        copiedMessage.addEventListener('transitionend', () => {
          // this.closest('[data-clipboard-wrapper]').removeChild(copiedMessage);
        });
      }, 2000);
    }
  }
   
  customElements.define('copy-to-clipboard', CopyToClipboard);