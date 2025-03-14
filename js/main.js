// DOM Elements
const deathsList = document.getElementById('deaths-list');
const refreshButton = document.getElementById('refresh-deaths');
const regionSelect = document.getElementById('region-select');
const receiptModal = document.getElementById('receipt-modal');
const receiptContent = document.getElementById('receipt-content');
const downloadButton = document.getElementById('download-receipt');
const closeButton = document.querySelector('.close-button');

let currentDeaths = [];
let currentDeathIndex = null;

function displayDeaths(deaths) {
    if (!deaths || deaths.length === 0) {
        deathsList.innerHTML = `
            <div class="empty-state">
                <p>No recent deaths found for Double Overcharge alliance.</p>
                <p>Try selecting a different server region or check back later.</p>
            </div>
        `;
        return;
    }

    currentDeaths = deaths; // Store the deaths
    deathsList.innerHTML = ''; // Clear existing list

    deaths.forEach((death, index) => {
        const deathTime = new Date(death.TimeStamp);
        const deathItem = document.createElement('div');
        deathItem.classList.add('death-item');
        
        deathItem.innerHTML = `
            <h3>${death.Victim.Name}</h3>
            <div class="death-info">
                <div class="death-detail">
                    <span>Killed by</span>
                    <span>${death.Killer.Name}</span>
                </div>
                <div class="death-detail">
                    <span>Date</span>
                    <span>${deathTime.toLocaleDateString()}</span>
                </div>
                <div class="death-detail">
                    <span>Time</span>
                    <span>${deathTime.toLocaleTimeString()}</span>
                </div>
                <div class="death-detail">
                    <span>Fame</span>
                    <span>${death.TotalVictimKillFame.toLocaleString()}</span>
                </div>
            </div>
            <div class="death-actions">
                <button class="view-receipt" data-index="${index}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    View Receipt
                </button>
            </div>
        `;
        
        deathsList.appendChild(deathItem);
    });
    
    // Add event listeners to the view receipt buttons
    document.querySelectorAll('.view-receipt').forEach(button => {
        button.addEventListener('click', (e) => {
            const index = parseInt(e.currentTarget.dataset.index);
            showReceipt(index);
        });
    });
}

async function showReceipt(index) {
    const death = currentDeaths[index];
    if (!death) return;
    
    currentDeathIndex = index;
    
    // Show loading state
    receiptContent.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
        </div>
    `;
    receiptModal.style.display = 'flex'; // Show the modal

    try {
        // Generate receipt
        const receiptHTML = await generateBattleReceipt(death, 'deaths');
        receiptContent.innerHTML = receiptHTML;
    } catch (error) {
        console.error('Error generating receipt:', error);
        receiptContent.innerHTML = `<p>Error generating receipt. Please try again.</p>`;
    }
}

function downloadReceipt() {
    if (currentDeathIndex === null) return;
    
    const death = currentDeaths[currentDeathIndex];
    if (!death) return;
    
    const img = document.querySelector('.receipt-img');
    if (!img) return;
    
    // Create download link
    const link = document.createElement('a');
    link.download = `death_receipt_${death.Victim.Name.replace(/\s+/g, '_')}_${new Date(death.TimeStamp).toISOString().split('T')[0]}.png`;
    link.href = img.src;
    link.click();
}

async function loadAllianceDeaths() {
    // Show loading state
    deathsList.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            <p>Loading deaths...</p>
        </div>
    `;
    
    try {
        // First try to get cached deaths from the database
        const { data: cachedDeaths, error: dbError, source } = await window.db.getDeaths({
            limit: 50,
            allianceId: 'TH8JjVwVRiuFnalrzESkRQ'  // Double Overcharge ID
        });
        
        if (cachedDeaths && cachedDeaths.length > 0) {
            console.log(`Displaying ${cachedDeaths.length} deaths from ${source || 'unknown source'}`);
            displayDeaths(cachedDeaths);
            
            // If we got data from localStorage, we should still try to fetch from API
            // to update our records, but we don't need to block the UI
            if (source === 'localStorage') {
                setTimeout(async () => {
                    try {
                        console.log('Background refresh from API...');
                        const apiDeaths = await fetchAllianceDeaths();
                        if (apiDeaths && apiDeaths.length > 0) {
                            // Cache the results
                            await window.db.saveDeath(apiDeaths);
                            // Only update UI if there are more records or newer ones
                            if (apiDeaths.length > cachedDeaths.length) {
                                displayDeaths(apiDeaths);
                            }
                        }
                    } catch (error) {
                        console.error('Background refresh error:', error);
                    }
                }, 100);
            }
        } else {
            // Nothing in cache or db, fetch from API
            const apiDeaths = await fetchAllianceDeaths();
            if (apiDeaths && apiDeaths.length > 0) {
                // Cache the results
                await window.db.saveDeath(apiDeaths);
                displayDeaths(apiDeaths);
            } else {
                // No deaths found
                deathsList.innerHTML = `
                    <div class="empty-state">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <h3>No Deaths Found</h3>
                        <p>No recent deaths found for Double Overcharge alliance.</p>
                        <p>Try selecting a different server region or check back later.</p>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error loading deaths:', error);
        deathsList.innerHTML = `
            <div class="error-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <h3>Error Loading Deaths</h3>
                <p>${error.message}</p>
                <p>Check your internet connection and try again.</p>
                <button id="retry-button" class="btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M23 4v6h-6"></path>
                        <path d="M1 20v-6h6"></path>
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                    </svg>
                    Retry
                </button>
            </div>
        `;
        
        // Add retry button listener
        document.getElementById('retry-button')?.addEventListener('click', loadAllianceDeaths);
    }
}

// Function to check if stylesheets are loading properly
function checkStylesheets() {
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
    let allLoaded = true;
    
    stylesheets.forEach(sheet => {
        if (!sheet.sheet) {
            console.error(`Failed to load stylesheet: ${sheet.href}`);
            allLoaded = false;
        }
    });
    
    if (!allLoaded) {
        // Alert the user with a banner if stylesheets failed to load
        const banner = document.createElement('div');
        banner.style.backgroundColor = '#ff4d4d';
        banner.style.color = 'white';
        banner.style.padding = '1rem';
        banner.style.textAlign = 'center';
        banner.style.position = 'fixed';
        banner.style.top = '0';
        banner.style.left = '0';
        banner.style.right = '0';
        banner.style.zIndex = '1000';
        banner.textContent = 'Warning: Some styles failed to load. Try refreshing the page.';
        document.body.prepend(banner);
    }
}

function setupEventListeners() {
    // Refresh deaths when button is clicked
    refreshButton.addEventListener('click', loadAllianceDeaths);
    
    // Change region and refresh deaths
    regionSelect.addEventListener('change', () => {
        setApiRegion(regionSelect.value);
        loadAllianceDeaths();
    });
    
    // Close modal
    closeButton.addEventListener('click', () => {
        receiptModal.style.display = 'none';
        currentDeathIndex = null;
    });
    
    // Close modal when clicking outside of it
    window.addEventListener('click', (event) => {
        if (event.target === receiptModal) {
            receiptModal.style.display = 'none';
            currentDeathIndex = null;
        }
    });
    
    // Download receipt
    downloadButton.addEventListener('click', downloadReceipt);
    
    // Key press handlers
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && receiptModal.style.display === 'flex') {
            receiptModal.style.display = 'none';
            currentDeathIndex = null;
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    checkStylesheets(); // Add this line to check stylesheets
    loadAllianceDeaths();
});
