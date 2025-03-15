document.addEventListener('DOMContentLoaded', () => {
    // Logo rotation logic
    const logo = document.querySelector('.logo');
    const logos = [
        'assets/images/ocular-logos/logo1.png',
        'assets/images/ocular-logos/logo2.png',
        'assets/images/ocular-logos/logo3.png',
        'assets/images/ocular-logos/logo4.png',
        'assets/images/ocular-logos/logo5.png'
    ];
    let currentLogoIndex = 0;

    setInterval(() => {
        currentLogoIndex = (currentLogoIndex + 1) % logos.length;
        logo.src = logos[currentLogoIndex];
    }, 1000); // Change logo every 1 second

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
