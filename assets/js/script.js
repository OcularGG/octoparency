document.addEventListener('DOMContentLoaded', () => {
    // Enhanced logo transition logic
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
    
    // Create a clone for crossfade effect
    const createLogoClone = () => {
        const clone = logo.cloneNode(true);
        clone.classList.add('logo-clone');
        logo.parentNode.appendChild(clone);
        return clone;
    };
    
    // CSS for crossfade effect
    const style = document.createElement('style');
    style.textContent = `
        .logo-container {
            position: relative;
        }
        .logo, .logo-clone {
            transition: opacity 1.5s ease-in-out;
            position: absolute;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
        }
        .logo-clone {
            opacity: 0;
        }
    `;
    document.head.appendChild(style);
    
    // Initial positioning
    logo.style.position = 'relative';
    logo.style.opacity = '1';
    
    const logoClone = createLogoClone();
    
    // Cinematic crossfade transition
    const transitionLogos = () => {
        // Update the clone with next image
        const nextIndex = (currentLogoIndex + 1) % logos.length;
        logoClone.src = logos[nextIndex];
        
        // Fade out current, fade in next
        logo.style.opacity = '0';
        logoClone.style.opacity = '1';
        
        // After transition completes, make the visible one the main logo
        setTimeout(() => {
            logo.src = logos[nextIndex];
            logo.style.opacity = '1';
            logoClone.style.opacity = '0';
            currentLogoIndex = nextIndex;
        }, 1500); // Match this with the CSS transition time
    };
    
    // Start transitions with a more cinematic timing (4.5 seconds)
    setInterval(transitionLogos, 4500);

    // Dark mode toggle
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const body = document.body;
    
    // Check for saved theme preference or default to light
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        themeToggleBtn.textContent = 'Light Mode';
    }
    
    // Theme toggle functionality
    themeToggleBtn.addEventListener('click', () => {
        // Toggle dark mode class
        body.classList.toggle('dark-mode');
        
        // Update button text
        const isDarkMode = body.classList.contains('dark-mode');
        themeToggleBtn.textContent = isDarkMode ? 'Light Mode' : 'Dark Mode';
        
        // Save preference to localStorage
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    });

    // Login button functionality
    const loginButton = document.querySelector('.login-button');
    loginButton.addEventListener('click', () => {
        alert('Login functionality would be implemented here');
    });
});
