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

    // Enhanced slideshow functionality with loading indicators
    let slideIndex = 1;

    // Function to preload images for better performance
    function preloadSlideImages() {
        const slides = document.querySelectorAll('.slide img');
        slides.forEach(img => {
            // Add loading class to slide during image load
            const slide = img.parentElement;
            slide.classList.add('loading');
            
            // Create new image object to preload
            const preloadImg = new Image();
            preloadImg.src = img.src;
            
            // Remove loading class when image is loaded
            preloadImg.onload = () => {
                slide.classList.remove('loading');
            };
            
            // Handle errors gracefully
            preloadImg.onerror = () => {
                slide.classList.remove('loading');
                img.alt = 'Image failed to load';
                img.onerror = null; // prevent infinite loop
                img.src = '/assets/placeholder.png';
            };
        });
    }

    // Call preload when DOM is ready
    document.addEventListener('DOMContentLoaded', preloadSlideImages);

    // Next/previous controls
    function plusSlides(n) {
        showSlides(slideIndex += n);
    }

    // Thumbnail image controls
    function currentSlide(n) {
        showSlides(slideIndex = n);
    }

    function showSlides(n) {
        let i;
        let slides = document.getElementsByClassName("slide");
        let dots = document.getElementsByClassName("dot");
        
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
        if (slides.length > 0) {
            slides[slideIndex-1].style.display = "block";
            
            if (dots.length > 0 && slideIndex <= dots.length) {
                dots[slideIndex-1].className += " active";
            }
        }
    }

    // Initialize the slideshow
    document.addEventListener('DOMContentLoaded', () => {
        showSlides(slideIndex);
        
        // Auto advance slides every 6 seconds
        setInterval(() => {
            plusSlides(1);
        }, 6000);
        
        // Make the arrow controls work
        document.querySelector('.prev').addEventListener('click', () => plusSlides(-1));
        document.querySelector('.next').addEventListener('click', () => plusSlides(1));
        
        // Make the dot controls work
        document.querySelectorAll('.dot').forEach((dot, index) => {
            dot.addEventListener('click', () => currentSlide(index + 1));
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
