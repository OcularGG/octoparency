// DOM Elements
const deathsList = document.getElementById('deaths-list');
const refreshButton = document.getElementById('refresh-deaths');
const regionSelect = document.getElementById('region-select');
const receiptModal = document.getElementById('receipt-modal');
const receiptImage = document.getElementById('receipt-image');
const closeButton = document.querySelector('.close-button');
const downloadButton = document.getElementById('download-receipt');
const shareButton = document.getElementById('share-receipt');

// Double Overcharge Alliance ID
const DOUBLE_OVERCHARGE_ID = 'TH8JjVwVRiuFnalrzESkRQ';
let currentDeath = null;

// Initialize the application
function initApp() {
    console.log('Initializing app...');
    
    // Set up event listeners
    refreshButton.addEventListener('click', loadAllianceDeaths);
    
    regionSelect.addEventListener('change', function() {
        const region = this.value;
        if (window.setApiRegion) {
            window.setApiRegion(region);
            loadAllianceDeaths();
        }
    });
    
    // Modal controls
    closeButton.addEventListener('click', () => {
        receiptModal.classList.add('hidden');
    });
    
    downloadButton.addEventListener('click', downloadReceipt);
    shareButton.addEventListener('click', shareReceipt);
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === receiptModal) {
            receiptModal.classList.add('hidden');
        }
    });
    
    // Load deaths on startup
    loadAllianceDeaths();
}

// Load alliance deaths
async function loadAllianceDeaths() {
    deathsList.innerHTML = '<p>Loading deaths...</p>';
    
    try {
        const deaths = await getAllianceDeaths(DOUBLE_OVERCHARGE_ID);
        
        if (!deaths || deaths.length === 0) {
            deathsList.innerHTML = '<p>No recent deaths found for Double Overcharge.</p>';
            return;
        }
        
        displayDeaths(deaths);
    } catch (error) {
        console.error('Error loading deaths:', error);
        deathsList.innerHTML = `<p>Error loading deaths: ${error.message}. Please check the console for details.</p>`;
    }
}

// Display deaths in the interface
function displayDeaths(deaths) {
    deathsList.innerHTML = '';
    
    deaths.forEach(death => {
        const deathCard = document.createElement('div');
        deathCard.className = 'death-card';
        
        const eventDate = new Date(death.TimeStamp);
        const victim = death.Victim;
        const killer = death.Killer;
        
        deathCard.innerHTML = `
            <h3>${victim.Name}</h3>
            <p><strong>Killed by:</strong> ${killer.Name}</p>
            <p><strong>Date:</strong> ${eventDate.toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${eventDate.toLocaleTimeString()}</p>
            <p><strong>Fame:</strong> ${death.TotalVictimKillFame.toLocaleString()}</p>
        `;
        
        deathCard.addEventListener('click', () => {
            showDeathReceipt(death);
        });
        
        deathsList.appendChild(deathCard);
    });
}

// Show death receipt in modal
async function showDeathReceipt(death) {
    currentDeath = death;
    
    // Generate receipt
    const receiptHTML = await generateBattleReceipt(death, 'deaths');
    receiptImage.innerHTML = receiptHTML;
    
    // Show modal
    receiptModal.classList.remove('hidden');
}

// Download receipt as an image
function downloadReceipt() {
    if (!currentDeath) return;
    
    const img = receiptImage.querySelector('img');
    if (!img) return;
    
    // Create link for download
    const downloadLink = document.createElement('a');
    
    // Format filename with player name and date
    const victimName = currentDeath.Victim.Name.replace(/\s+/g, '_');
    const date = new Date(currentDeath.TimeStamp);
    const dateStr = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    
    downloadLink.href = img.src;
    downloadLink.download = `${victimName}_${dateStr}_receipt.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

// Share receipt
async function shareReceipt() {
    if (!currentDeath) return;
    
    const img = receiptImage.querySelector('img');
    if (!img) return;
    
    // Check if Web Share API is supported
    if (navigator.share) {
        try {
            // Convert data URL to File object
            const res = await fetch(img.src);
            const blob = await res.blob();
            const file = new File([blob], 'death_receipt.png', { type: 'image/png' });
            
            await navigator.share({
                title: 'Double Overcharge Death Receipt',
                text: `Death receipt for ${currentDeath.Victim.Name}`,
                files: [file]
            });
        } catch (error) {
            console.error('Error sharing:', error);
            alert('Failed to share the receipt. You can download it instead.');
        }
    } else {
        alert('Web Share API not supported on this browser. You can download the receipt instead.');
    }
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    try {
        initApp();
        
        // Test API connection on startup
        if (window.testApiConnection) {
            window.testApiConnection();
        } else {
            console.warn('API test function not available');
        }
    } catch (error) {
        console.error('Error initializing app:', error);
        document.getElementById('error-message').textContent = 'Initialization error: ' + error.message;
        document.getElementById('error-container').style.display = 'block';
    }
});

// Global error handling
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
});
