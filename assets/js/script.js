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

    // Fix for duplicate event listeners - remove the nested DOMContentLoaded
    // Slideshow functionality
    let slideIndex = 1;
    
    // Enhanced image loading with placeholder images
    function preloadSlideImages() {
        console.log("Setting up slideshow with placeholder images...");
        const slideshowContainer = document.getElementById('slideshow-container');
        
        // Store the existing dots container if it exists
        const existingDotsContainer = document.querySelector('.dots-container');
        
        // Clear any existing slides but preserve the dots
        slideshowContainer.innerHTML = '';
        
        // Create navigation arrows
        const prevArrow = document.createElement('a');
        prevArrow.className = 'prev';
        prevArrow.innerHTML = '&#10094;';
        prevArrow.onclick = function() { plusSlides(-1); };
        
        const nextArrow = document.createElement('a');
        nextArrow.className = 'next';
        nextArrow.innerHTML = '&#10095;';
        nextArrow.onclick = function() { plusSlides(1); };
        
        slideshowContainer.appendChild(prevArrow);
        slideshowContainer.appendChild(nextArrow);
        
        // Use different placeholder images for variety with blue gradient shades
        const placeholderUrls = [
            'https://via.placeholder.com/1920x1080/0F52BA/FFFFFF?text=OCULAR+Slide+1',
            'https://via.placeholder.com/1920x1080/1E90FF/FFFFFF?text=OCULAR+Slide+2',
            'https://via.placeholder.com/1920x1080/0A2968/FFFFFF?text=OCULAR+Slide+3',
            'https://via.placeholder.com/1920x1080/0D4C8B/FFFFFF?text=OCULAR+Slide+4',
            'https://via.placeholder.com/1920x1080/2196F3/FFFFFF?text=OCULAR+Slide+5',
            'https://via.placeholder.com/1920x1080/4285F4/FFFFFF?text=OCULAR+Slide+6'
        ];
        
        // Create slides with placeholder images
        placeholderUrls.forEach((url, index) => {
            // Create slide
            const slide = document.createElement('div');
            slide.className = 'slide fade';
            
            // Create image
            const img = document.createElement('img');
            img.src = url;
            img.alt = `Slide ${index + 1}`;
            
            // Create text caption
            const textDiv = document.createElement('div');
            textDiv.className = 'text';
            textDiv.textContent = 'OCULAR';
            
            // Add to slide
            slide.appendChild(img);
            slide.appendChild(textDiv);
            slideshowContainer.appendChild(slide);
        });
        
        // Create dots container if it doesn't exist already
        if (!existingDotsContainer) {
            const dotsContainer = document.createElement('div');
            dotsContainer.className = 'dots-container';
            
            // Create 6 rectangle dots with our desired styling
            for (let i = 0; i < 6; i++) {
                const dot = document.createElement('span');
                dot.className = 'dot';
                dot.onclick = function() { currentSlide(i + 1); };
                dotsContainer.appendChild(dot);
            }
            
            slideshowContainer.appendChild(dotsContainer);
        } else {
            // Re-add the existing dots container
            slideshowContainer.appendChild(existingDotsContainer);
        }
        
        console.log("Slideshow setup complete with placeholder images");
    }
    
    function handleImageError(img) {
        const slide = img.parentElement;
        slide.classList.remove('loading');
        
        // Try relative path if absolute path fails
        if (img.src.startsWith('/')) {
            const relativePath = img.src.substring(1); // Remove leading slash
            console.log(`Trying relative path: ${relativePath}`);
            img.src = relativePath;
            return;
        }
        
        // If that fails too, use a placeholder
        img.onerror = null; // Prevent infinite loop
        img.src = 'https://via.placeholder.com/800x600?text=Image+Not+Found';
        
        // Add a message inside the slide
        const message = document.createElement('div');
        message.className = 'error-message';
        message.textContent = 'Image could not be loaded';
        slide.appendChild(message);
    }
    
    // Next/previous controls
    window.plusSlides = function(n) {
        showSlides(slideIndex += n);
    };
    
    // Thumbnail image controls
    window.currentSlide = function(n) {
        showSlides(slideIndex = n);
    };
    
    function showSlides(n) {
        let i;
        let slides = document.getElementsByClassName("slide");
        let dots = document.getElementsByClassName("dot");
        
        if (slides.length === 0) {
            console.error("No slides found!");
            return;
        }
        
        // Handle wrapping around
        if (n > slides.length) {slideIndex = 1}
        if (n < 1) {slideIndex = slides.length}
        
        // Hide all slides
        for (i = 0; i < slides.length; i++) {
            slides[i].style.display = "none";
        }
        
        // Remove active class from all dots
        for (i = 0; i < dots.length; i++) {
            dots[i].className = dots[i].className.replace(" active", "");
        }
        
        // Show the current slide and activate corresponding dot
        console.log(`Showing slide ${slideIndex} of ${slides.length}`);
        slides[slideIndex-1].style.display = "block";
        
        if (dots.length > 0 && slideIndex <= dots.length) {
            dots[slideIndex-1].className += " active";
        }
    }
    
    // Initialize slideshow with these functions in the right order
    preloadSlideImages();
    showSlides(slideIndex);
    setupSlideNavigation();
    
    // Wire up event listeners for arrow navigation
    function setupSlideNavigation() {
        // Auto advance slides every 6 seconds
        setInterval(function() {
            plusSlides(1);
        }, 6000);
        
        // Wire up event listeners for arrow navigation
        const prevArrow = document.querySelector('.prev');
        const nextArrow = document.querySelector('.next');
        
        if (prevArrow) {
            prevArrow.addEventListener('click', function() {
                plusSlides(-1);
            });
        }
        
        if (nextArrow) {
            nextArrow.addEventListener('click', function() {
                plusSlides(1);
            });
        }
        
        // Make the dot controls work - ensure we preserve their styling
        document.querySelectorAll('.dot').forEach(function(dot, index) {
            dot.addEventListener('click', function() {
                currentSlide(index + 1);
            });
        });
    }
    
    // Theme toggle functionality
    document.getElementById('theme-toggle-input').addEventListener('change', function() {
        document.body.classList.toggle('dark-mode');
    });

    // Check if user prefers dark mode
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add('dark-mode');
        document.getElementById('theme-toggle-input').checked = true;
    }
});
