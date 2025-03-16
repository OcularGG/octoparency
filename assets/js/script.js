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
    let isTransitioning = false; // Add flag to prevent overlapping transitions
    
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
        if (isTransitioning) return; // Prevent overlapping transitions
        isTransitioning = true;
        
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
                
                // Reset transition flag after complete
                setTimeout(() => {
                    isTransitioning = false;
                }, 1000);
            }, 1000);
        };
        
        // Add error handling in case image fails to load
        tempImg.onerror = () => {
            console.error('Failed to load next logo image:', tempImg.src);
            isTransitioning = false; // Release transition lock on error
        };
    };
    
    // Start transitions with a cinematic timing
    setInterval(transitionLogos, 4500);

    // Dark mode toggle - fixed potential duplicate listeners
    const themeToggleInput = document.getElementById('theme-toggle-input');
    const body = document.body; // Using this instance of body throughout
    
    // Check for saved theme preference or default to light
    const savedTheme = localStorage.getItem('theme');
    
    // First check user's preferred color scheme if no saved preference exists
    if (!savedTheme && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        body.classList.add('dark-mode');
        themeToggleInput.checked = true;
        localStorage.setItem('theme', 'dark');
    } else if (savedTheme === 'dark') {
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
            // Correctly toggle the sidebar and update isCollapsed
            body.classList.toggle('sidebar-collapsed');
            isCollapsed = body.classList.contains('sidebar-collapsed');
            
            // Update the toggle button icon
            updateToggleButtonIcon(isCollapsed);
            
            // Save preference to localStorage
            localStorage.setItem('sidebar-collapsed', isCollapsed);
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

    // Remove all slideshow code and related references
    // (Removed COMPLETELY REWRITTEN SLIDESHOW CODE and REWRITTEN SLIDESHOW CODE sections)

    // In event listeners that referenced slideshowManager, remove or comment out calls:
    window.addEventListener('resize', () => {
        // Removed slideshow layout adjustment call (static image remains unchanged)
        const sidebarToggle = document.getElementById('sidebar-toggle');
        if (sidebarToggle) {
            updateToggleButtonIcon(document.body.classList.contains('sidebar-collapsed'));
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

// Insert new static image in the slideshow container.
// This code creates a static image on the right side of the website.
(function initStaticImage() {
    const container = document.querySelector('#slideshow-container');
    if (!container) {
        console.error('Static image container not found!');
        return;
    }
    container.innerHTML = '';
    const imgElement = document.createElement('img');
    imgElement.src = 'https://wallpapercave.com/wp/wp4224345.jpg';
    imgElement.style.width = '100%';
    imgElement.style.height = '100%';
    imgElement.style.objectFit = 'cover';
    container.appendChild(imgElement);
})();

/* ===== Extra merged functionality from the second script.js ===== */
// If an element with id "theme-toggle-btn" exists, attach additional dark mode toggle behavior.
document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
        if (document.body.classList.contains('dark-mode')) {
            themeToggleBtn.textContent = 'Light Mode';
        } else {
            themeToggleBtn.textContent = 'Dark Mode';
        }
        themeToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            themeToggleBtn.textContent = isDark ? 'Light Mode' : 'Dark Mode';
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    }
});

// ---- Sidebar Menu Rewrite Start ----
(function initSidebarMenu() {
    const sidebar = document.getElementById('sidebar'); // Ensure your sidebar element has id="sidebar"
    const toggleBtn = document.getElementById('sidebar-toggle'); // And your toggle button id="sidebar-toggle"
    if (!sidebar || !toggleBtn) {
        console.error("Sidebar or toggle button not found");
        return;
    }
    // Retrieve stored state; default to expanded (false)
    let collapsed = localStorage.getItem('sidebar-collapsed') === 'true';
    setSidebarState(collapsed);
    toggleBtn.addEventListener('click', () => {
        collapsed = !collapsed;
        setSidebarState(collapsed);
        localStorage.setItem('sidebar-collapsed', collapsed);
    });
    function setSidebarState(collapsed) {
         if (collapsed) {
             sidebar.classList.add('collapsed');
             toggleBtn.textContent = '→'; // Show arrow indicating expansion
         } else {
             sidebar.classList.remove('collapsed');
             toggleBtn.textContent = '←'; // Show arrow indicating collapse
         }
    }
})();
// ---- Sidebar Menu Rewrite End ----
