// DOM Elements
const deathsList = document.getElementById('deaths-list');
const refreshButton = document.getElementById('refresh-deaths');
const regionSelect = document.getElementById('region-select');
const receiptModal = document.getElementById('receipt-modal');
const receiptContent = document.getElementById('receipt-content');
const downloadButton = document.getElementById('download-receipt');
const closeButton = document.querySelector('.close-button');

let currentDeaths = [];

function displayDeaths(deaths) {
    deathsList.innerHTML = ''; // Clear existing list
    if (!deaths) {
        deathsList.innerHTML = '<p>Failed to load deaths.</p>';
        return;
    }

    currentDeaths = deaths; // Store the deaths

    deaths.forEach((death, index) => {
        const deathItem = document.createElement('div');
        deathItem.classList.add('death-item');
        deathItem.innerHTML = `
            <h3>${death.Victim.Name}</h3>
            <p>Killed by: ${death.Killer.Name}</p>
            <button class="view-receipt" data-index="${index}">View Receipt</button>
        `;
        deathsList.appendChild(deathItem);
    });
}

async function showReceipt(index) {
    const death = currentDeaths[index];
    if (!death) return;

    const receiptHTML = await generateReceipt(death);
    receiptContent.innerHTML = receiptHTML;
    receiptModal.style.display = 'flex'; // Show the modal
}

function downloadReceipt() {
    // Implement download logic here
    alert('Download functionality will be implemented here.');
}

function setupEventListeners() {
    refreshButton.addEventListener('click', async () => {
        const deaths = await window.fetchAllianceDeaths();
        displayDeaths(deaths);
    });

    regionSelect.addEventListener('change', (event) => {
        window.setApiRegion(event.target.value);
    });

    deathsList.addEventListener('click', (event) => {
        if (event.target.classList.contains('view-receipt')) {
            const index = event.target.dataset.index;
            showReceipt(index);
        }
    });

    closeButton.addEventListener('click', () => {
        receiptModal.style.display = 'none';
    });

    downloadButton.addEventListener('click', downloadReceipt);
}

document.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();
    const initialDeaths = await window.fetchAllianceDeaths();
    displayDeaths(initialDeaths);
});
