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

// Add these variables for API safeguards
let rateLimitIndicator = document.getElementById('rate-limit-indicator');
let rateLimitProgress = document.getElementById('rate-limit-progress');
let rateLimitText = document.getElementById('rate-limit-text');
let rateLimitWarningModal = document.getElementById('rate-limit-warning-modal');
let rateLimitExceededModal = document.getElementById('rate-limit-exceeded-modal');
let apiErrorModal = document.getElementById('api-error-modal');
let cooldownTimer = document.getElementById('cooldown-timer');
let cooldownProgress = document.getElementById('cooldown-progress');
let warningCurrent = document.getElementById('warning-current');
let warningMax = document.getElementById('warning-max');
let apiErrorMessage = document.getElementById('api-error-message');
let apiErrorDetails = document.getElementById('api-error-details');
let apiRetryMessage = document.getElementById('api-retry-message');
let apiErrorRetry = document.getElementById('api-error-retry');

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

// Add button debounce protection
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Add throttle function to prevent rapid succession calls
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Update the API rate limit indicator
 */
function updateRateLimitIndicator() {
    if (!rateLimitIndicator) return;
    
    const status = window.getRateLimitStatus();
    
    // Update the progress bar
    rateLimitProgress.style.width = `${status.percentage}%`;
    
    // Update the text
    rateLimitText.textContent = `${status.current}/${status.max}`;
    
    // Update color based on usage
    if (status.percentage > 90) {
        rateLimitProgress.className = 'rate-limit-progress danger';
    } else if (status.percentage > 70) {
        rateLimitProgress.className = 'rate-limit-progress warning';
    } else {
        rateLimitProgress.className = 'rate-limit-progress';
    }
    
    // Show/hide based on usage
    if (status.current > 0 || status.inCooldown) {
        rateLimitIndicator.style.display = 'flex';
    } else {
        rateLimitIndicator.style.display = 'none';
    }
}

/**
 * Start cooldown timer animation
 * @param {number} seconds - Cooldown duration in seconds
 */
function startCooldownTimer(seconds) {
    if (!cooldownTimer) return;
    
    let timeLeft = seconds;
    cooldownTimer.textContent = timeLeft;
    cooldownProgress.style.width = '0%';
    
    // Update every second
    const timerInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            hideModal(rateLimitExceededModal);
            // Force refresh data after cooldown
            setTimeout(() => loadAllianceEvents(), 500);
        } else {
            cooldownTimer.textContent = timeLeft;
            const progressPercentage = ((seconds - timeLeft) / seconds) * 100;
            cooldownProgress.style.width = `${progressPercentage}%`;
        }
    }, 1000);
}

/**
 * Show a modal
 * @param {Element} modal - The modal element
 */
function showModal(modal) {
    if (!modal) return;
    
    // First hide any other visible modals
    document.querySelectorAll('.api-modal.show').forEach(m => {
        if (m !== modal) hideModal(m);
    });
    
    modal.classList.add('show');
    
    // Prevent scrolling of background content
    document.body.style.overflow = 'hidden';
}

/**
 * Hide a modal
 * @param {Element} modal - The modal element
 */
function hideModal(modal) {
    if (!modal) return;
    modal.classList.remove('show');
    
    // Restore scrolling if no other modals are visible
    if (!document.querySelector('.api-modal.show')) {
        document.body.style.overflow = '';
    }
}

// Apply throttling to API-intensive functions
const loadAllianceEventsThrottled = throttle(loadAllianceEvents, 2000); // 2 second minimum between refreshes

// Apply debounce to UI-triggered refreshes
const manualRefresh = debounce(() => {
    loadAllianceEvents();
}, 500);

// Enhanced loadAllianceEvents with better error handling
async function loadAllianceEvents() {
    // Don't attempt if in cooldown
    const rateLimitStatus = window.getRateLimitStatus();
    if (rateLimitStatus.inCooldown) {
        console.log('Skipping refresh due to API cooldown');
        return;
    }
    
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
        
        // Update API status after successful fetch
        updateApiStatus();
        updateRateLimitIndicator();
    } catch (error) {
        console.error('Error loading events:', error);
        
        // Show error state in the UI
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
        
        // Show API error modal
        apiErrorMessage.textContent = `Error loading events: ${error.message}`;
        apiErrorDetails.textContent = error.stack ? error.stack.split('\n')[0] : '';
        showModal(apiErrorModal);
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
    let statusText = status.message;
    
    // Update to show direct connection info instead of proxy
    if (status.direct) {
        statusText = `${status.message} (Direct API)`;
    }
    
    apiStatusMessage.textContent = statusText;
    
    // Add color coding based on status
    if (status.isWorking) {
        apiStatusMessage.classList.add('status-ok');
        apiStatusMessage.classList.remove('status-error');
    } else {
        apiStatusMessage.classList.add('status-error');
        apiStatusMessage.classList.remove('status-ok');
    }
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
    
    // Always hide login overlay by default
    loginOverlay.style.display = 'none';
    
    // Show admin login button only when not logged in
    const adminLoginBtn = document.getElementById('admin-login-btn');
    if (adminLoginBtn) {
        adminLoginBtn.style.display = isAuth ? 'none' : 'flex';
    }
    
    // Show/hide logout button
    if (logoutBtn) {
        logoutBtn.style.display = isAuth ? 'flex' : 'none';
    }
    
    // Show/hide admin buttons
    adminButtons.forEach(btn => {
        btn.style.display = isAuth ? 'inline-flex' : 'none';
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
 * Show login overlay when attempting to use admin features
 */
function promptLogin() {
    loginOverlay.style.display = 'flex';
    // Focus on username input for better usability
    document.getElementById('username')?.focus();
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
        loginOverlay.style.display = 'none';
    } else {
        loginError.textContent = 'Invalid username or password';
        loginError.style.color = '#ff5555';
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
 * Export the error log as a JSON file
 */
function exportErrorLog() {
    const log = window.getApiErrorLog();
    const blob = new Blob([JSON.stringify(log, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `battletab-error-log-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 100);
}

// Update setupEventListeners function to include the login cancel button
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
    document.getElementById('test-api')?.addEventListener('click', async () => {
        console.log('Testing direct API connection...');
        const result = await window.testApiConnection();
        updateApiStatus();
        
        // Show more details about the API test result
        let message = `API Test Result: ${result.success ? 'Success' : 'Failed'}`;
        if (result.data && result.data.Name) {
            message += `\nAlliance Name: ${result.data.Name}`;
        }
        if (result.duration) {
            message += `\nResponse Time: ${result.duration}ms`;
        }
        if (result.error) {
            message += `\nError: ${result.error}`;
        }
        
        alert(message);
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
    
    // Cancel login button
    document.getElementById('login-cancel')?.addEventListener('click', () => {
        loginOverlay.style.display = 'none';
    });
    
    // Close login on escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            if (receiptModal.style.display === 'flex') {
                receiptModal.style.display = 'none';
                currentEventIndex = null;
            }
            if (loginOverlay.style.display === 'flex') {
                loginOverlay.style.display = 'none';
            }
        }
    });

    // API Rate Limit Warning modal handlers
    document.querySelectorAll('.close-modal, .close-modal-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.api-modal');
            if (modal) hideModal(modal);
        });
    });
    
    // API error retry button
    apiErrorRetry?.addEventListener('click', () => {
        hideModal(apiErrorModal);
        setTimeout(() => loadAllianceEvents(), 500);
    });
    
    // Listen for API rate limit events
    document.addEventListener('apiRateLimitWarning', (event) => {
        const { current, max, percentage } = event.detail;
        warningCurrent.textContent = current;
        warningMax.textContent = max;
        showModal(rateLimitWarningModal);
    });
    
    document.addEventListener('apiRateLimitExceeded', (event) => {
        const { cooldownTime, cooldownUntil } = event.detail;
        cooldownTimer.textContent = cooldownTime;
        showModal(rateLimitExceededModal);
        startCooldownTimer(cooldownTime);
    });
    
    document.addEventListener('apiRateLimitUpdate', (event) => {
        updateRateLimitIndicator();
    });
    
    document.addEventListener('apiCooldownEnded', () => {
        updateRateLimitIndicator();
    });
    
    document.addEventListener('apiRequestError', (event) => {
        const { endpoint, attempt, maxAttempts, error, willRetry } = event.detail;
        console.log(`API error (${attempt}/${maxAttempts}):`, error);
        
        // Only show the error modal on final attempt
        if (!willRetry) {
            apiErrorMessage.textContent = `Error accessing API: ${error}`;
            apiErrorDetails.textContent = `Endpoint: ${endpoint}`;
            apiRetryMessage.textContent = willRetry ? 
                "The system will automatically retry shortly." : 
                "Maximum retry attempts reached. Please try again later.";
            showModal(apiErrorModal);
        }
    });
    
    // Admin login button
    document.getElementById('admin-login-btn')?.addEventListener('click', () => {
        promptLogin();
    });
}

// Update setupAdminFeatures to properly handle admin features
function setupAdminFeatures() {
    // Admin buttons that should trigger login when clicked if not authenticated
    document.querySelectorAll('.admin-btn').forEach(btn => {
        const originalOnClick = btn.onclick;
        btn.onclick = function(e) {
            if (!isAuthenticated()) {
                e.preventDefault();
                e.stopPropagation();
                promptLogin();
                return false;
            } else if (originalOnClick) {
                return originalOnClick.call(this, e);
            }
        };
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    setupAdminFeatures(); // Make sure this is called to set up admin access
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

    // Add environment indicator for preview environments
    const { environment } = getEnvironmentConfig();
    if (environment === 'preview') {
        const indicator = document.createElement('div');
        indicator.style.position = 'fixed';
        indicator.style.bottom = '10px';
        indicator.style.left = '10px';
        indicator.style.backgroundColor = '#ff6b00';
        indicator.style.color = 'white';
        indicator.style.padding = '5px 10px';
        indicator.style.borderRadius = '4px';
        indicator.style.fontSize = '12px';
        indicator.style.fontWeight = 'bold';
        indicator.style.zIndex = '9999';
        indicator.textContent = 'PREVIEW ENVIRONMENT';
        document.body.appendChild(indicator);
    }
});
