// DOM Elements
const deathsList = document.getElementById('deaths-list');
const refreshButton = document.getElementById('refresh-deaths');
const regionSelect = document.getElementById('region-select');
const receiptModal = document.getElementById('receipt-modal');
const receiptContent = document.getElementById('receipt-content');
const downloadButton = document.getElementById('download-receipt');
const closeButton = document.querySelector('.close-button');
const autoRefreshToggle = document.getElementById('auto-refresh-toggle');
const apiStatusMessage = document.getElementById('api-status-message');

const adminSection = document.getElementById('admin-section');
const errorLogContainer = document.getElementById('error-log');
const clearErrorLogBtn = document.getElementById('clear-error-log');
const exportErrorLogBtn = document.getElementById('export-error-log');

let currentEvents = [];
let currentEventIndex = null;
let autoRefreshInterval = null;
const AUTO_REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

function displayEvents(events) {
    if (!events || events.length === 0) {
        deathsList.innerHTML = `
            <div class="empty-state">
                <p>No recent events found for Double Overcharge alliance.</p>
                <p>Try selecting a different server region or check back later.</p>
            </div>
        `;
        return;
    }

    currentEvents = events; // Store the events
    deathsList.innerHTML = ''; // Clear existing list

    events.forEach((event, index) => {
        // Determine if this is a kill or death
        const isKill = event.eventType === 'kill' || 
                      (event.Killer && event.Killer.AllianceId === 'TH8JjVwVRiuFnalrzESkRQ');
                      
        const eventTime = new Date(event.TimeStamp);
        const eventItem = document.createElement('div');
        eventItem.classList.add('death-item');
        
        // Add class for styling based on event type
        eventItem.classList.add(isKill ? 'kill-event' : 'death-event');
        
        eventItem.innerHTML = `
            <div class="event-tag ${isKill ? 'kill-tag' : 'death-tag'}">${isKill ? 'Killmail' : 'Death'}</div>
            <h3>${event.Victim.Name}</h3>
            <div class="death-info">
                <div class="death-detail">
                    <span>Killed by</span>
                    <span>${event.Killer.Name}</span>
                </div>
                <div class="death-detail">
                    <span>Date</span>
                    <span>${eventTime.toLocaleDateString()}</span>
                </div>
                <div class="death-detail">
                    <span>Time</span>
                    <span>${eventTime.toLocaleTimeString()}</span>
                </div>
                <div class="death-detail">
                    <span>Fame</span>
                    <span>${event.TotalVictimKillFame.toLocaleString()}</span>
                </div>
            </div>
            <div class="death-actions">
                <button class="view-receipt" data-index="${index}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    View Receipt
                </button>
            </div>
        `;
        
        deathsList.appendChild(eventItem);
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
    const event = currentEvents[index];
    if (!event) return;
    
    currentEventIndex = index;
    
    // Show loading state
    receiptContent.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
        </div>
    `;
    receiptModal.style.display = 'flex'; // Show the modal

    try {
        // Generate receipt
        const receiptHTML = await generateBattleReceipt(event, 'events');
        receiptContent.innerHTML = receiptHTML;
    } catch (error) {
        console.error('Error generating receipt:', error);
        receiptContent.innerHTML = `<p>Error generating receipt. Please try again.</p>`;
    }
}

function downloadReceipt() {
    if (currentEventIndex === null) return;
    
    const event = currentEvents[currentEventIndex];
    if (!event) return;
    
    const img = document.querySelector('.receipt-img');
    if (!img) return;
    
    // Create download link
    const link = document.createElement('a');
    link.download = `event_receipt_${event.Victim.Name.replace(/\s+/g, '_')}_${new Date(event.TimeStamp).toISOString().split('T')[0]}.png`;
    link.href = img.src;
    link.click();
}

async function loadAllianceEvents() {
    deathsList.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            <p>Loading events...</p>
        </div>
    `;
    
    try {
        // Try to get cached events from the database
        const { data: cachedEvents, error: dbError } = await window.db.getEvents({
            limit: 200,
            allianceId: 'TH8JjVwVRiuFnalrzESkRQ'
        });
        
        if (cachedEvents && cachedEvents.length > 0) {
            console.log(`Displaying ${cachedEvents.length} cached events`);
            displayEvents(cachedEvents);
        }
        
        // Always fetch fresh data from the API with higher limit
        const apiEvents = await fetchAllianceEvents(200);
        
        if (apiEvents && apiEvents.length > 0) {
            await window.db.saveEvents(apiEvents);
            displayEvents(apiEvents);
            
            // Update the last refresh timestamp
            updateLastRefreshTime();
        } else {
            if (!cachedEvents || cachedEvents.length === 0) {
                deathsList.innerHTML = `
                    <div class="empty-state">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <h3>No Events Found</h3>
                        <p>No recent events found for Double Overcharge alliance.</p>
                        <p>Try selecting a different server region or check back later.</p>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error loading events:', error);
        deathsList.innerHTML = `
            <div class="error-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <h3>Error Loading Events</h3>
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
        document.getElementById('retry-button')?.addEventListener('click', loadAllianceEvents);
    }
}

/**
 * Update the last refresh timestamp display
 */
function updateLastRefreshTime() {
    const refreshTimeElement = document.getElementById('last-refresh-time');
    if (refreshTimeElement) {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        refreshTimeElement.textContent = timeString;
    }
}

/**
 * Toggle automatic refresh on/off
 * @param {boolean} enable - Whether to enable auto-refresh
 */
function toggleAutoRefresh(enable) {
    if (enable) {
        // Clear any existing interval
        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval);
        }
        
        // Set up a new interval
        autoRefreshInterval = setInterval(loadAllianceEvents, AUTO_REFRESH_INTERVAL_MS);
        
        // Update UI
        autoRefreshToggle.classList.add('active');
        autoRefreshToggle.title = 'Auto-refresh is ON (every 5 minutes)';
        
        // Save preference
        localStorage.setItem('autoRefreshEnabled', 'true');
    } else {
        // Clear the interval
        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval);
            autoRefreshInterval = null;
        }
        
        // Update UI
        autoRefreshToggle.classList.remove('active');
        autoRefreshToggle.title = 'Auto-refresh is OFF';
        
        // Save preference
        localStorage.setItem('autoRefreshEnabled', 'false');
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
    currentEventIndex = 0;
    currentEvents = [sampleDeathData];
    
    // Show loading state
    receiptContent.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
        </div>
    `;
    receiptModal.style.display = 'flex'; // Show the modal

    try {
        // Generate receipt with sample data
        generateBattleReceipt(sampleDeathData, 'events').then(receiptHTML => {
            receiptContent.innerHTML = receiptHTML;
        });
    } catch (error) {
        console.error('Error generating test receipt:', error);
        receiptContent.innerHTML = `<p>Error generating receipt. Please try again.</p>`;
    }
}

function updateApiStatus() {
    const status = window.getApiStatus();
    apiStatusMessage.textContent = `${status.message} (Proxy: ${status.proxy})`;
}

// Authentication variables
const AUTH_KEY = 'battletab_auth';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin';

// Login DOM Elements
const loginOverlay = document.getElementById('login-overlay');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');

// Admin buttons
const adminButtons = document.querySelectorAll('.admin-btn');

/**
 * Check if user is authenticated
 * @returns {boolean} Authentication status
 */
function isAuthenticated() {
    return localStorage.getItem(AUTH_KEY) === 'true';
}

/**
 * Set authentication state
 * @param {boolean} auth - Authentication state
 */
function setAuthenticated(auth) {
    if (auth) {
        localStorage.setItem(AUTH_KEY, 'true');
    } else {
        localStorage.removeItem(AUTH_KEY);
    }
    
    // Update UI based on authentication
    updateAuthUI();
}

/**
 * Update UI based on authentication state
 */
function updateAuthUI() {
    const isAuth = isAuthenticated();
    
    // Show/hide login overlay
    loginOverlay.style.display = isAuth ? 'none' : 'flex';
    
    // Show/hide logout button
    logoutBtn.style.display = isAuth ? 'block' : 'none';
    
    // Show/hide admin buttons
    adminButtons.forEach(btn => {
        btn.style.display = isAuth ? 'flex' : 'none';
    });
    
    // Show/hide admin section with error log
    if (adminSection) {
        adminSection.style.display = isAuth ? 'block' : 'none';
        
        // Update the error log if admin is logged in
        if (isAuth) {
            displayErrorLog(window.getApiErrorLog());
        }
    }
}

/**
 * Handle login form submission
 * @param {Event} e - Form submit event
 */
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        setAuthenticated(true);
        loginError.textContent = '';
    } else {
        loginError.textContent = 'Invalid username or password';
        setAuthenticated(false);
    }
}

/**
 * Handle logout button click
 */
function handleLogout() {
    setAuthenticated(false);
}

/**
 * Format and display the API error log
 * @param {Array} log - Error log entries
 */
function displayErrorLog(log) {
    if (!errorLogContainer) return;
    
    if (!log || log.length === 0) {
        errorLogContainer.innerHTML = '<div class="error-log-empty">No errors logged yet.</div>';
        return;
    }
    
    // Clear existing content
    errorLogContainer.innerHTML = '';
    
    // Add each log entry
    log.forEach((entry, index) => {
        const logEntry = document.createElement('div');
        logEntry.className = 'error-log-entry';
        
        // Format timestamp
        const timestamp = entry.timestamp ? new Date(entry.timestamp) : new Date();
        const timeString = timestamp.toLocaleString();
        
        // Build log entry content
        let entryHtml = `<div><span class="timestamp">[${timeString}]</span> `;
        
        // Add URL if available
        if (entry.url) {
            entryHtml += `<span class="url">${entry.url.substring(0, 80)}</span>`;
        } else if (entry.endpoint) {
            entryHtml += `<span class="url">Endpoint: ${entry.endpoint}</span>`;
        }
        
        // Add status code if available
        if (entry.status) {
            entryHtml += ` <span class="status">(${entry.status} ${entry.statusText || ''})</span>`;
        }
        
        entryHtml += '</div>';
        
        // Add error message/type
        if (entry.errorType) {
            entryHtml += `<div class="message">Error: ${entry.errorType}`;
            if (entry.errorMessage) {
                entryHtml += ` - ${entry.errorMessage}`;
            }
            entryHtml += '</div>';
        }
        
        // Add additional details
        const details = [];
        if (entry.proxyUsed) details.push(`Proxy: ${entry.proxyUsed}`);
        if (entry.attempt) details.push(`Attempt: ${entry.attempt}/${entry.maxAttempts}`);
        if (entry.requestDuration) details.push(`Duration: ${entry.requestDuration}ms`);
        
        if (details.length > 0) {
            entryHtml += `<div class="details">${details.join(' | ')}</div>`;
        }
        
        // Add raw response excerpt if available
        if (entry.rawResponse) {
            entryHtml += `<pre class="details">${entry.rawResponse.substring(0, 150)}${entry.rawResponse.length > 150 ? '...' : ''}</pre>`;
        }
        
        logEntry.innerHTML = entryHtml;
        errorLogContainer.appendChild(logEntry);
    });
}

/**
 * Clear the error log
 */
function clearErrorLog() {
    window.clearApiErrorLog();
    displayErrorLog([]);
}

/**
 * Export the error log to a downloadable file
 */
function exportErrorLog() {
    const log = window.getApiErrorLog();
    if (!log || log.length === 0) {
        alert('No errors to export.');
        return;
    }
    
    const logData = JSON.stringify(log, null, 2);
    const blob = new Blob([logData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `battletab-error-log-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 100);
}

function setupEventListeners() {
    // Refresh events when button is clicked
    refreshButton.addEventListener('click', loadAllianceEvents);
    
    // Toggle auto-refresh
    autoRefreshToggle.addEventListener('click', () => {
        const currentState = autoRefreshToggle.classList.contains('active');
        toggleAutoRefresh(!currentState);
    });
    
    // Change region and refresh events
    regionSelect.addEventListener('change', () => {
        setApiRegion(regionSelect.value);
        loadAllianceEvents();
    });
    
    // Close modal
    closeButton.addEventListener('click', () => {
        receiptModal.style.display = 'none';
        currentEventIndex = null;
    });
    
    // Close modal when clicking outside of it
    window.addEventListener('click', (event) => {
        if (event.target === receiptModal) {
            receiptModal.style.display = 'none';
            currentEventIndex = null;
        }
    });
    
    // Download receipt
    downloadButton.addEventListener('click', downloadReceipt);
    
    // Key press handlers
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && receiptModal.style.display === 'flex') {
            receiptModal.style.display = 'none';
            currentEventIndex = null;
        }
    });
    
    // Test receipt button
    document.getElementById('test-receipt').addEventListener('click', showTestReceipt);
    
    // Test API button
    document.getElementById('test-api').addEventListener('click', async () => {
        console.log('Test API button clicked'); // Add this line
        const result = await window.testApiConnection();
        updateApiStatus();
        alert(result.status.message);
    });
    
    // Authentication event listeners
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    
    // Error log buttons
    clearErrorLogBtn?.addEventListener('click', clearErrorLog);
    exportErrorLogBtn?.addEventListener('click', exportErrorLog);
    
    // Listen for error log updates
    document.addEventListener('apiErrorLogUpdated', (event) => {
        if (isAuthenticated()) {
            displayErrorLog(event.detail.log);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    checkStylesheets();
    
    // Check authentication status
    updateAuthUI();
    
    // Load initial data
    loadAllianceEvents();
    
    // Test API connection on load
    window.testApiConnection().then(() => updateApiStatus());
    
    // Check if auto-refresh was previously enabled
    const autoRefreshEnabled = localStorage.getItem('autoRefreshEnabled') === 'true';
    if (autoRefreshEnabled && isAuthenticated()) {
        toggleAutoRefresh(true);
    }
    
    // Initialize error log display if logged in
    if (isAuthenticated()) {
        displayErrorLog(window.getApiErrorLog());
    }
});
