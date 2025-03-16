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
    
    // Enhanced image loading diagnostic function
    function preloadSlideImages() {
        console.log("Preloading slideshow images...");
        const slides = document.querySelectorAll('.slide img');
        
        slides.forEach((img, index) => {
            // Log detailed path information
            console.log(`Slide ${index + 1}:`);
            console.log(`  - Current path: "${img.src}"`);
            console.log(`  - Absolute URL: "${new URL(img.src, window.location.href).href}"`);
            console.log(`  - Image exists check starting...`);
            
            const slide = img.parentElement;
            slide.classList.add('loading');
            
            // Create a debugging element to show path information on the slide
            const debugInfo = document.createElement('div');
            debugInfo.className = 'debug-info';
            debugInfo.style.cssText = 'position:absolute; top:10px; left:10px; background:rgba(0,0,0,0.7); color:white; padding:5px; border-radius:3px; font-size:12px; max-width:80%; z-index:100;';
            debugInfo.innerHTML = `Attempted path: ${img.src}`;
            slide.appendChild(debugInfo);
            
            // Try multiple possible paths
            const tryPaths = [
                img.src, // Original path
                img.src.replace(/^\//, ''), // Remove leading slash if present
                img.src.startsWith('assets') ? img.src : 'assets/' + img.src.split('/').pop(), // Try assets/ folder
                img.src.startsWith('assets') ? '/' + img.src : '/assets/slideshow-images/' + img.src.split('/').pop() // Try absolute /assets/ path
            ];
            
            // Function to try loading an image path
            function tryLoadImage(pathIndex) {
                if (pathIndex >= tryPaths.length) {
                    // All paths failed, use placeholder
                    console.error(`All paths failed for slide ${index + 1}`);
                    img.onerror = null;
                    img.src = 'https://via.placeholder.com/800x600?text=Image+Not+Found';
                    debugInfo.innerHTML += `<br>❌ All paths failed`;
                    return;
                }
                
                const path = tryPaths[pathIndex];
                console.log(`  - Trying path: "${path}"`);
                debugInfo.innerHTML += `<br>Trying: ${path}`;
                
                const testImg = new Image();
                
                testImg.onload = function() {
                    console.log(`  - SUCCESS! Image loaded from "${path}"`);
                    img.src = path;
                    img.onerror = null; // Clear error handler
                    slide.classList.remove('loading');
                    debugInfo.innerHTML += `<br>✅ Success with: ${path}`;
                    
                    // Remove debug info after success and delay
                    setTimeout(() => {
                        if (debugInfo.parentNode) {
                            debugInfo.parentNode.removeChild(debugInfo);
                        }
                    }, 5000);
                };
                
                testImg.onerror = function() {
                    console.log(`  - Failed to load from "${path}"`);
                    debugInfo.innerHTML += `<br>❌ Failed: ${path}`;
                    // Try next path
                    tryLoadImage(pathIndex + 1);
                };
                
                testImg.src = path;
            }
            
            // Start trying paths
            tryLoadImage(0);
        });
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
    
    // Initialize slideshow
    preloadSlideImages();
    showSlides(slideIndex);
    
    // Auto advance slides every 6 seconds
    setInterval(function() {
        plusSlides(1);
    }, 6000);
    
    // Wire up event listeners for arrow navigation
    document.querySelector('.prev').addEventListener('click', function() {
        plusSlides(-1);
    });
    
    document.querySelector('.next').addEventListener('click', function() {
        plusSlides(1);
    });
    
    // Make the dot controls work
    document.querySelectorAll('.dot').forEach(function(dot, index) {
        dot.addEventListener('click', function() {
            currentSlide(index + 1);
        });
    });

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
