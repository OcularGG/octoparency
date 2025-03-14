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
        </div>
    `;
    
    try {
        const deaths = await fetchAllianceDeaths();
        displayDeaths(deaths);
    } catch (error) {
        console.error('Error loading deaths:', error);
        deathsList.innerHTML = `
            <div class="empty-state">
                <p>Error loading deaths. Please try again.</p>
                <p>${error.message}</p>
            </div>
        `;
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
    loadAllianceDeaths();
});
