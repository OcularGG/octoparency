document.addEventListener('DOMContentLoaded', () => {
    // Simplified logo transition logic
    const logo = document.querySelector('.logo');
    const logos = [
        '/assets/ocular-logos/logo1.png',
        '/assets/ocular-logos/logo2.png',
        '/assets/ocular-logos/logo3.png',
        '/assets/ocular-logos/logo4.png',
        '/assets/ocular-logos/logo5.png',
        '/assets/ocular-logos/logo6.png',
        '/assets/ocular-logos/logo7.png',
        '/assets/ocular-logos/logo8.png',
        '/assets/ocular-logos/logo9.png'
    ];
    let currentLogoIndex = 0;
    
    // Preload all images for smoother transitions
    const preloadImages = () => {
        logos.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    };
    preloadImages();
    
    // Remove any existing clones
    const existingClone = document.querySelector('.logo-clone');
    if (existingClone) {
        existingClone.parentNode.removeChild(existingClone);
    }
    
    // Fix logo positioning
    const style = document.createElement('style');
    style.textContent = `
        .logo-container {
            position: relative;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .logo {
            transition: opacity 1.5s ease-in-out;
            position: static;
            width: 100px;
        }
    `;
    document.head.appendChild(style);
    
    // Clean, simple crossfade transition
    const transitionLogos = () => {
        // Create temporary container for new image
        const tempImg = new Image();
        tempImg.src = logos[(currentLogoIndex + 1) % logos.length];
        
        // When new image is loaded, fade out the old one
        tempImg.onload = () => {
            // Start fade out
            logo.style.opacity = '0';
            
            // After fade completes, update src and fade in
            setTimeout(() => {
                currentLogoIndex = (currentLogoIndex + 1) % logos.length;
                logo.src = logos[currentLogoIndex];
                logo.style.opacity = '1';
            }, 1000);
        };
    };
    
    // Start transitions with a cinematic timing
    setInterval(transitionLogos, 4500);

    // Dark mode toggle - fixed potential duplicate listeners
    const themeToggleInput = document.getElementById('theme-toggle-input');
    const body = document.body; // Using this instance of body throughout
    
    // Check for saved theme preference or default to light
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        themeToggleInput.checked = true;
    }
    
    // Theme toggle functionality - single event listener
    themeToggleInput.addEventListener('change', () => {
        // Toggle dark mode class
        body.classList.toggle('dark-mode');
        
        // Save preference to localStorage
        const isDarkMode = body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    });

    // Login button functionality
    const loginButton = document.querySelector('.login-button');
    loginButton.addEventListener('click', () => {
        alert('Login functionality would be implemented here');
    });

    // Add event listeners to social buttons to ensure they're working
    document.querySelectorAll('.social-button a').forEach(button => {
        button.addEventListener('click', function(e) {
            // This will stop the button from doing anything if you just want to test
            // e.preventDefault();
            console.log('Button clicked:', this.getAttribute('aria-label'));
        });
    });

    // Check if user prefers dark mode - moved to be with other theme code
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches && !localStorage.getItem('theme')) {
        body.classList.add('dark-mode');
        themeToggleInput.checked = true;
        localStorage.setItem('theme', 'dark');
    }

    // Sidebar collapse functionality - fixed variable conflict
    const sidebarToggle = document.getElementById('sidebar-toggle');
    
    // Check for saved sidebar state - default to expanded if no preference saved
    const sidebarState = localStorage.getItem('sidebar-collapsed');
    
    // If localStorage value is null (first time visitor), set default to expanded
    if (sidebarState === null) {
        localStorage.setItem('sidebar-collapsed', 'false');
    }
    
    // Parse the state correctly
    let isCollapsed = sidebarState === 'true';

    // Apply the appropriate class based on the state
    if (isCollapsed) {
        body.classList.add('sidebar-collapsed');
    } else {
        body.classList.remove('sidebar-collapsed');
    }

    // Update icon for initial state
    updateToggleButtonIcon(isCollapsed);
    
    // Toggle sidebar
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            isCollapsed = !body.classList.contains('sidebar-collapsed'); // Toggle the boolean value
            body.classList.toggle('sidebar-collapsed');
            
            // Update the toggle button icon
            updateToggleButtonIcon(isCollapsed);
            
            // Save preference to localStorage
            localStorage.setItem('sidebar-collapsed', isCollapsed);
            
            // Force slideshow to update its layout with delay to allow transition
            if (slideshowManager && typeof slideshowManager.updateForSidebarToggle === 'function') {
                slideshowManager.updateForSidebarToggle();
            }
        });
    }

    // Update toggle button arrow direction based on sidebar state
    function updateToggleButtonIcon(isCollapsed) {
        const toggleBars = document.querySelectorAll('.toggle-icon-bar');
        
        if (toggleBars.length === 3) {
            if (isCollapsed) {
                // Right-pointing arrow when collapsed (points to hidden sidebar)
                toggleBars[0].style.transform = 'translateY(-6px) rotate(-45deg)';
                toggleBars[1].style.opacity = '1';
                toggleBars[1].style.transform = 'scaleX(0.75)';
                toggleBars[2].style.transform = 'translateY(6px) rotate(45deg)';
            } else {
                // Left-pointing arrow when expanded (points to content)
                toggleBars[0].style.transform = 'translateY(-6px) rotate(45deg)';
                toggleBars[1].style.opacity = '1';
                toggleBars[1].style.transform = 'scaleX(0.75)';
                toggleBars[2].style.transform = 'translateY(6px) rotate(-45deg)';
            }
        }
    }

    // ==========================================
    // COMPLETELY REWRITTEN SLIDESHOW CODE BELOW
    // ==========================================
    
    // Slideshow configuration
    const slideshowConfig = {
        containerSelector: '#slideshow-container',
        imageFolder: '/images/',
        slideImages: [
            { src: 'slide1.jpeg', caption: 'OCULAR' },
            { src: 'slide2.jpeg', caption: 'OCULAR' },
            { src: 'slide3.jpeg', caption: 'OCULAR' },
            { src: 'slide4.jpeg', caption: 'OCULAR' },
            { src: 'slide5.jpeg', caption: 'OCULAR' },
            { src: 'slide6.jpeg', caption: 'OCULAR' }
        ],
        autoplayInterval: 6000, // 6 seconds between slides
        transitionSpeed: 1500   // 1.5 seconds fade animation
    };
    
    // Initialize the slideshow
    const slideshowManager = (function() {
        // Private variables
        let currentSlideIndex = 0;
        let autoplayTimer;
        let slides = [];
        let dots = [];
        let container;
        
        // Create slideshow HTML structure
        function buildSlideshow() {
            container = document.querySelector(slideshowConfig.containerSelector);
            if (!container) {
                console.error('Slideshow container not found!');
                return;
            }
            
            // Clear the container
            container.innerHTML = '';
            
            // Create slides
            slideshowConfig.slideImages.forEach((image, index) => {
                // Create slide
                const slide = document.createElement('div');
                slide.className = 'slide fade';
                if (index === 0) slide.style.display = 'block'; // Show first slide
                
                // Create image
                const img = document.createElement('img');
                img.src = slideshowConfig.imageFolder + image.src;
                img.alt = `Slide ${index + 1}`;
                img.addEventListener('error', () => handleImageError(img, index));
                
                // Create caption
                const caption = document.createElement('div');
                caption.className = 'text';
                caption.textContent = image.caption;
                
                // Add to slide
                slide.appendChild(img);
                slide.appendChild(caption);
                container.appendChild(slide);
                slides.push(slide);
            });
            
            // Create navigation arrows
            const prevArrow = document.createElement('a');
            prevArrow.className = 'prev';
            prevArrow.innerHTML = '&#10094;';
            prevArrow.addEventListener('click', () => changeSlide(-1));
            
            const nextArrow = document.createElement('a');
            nextArrow.className = 'next';
            nextArrow.innerHTML = '&#10095;';
            nextArrow.addEventListener('click', () => changeSlide(1));
            
            container.appendChild(prevArrow);
            container.appendChild(nextArrow);
            
            // Create dot indicators
            const dotsContainer = document.createElement('div');
            dotsContainer.className = 'dots-container';
            
            slideshowConfig.slideImages.forEach((_, index) => {
                const dot = document.createElement('span');
                dot.className = index === 0 ? 'dot active' : 'dot';
                dot.addEventListener('click', () => goToSlide(index));
                dotsContainer.appendChild(dot);
                dots.push(dot);
            });
            
            container.appendChild(dotsContainer);
        }
        
        // Change slide by a relative number
        function changeSlide(n) {
            goToSlide(currentSlideIndex + n);
        }
        
        // Go to a specific slide
        function goToSlide(index) {
            // Reset autoplay timer
            if (autoplayTimer) {
                clearInterval(autoplayTimer);
                startAutoplay();
            }
            
            // Handle wrapping around
            if (index >= slides.length) index = 0;
            if (index < 0) index = slides.length - 1;
            
            // Hide all slides
            slides.forEach(slide => {
                slide.style.display = 'none';
            });
            
            // Remove active class from all dots
            dots.forEach(dot => {
                dot.className = dot.className.replace(' active', '');
            });
            
            // Show the current slide and activate the corresponding dot
            slides[index].style.display = 'block';
            dots[index].className += ' active';
            
            currentSlideIndex = index;
        }
        
        // Handle image loading error
        function handleImageError(img, index) {
            console.error(`Failed to load image for slide ${index + 1}: ${img.src}`);
            
            try {
                // Try fallback with different extensions
                const originalSrc = img.src;
                const filename = originalSrc.substring(originalSrc.lastIndexOf('/') + 1);
                const basename = filename.substring(0, filename.lastIndexOf('.'));
                
                // Try loading with alternative extensions
                tryAlternativeExtensions(img, basename, 0);
            } catch (e) {
                console.error('Error handling image fallback:', e);
                // Set a default fallback if all else fails
                img.src = 'https://via.placeholder.com/1920x1080/0F52BA/FFFFFF?text=Image+Not+Found';
                img.onerror = null;
            }
        }
        
        // Try different file extensions if the original one fails
        function tryAlternativeExtensions(img, basename, attemptIndex) {
            const extensions = ['.jpeg', '.jpg', '.png', '.webp'];
            
            if (attemptIndex >= extensions.length) {
                // All extensions failed, use fallback
                img.src = 'https://via.placeholder.com/1920x1080/0F52BA/FFFFFF?text=Image+Not+Found';
                img.onerror = null; // Prevent further errors
                return;
            }
            
            const newSrc = slideshowConfig.imageFolder + basename + extensions[attemptIndex];
            console.log(`Trying alternative extension: ${newSrc}`);
            
            const tempImg = new Image();
            tempImg.onload = function() {
                img.src = newSrc;
                img.onerror = null;
            };
            
            tempImg.onerror = function() {
                // Try next extension
                tryAlternativeExtensions(img, basename, attemptIndex + 1);
            };
            
            tempImg.src = newSrc;
        }
        
        // Start the autoplay function
        function startAutoplay() {
            autoplayTimer = setInterval(() => {
                changeSlide(1);
            }, slideshowConfig.autoplayInterval);
        }
        
        // Initialize the slideshow
        function init() {
            buildSlideshow();
            startAutoplay();
            
            // Pause autoplay when the tab is not visible
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    clearInterval(autoplayTimer);
                } else {
                    startAutoplay();
                }
            });

            // Add touch swipe support for mobile devices
            if (container) {
                let touchStartX = 0;
                let touchEndX = 0;
                
                container.addEventListener('touchstart', (e) => {
                    touchStartX = e.changedTouches[0].screenX;
                }, false);
                
                container.addEventListener('touchend', (e) => {
                    touchEndX = e.changedTouches[0].screenX;
                    handleSwipe();
                }, false);
                
                function handleSwipe() {
                    const threshold = 50; // Minimum distance to register as swipe
                    if (touchStartX - touchEndX > threshold) {
                        // Swipe left - go to next slide
                        changeSlide(1);
                    } else if (touchEndX - touchStartX > threshold) {
                        // Swipe right - go to previous slide
                        changeSlide(-1);
                    }
                }
            }
            
            // Call adjustLayout initially and on window resize
            adjustLayout();
            window.addEventListener('resize', adjustLayout);
        }

        // Add adjustLayout method for responsive handling
        function adjustLayout() {
            // Recalculate sizes after layout changes
            if (container) {
                const containerRect = container.getBoundingClientRect();
                console.log(`Slideshow container size: ${containerRect.width}x${containerRect.height}`);
                
                // Adjust navigation arrows position for small screens
                const prevArrow = container.querySelector('.prev');
                const nextArrow = container.querySelector('.next');
                
                if (prevArrow && nextArrow) {
                    if (containerRect.width < 576) {
                        prevArrow.style.fontSize = '16px';
                        nextArrow.style.fontSize = '16px';
                        prevArrow.style.padding = '5px 10px';
                        nextArrow.style.padding = '5px 10px';
                    } else {
                        prevArrow.style.fontSize = '';
                        nextArrow.style.fontSize = '';
                        prevArrow.style.padding = '';
                        nextArrow.style.padding = '';
                    }
                }
            }
        }

        // Additional function to handle layout when sidebar is toggled
        function updateForSidebarToggle() {
            // Force recalculation of dimensions
            if (container) {
                setTimeout(() => {
                    // Brief timeout allows DOM to update first
                    const containerRect = container.getBoundingClientRect();
                    console.log(`Updated slideshow: ${containerRect.width}x${containerRect.height}`);
                    
                    // Force redraw/repaint by triggering style recalculation
                    container.style.display = 'none';
                    container.offsetHeight; // This triggers reflow
                    container.style.display = '';
                    
                    // Make sure images fill the space
                    const slides = container.querySelectorAll('.slide');
                    slides.forEach(slide => {
                        const img = slide.querySelector('img');
                        if (img) {
                            img.style.width = '100%';
                            img.style.height = '100%';
                            img.style.objectFit = 'cover';
                        }
                    });
                }, 300); // Small delay allows transition to complete
            }
        }
        
        // Public methods
        return {
            init,
            next: () => changeSlide(1),
            prev: () => changeSlide(-1),
            goTo: goToSlide,
            adjustLayout,
            updateForSidebarToggle
        };
    })();
    
    // Initialize the slideshow only once
    slideshowManager.init();

    // Single resize event listener that handles everything
    window.addEventListener('resize', () => {
        // Reset mobile menu state on larger screens
        if (window.innerWidth > 768) {
            const sidebarNav = document.getElementById('sidebar-nav');
            const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
            
            if (sidebarNav) sidebarNav.classList.remove('expanded');
            if (mobileMenuToggle) mobileMenuToggle.classList.remove('open');
        }
        
        // Adjust slideshow layout
        if (slideshowManager && typeof slideshowManager.adjustLayout === 'function') {
            slideshowManager.adjustLayout();
        }
    });

    // Mobile menu toggle - single initialization
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const sidebarNav = document.getElementById('sidebar-nav');
    
    if (mobileMenuToggle && sidebarNav) {
        mobileMenuToggle.addEventListener('click', () => {
            sidebarNav.classList.toggle('expanded');
            mobileMenuToggle.classList.toggle('open');
        });
        
        // Close mobile menu when a link is clicked
        const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    sidebarNav.classList.remove('expanded');
                    mobileMenuToggle.classList.remove('open');
                }
            });
        });
    }
});
