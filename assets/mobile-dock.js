if (!customElements.get('mobile-dock')) {
  customElements.define(
    'mobile-dock',
    class MobileDock extends HTMLElement {
      constructor() {
        super();
        this.init();
      }
    
      get section() {
        return this._section = this._section || this.closest('.mobile-dock-section');
      }
    
      init() {
        if (this.initialized) return;
        this.initialized = true;
        this.setAttribute('loaded', '');
    
        this.footer = null;
        this.detectForHeader();
        this.detectForFooter();
        this.initMenuClick();
        setTimeout(this.setHeight.bind(this));
        document.addEventListener('matchSmall', this.setHeight.bind(this));
    
        if (Shopify.designMode) {
          this.section.addEventListener('shopify:section:select', () => {
            this.section.classList.add('shopify-active');
          });
          this.section.addEventListener('shopify:section:deselect', () => {
            this.section.classList.remove('shopify-active');
          });
        }
      }
    
      initMenuClick() {
        // Menu button - trigger header menu
        const menuButton = this.querySelector('[aria-controls="MenuDrawer"]');
        if (menuButton) {
          menuButton.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Check if sticky header is enabled and style is on_scroll_up
            const header = document.querySelector('header');
            const headerSection = document.querySelector('.shopify-section-main-header');
            
            if (header && headerSection) {
              const isSticky = header.getAttribute('data-header-sticky') === 'true';
              const stickyStyle = header.getAttribute('data-header-sticky-style');
              
              // Only handle on_scroll_up case when sticky is enabled
              if (isSticky && stickyStyle === 'on_scroll_up') {
                // Check if header is hidden with sticky-header-hidden-parent class
                if (headerSection.classList.contains('sticky-header-hidden-parent')) {
                  // Temporarily remove the class to show header
                  headerSection.classList.remove('sticky-header-hidden-parent');
                  
                  // Also remove sticky-header-hidden from header if present
                  if (header.classList.contains('sticky-header-hidden')) {
                    header.classList.remove('sticky-header-hidden');
                  }
                  
                  // Wait for header animation to complete (header transition is 0.8s)
                  // Using 400ms delay to ensure header is fully visible before clicking
                  setTimeout(() => {
                    const headerMenuButton = document.querySelector('.navbar-toggler, .yv-mobile-category, .hamburger, a.navbar-toggler, div.navbar-toggler');
                    if (headerMenuButton) {
                      headerMenuButton.click();
                    }
                  }, 1000);
                  
                  return;
                }
              }
            }
            
            // Default behavior for other cases
            const headerMenuButton = document.querySelector('.navbar-toggler, .yv-mobile-category, .hamburger, a.navbar-toggler, div.navbar-toggler');
            if (headerMenuButton) {
              headerMenuButton.click();
            }
          });
        }
        
        // Cart button - trigger cart drawer
        const cartButton = this.querySelector('[aria-controls="CartDrawer"]');
        if (cartButton) {
          if (cartButton.getAttribute('data-has-cartdrawer') === 'true') {
            cartButton.addEventListener('click', (e) => {
              e.preventDefault();
              const headerCartButton = document.querySelector('.openCartDrawer');
              if (headerCartButton) {
                headerCartButton.click();
              }
            });
          }
        }
        
        // Search button - trigger search drawer
        const searchButton = this.querySelector('[aria-controls="SearchDrawer"]');
        if (searchButton) {
          searchButton.addEventListener('click', (e) => {
            e.preventDefault();
            const headerSearchButton = document.querySelector('.search-form');
            if (headerSearchButton) {
              headerSearchButton.click();
            }
          });
        }
      }
    
      detectForHeader() {
        const header = document.querySelector('header');
        if (header === null) {
          this.section.classList.add('active');
          return;
        }
        
        const headerSection = document.querySelector('.shopify-section-main-header');
        if (headerSection === null) {
          this.section.classList.add('active');
          return;
        }
        
        const isSticky = header.getAttribute('data-header-sticky') === 'true';
        const stickyStyle = header.getAttribute('data-header-sticky-style');
        
        // Handle sticky header behavior for mobile dock
        if (isSticky && (stickyStyle === 'on_scroll_up' || stickyStyle === 'always')) {
          this.stickyStyle = stickyStyle;
          this.header = header;
          this.lastScrollY = window.scrollY;
          this.scrollTicking = false;
          
          // Calculate scrollHeight same as header does
          this.calculateScrollHeight();
          
          this.scrollHandler = () => {
            if (!this.scrollTicking) {
              window.requestAnimationFrame(() => {
                this.onScrollForStickyHeader();
                this.scrollTicking = false;
              });
              this.scrollTicking = true;
            }
          };
          
          window.addEventListener('scroll', this.scrollHandler, { passive: true });
          window.addEventListener('resize', () => {
            this.calculateScrollHeight();
          });
        } else {
          // Default behavior for non-sticky headers or when sticky is disabled
          this.lastScrollY = window.scrollY;
          this.scrollTicking = false;
          
          this.scrollHandler = () => {
            if (!this.scrollTicking) {
              window.requestAnimationFrame(() => {
                this.onScrollDefault();
                this.scrollTicking = false;
              });
              this.scrollTicking = true;
            }
          };
          
          window.addEventListener('scroll', this.scrollHandler, { passive: true });
        }
      }
    
      calculateScrollHeight() {
        let scrollHeight = 0;
        const announcementBar = document.querySelector('.announcement-bar-section');
        if (announcementBar) {
          scrollHeight += announcementBar.offsetHeight || 0;
        }
        const headerSection = document.querySelector('.shopify-section-main-header');
        if (headerSection) {
          scrollHeight += headerSection.offsetHeight || 0;
        }
        this.headerScrollHeight = scrollHeight;
      }
    
      onScrollForStickyHeader() {
        // Check if mobile view (768px breakpoint)
        const isMobile = window.innerWidth < 768;
        
        if (!isMobile || !this.header) return;
        
        // Check if footer is visible - if yes, hide dock
        if (this.isFooterVisible()) {
          this.classList.remove('dock-active');
          return;
        }
        
        const currentScrollY = window.scrollY;
        const scrollHeight = this.headerScrollHeight || 0;
        const isScrollingDown = currentScrollY > this.lastScrollY;
        const isScrollingUp = currentScrollY < this.lastScrollY;
        
        if (this.stickyStyle === 'on_scroll_up') {
          // Check header's actual state: header hidden → dock show, header visible → dock hide
          if (currentScrollY > scrollHeight) {
            const isHeaderHidden = this.header.classList.contains('sticky-header-hidden');
            // Header hidden → dock show, header visible → dock hide
            this.classList.toggle('dock-active', isHeaderHidden);
          } else {
            // Below threshold → header always show → dock hide
            this.classList.remove('dock-active');
          }
        } else if (this.stickyStyle === 'always') {
          // Scrolling down → dock show, scrolling up → dock hide
          if (isScrollingDown && currentScrollY > 0) {
            this.classList.add('dock-active');
          } else if (isScrollingUp) {
            this.classList.remove('dock-active');
          }
        }
        
        this.lastScrollY = currentScrollY;
      }
    
      onScrollDefault() {
        // Check if mobile view (768px breakpoint)
        const isMobile = window.innerWidth < 768;
        if (!isMobile) return;
        
        // Check if footer is visible - if yes, hide dock
        if (this.isFooterVisible()) {
          this.classList.remove('dock-active');
          return;
        }
        
        const currentScrollY = window.scrollY;
        const isScrollingDown = currentScrollY > this.lastScrollY;
        const isScrollingUp = currentScrollY < this.lastScrollY;
        
        // Default: scroll down → dock show, scroll up → dock hide
        if (isScrollingDown && currentScrollY > 0) {
          this.classList.add('dock-active');
        } else if (isScrollingUp) {
          this.classList.remove('dock-active');
        }
        
        this.lastScrollY = currentScrollY;
      }
    
      detectForFooter() {
        const footer = document.querySelector('.footer-section');
        if (footer !== null) {
          this.footer = footer;
        }
      }
    
      isFooterVisible() {
        if (!this.footer || window.innerWidth >= 768) return false;
        const footerRect = this.footer.getBoundingClientRect();
        return footerRect.top < window.innerHeight;
      }
    
      setHeight() {
        document.documentElement.style.setProperty('--mobile-dock-height', `${this.getBoundingClientRect().height.toFixed(1)}px`);
      }
    }
  );
}