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
    deathsList.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            <p>Loading deaths...</p>
        </div>
    `;
    
    try {
        // Try to get cached deaths from the database
        const { data: cachedDeaths, error: dbError } = await window.db.getDeaths({
            limit: 200,  // increased limit to pull past deaths
            allianceId: 'TH8JjVwVRiuFnalrzESkRQ'
        });
        
        if (cachedDeaths && cachedDeaths.length > 0) {
            console.log(`Displaying ${cachedDeaths.length} cached deaths`);
            displayDeaths(cachedDeaths);
        }
        
        // Always fetch fresh data from the API with higher limit
        const apiDeaths = await fetchAllianceDeaths(200);
        
        if (apiDeaths && apiDeaths.length > 0) {
            await window.db.saveDeath(apiDeaths);
            displayDeaths(apiDeaths);
        } else {
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

// Sample death data for testing receipt generation
const sampleDeathData = {
    EventId: "test-event-12345",
    TimeStamp: new Date().toISOString(),
    TotalVictimKillFame: 125000,
    Victim: {
        Name: "TestVictim",
        GuildName: "Double Overcharge",
        AllianceName: "Double Overcharge",
        AverageItemPower: 1250,
        Equipment: {
            MainHand: { Type: "T8_MAIN_ARCANESTAFF", Quality: 5 },
            OffHand: { Type: "T7_OFF_BOOK", Quality: 4 },
            Head: { Type: "T8_HEAD_CLOTH_SET3", Quality: 3 },
            Armor: { Type: "T8_ARMOR_CLOTH_SET3", Quality: 4 },
            Shoes: { Type: "T7_SHOES_CLOTH_SET3", Quality: 3 },
            Cape: { Type: "T6_CAPEITEM_FW_MARTLOCK", Quality: 4 },
            Mount: { Type: "T8_MOUNT_ARMORED_HORSE", Quality: 1 }
        }
    },
    Killer: {
        Name: "TestKiller",
        GuildName: "Enemy Guild",
        AllianceName: "Enemy Alliance"
    },
    Participants: [
        { Name: "TestKiller", DamageDone: 1200 },
        { Name: "Assist1", DamageDone: 800 },
        { Name: "Assist2", DamageDone: 500 },
        { Name: "Assist3", DamageDone: 300 }
    ]
};

// Function to show the test receipt
function showTestReceipt() {
    currentDeathIndex = 0;
    currentDeaths = [sampleDeathData];
    
    // Show loading state
    receiptContent.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
        </div>
    `;
    receiptModal.style.display = 'flex'; // Show the modal

    try {
        // Generate receipt with sample data
        generateBattleReceipt(sampleDeathData, 'deaths').then(receiptHTML => {
            receiptContent.innerHTML = receiptHTML;
        });
    } catch (error) {
        console.error('Error generating test receipt:', error);
        receiptContent.innerHTML = `<p>Error generating receipt. Please try again.</p>`;
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
    
    // Test receipt button
    document.getElementById('test-receipt').addEventListener('click', showTestReceipt);
}

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    checkStylesheets(); // Add this line to check stylesheets
    loadAllianceDeaths();
});
