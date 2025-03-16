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

    // Dark mode toggle
    const themeToggleInput = document.getElementById('theme-toggle-input');
    const body = document.body;
    
    // Check for saved theme preference or default to light
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        themeToggleInput.checked = true;
    }
    
    // Theme toggle functionality
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

    // Check if user prefers dark mode
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add('dark-mode');
        document.getElementById('theme-toggle-input').checked = true;
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
            
            // Try fallback with different extensions
            const originalSrc = img.src;
            const filename = originalSrc.substring(originalSrc.lastIndexOf('/') + 1);
            const basename = filename.substring(0, filename.lastIndexOf('.'));
            
            // Try loading with alternative extensions
            tryAlternativeExtensions(img, basename, 0);
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
        }
        
        // Public methods
        return {
            init,
            next: () => changeSlide(1),
            prev: () => changeSlide(-1),
            goTo: goToSlide
        };
    })();
    
    // Initialize the slideshow
    slideshowManager.init();
});
