/**
 * API connection and data fetching
 * Handles communication with Albion Online API via CORS proxy
 */

// API configuration
const API_BASE_URLS = {
    americas: 'https://gameinfo.albiononline.com/api/gameinfo',
    europe: 'https://gameinfo-ams.albiononline.com/api/gameinfo',
    asia: 'https://gameinfo-sgp.albiononline.com/api/gameinfo'
};

// We will try multiple CORS proxies if the primary one fails
// Updated with more reliable proxies and proper configuration
const CORS_PROXIES = [
    'https://corsproxy.io/?',
    'https://proxy.cors.sh/',
    'https://cors.eu.org/',
    'https://api.allorigins.win/raw?url=',
    'https://crossorigin.me/'
];

let currentProxyIndex = 0;
const DOUBLE_OVERCHARGE_ID = 'TH8JjVwVRiuFnalrzESkRQ'; // Alliance ID
let selectedRegion = 'americas';

// Added cache management
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds
const API_CACHE_KEY = 'battletab_api_cache';
const apiCache = loadCacheFromStorage();

// Rate limiting configuration
const RATE_LIMIT = {
    maxRequests: 10,        // Maximum requests in time window
    timeWindow: 60 * 1000,  // 1 minute window
    requests: [],           // Array to track request timestamps
    cooldown: false,        // Flag to indicate if we're in cooldown
    cooldownTime: 2 * 60 * 1000, // 2 minutes cooldown if rate limit hit
    cooldownUntil: null     // Timestamp when cooldown ends
};

// Store the result of connectivity tests
let apiStatus = {
    lastChecked: null,
    isWorking: false,
    message: 'API status unknown',
    proxy: CORS_PROXIES[0]
};

// Create error logging system
const ERROR_LOG_KEY = 'battletab_error_log';
const MAX_LOG_ENTRIES = 100;

/**
 * Load cache from localStorage
 */
function loadCacheFromStorage() {
    try {
        const cache = JSON.parse(localStorage.getItem(API_CACHE_KEY) || '{}');
        
        // Clean expired cache entries
        const now = Date.now();
        for (const key in cache) {
            if (cache[key].expiry < now) {
                delete cache[key];
            }
        }
        
        return cache;
    } catch (e) {
        console.warn('Failed to load cache from localStorage:', e);
        return {};
    }
}

/**
 * Save cache to localStorage
 */
function saveCacheToStorage() {
    try {
        localStorage.setItem(API_CACHE_KEY, JSON.stringify(apiCache));
    } catch (e) {
        console.warn('Failed to save cache to localStorage:', e);
    }
}

/**
 * Check if a request would exceed rate limits
 * @returns {boolean} - True if request is allowed, false if rate limited
 */
function checkRateLimit() {
    const now = Date.now();
    
    // Check if we're in cooldown
    if (RATE_LIMIT.cooldown && RATE_LIMIT.cooldownUntil) {
        if (now < RATE_LIMIT.cooldownUntil) {
            const waitTime = Math.ceil((RATE_LIMIT.cooldownUntil - now) / 1000);
            console.warn(`Rate limit cooldown in effect. Please wait ${waitTime} seconds.`);
            logApiError({
                errorType: 'rate_limit_cooldown',
                errorMessage: `In cooldown period, please wait ${waitTime} seconds`,
                timestamp: new Date().toISOString()
            });
            return false;
        } else {
            // Cooldown period is over
            RATE_LIMIT.cooldown = false;
            RATE_LIMIT.requests = [];
        }
    }
    
    // Filter out requests older than the time window
    RATE_LIMIT.requests = RATE_LIMIT.requests.filter(time => time > now - RATE_LIMIT.timeWindow);
    
    // Check if we've hit the limit
    if (RATE_LIMIT.requests.length >= RATE_LIMIT.maxRequests) {
        console.warn(`Rate limit reached (${RATE_LIMIT.maxRequests} requests in ${RATE_LIMIT.timeWindow/1000}s). Entering cooldown.`);
        
        // Enter cooldown mode
        RATE_LIMIT.cooldown = true;
        RATE_LIMIT.cooldownUntil = now + RATE_LIMIT.cooldownTime;
        
        logApiError({
            errorType: 'rate_limit_exceeded',
            errorMessage: `Exceeded ${RATE_LIMIT.maxRequests} requests in ${RATE_LIMIT.timeWindow/1000}s window`,
            timestamp: new Date().toISOString()
        });
        
        return false;
    }
    
    // Record this request time
    RATE_LIMIT.requests.push(now);
    return true;
}

/**
 * Log an API error with details
 * @param {Object} errorInfo - Error information object
 */
function logApiError(errorInfo) {
    try {
        // Get current log
        const currentLog = JSON.parse(localStorage.getItem(ERROR_LOG_KEY) || '[]');
        
        // Add timestamp if not provided
        if (!errorInfo.timestamp) {
            errorInfo.timestamp = new Date().toISOString();
        }
        
        // Add to beginning of array for reverse chronological order
        currentLog.unshift(errorInfo);
        
        // Limit log size
        if (currentLog.length > MAX_LOG_ENTRIES) {
            currentLog.length = MAX_LOG_ENTRIES;
        }
        
        // Save back to localStorage
        localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(currentLog));
        
        // Dispatch event for UI update
        const logUpdatedEvent = new CustomEvent('apiErrorLogUpdated', { 
            detail: { log: currentLog }
        });
        document.dispatchEvent(logUpdatedEvent);
        
        console.error('API Error:', errorInfo);
    } catch (e) {
        console.error('Error logging API error:', e);
    }
}

/**
 * Get the current error log
 * @returns {Array} - Array of error log entries
 */
function getApiErrorLog() {
    try {
        return JSON.parse(localStorage.getItem(ERROR_LOG_KEY) || '[]');
    } catch (e) {
        console.error('Error retrieving API error log:', e);
        return [];
    }
}

/**
 * Clear the error log
 */
function clearApiErrorLog() {
    localStorage.removeItem(ERROR_LOG_KEY);
    
    // Dispatch event for UI update
    const logUpdatedEvent = new CustomEvent('apiErrorLogUpdated', { 
        detail: { log: [] }
    });
    document.dispatchEvent(logUpdatedEvent);
}

/**
 * Set the API region
 * @param {string} region - Region to use for API calls
 * @returns {boolean} - Whether the region was valid
 */
function setApiRegion(region) {
    if (API_BASE_URLS[region]) {
        selectedRegion = region;
        console.log('API region set to:', region);
        return true;
    } else {
        console.error('Invalid region:', region);
        return false;
    }
}

/**
 * Try to use a different CORS proxy with exponential backoff delay
 * @param {number} attempt - Current attempt number
 * @returns {Promise<string>} - The new CORS proxy URL
 */
async function switchCorsProxy(attempt = 0) {
    currentProxyIndex = (currentProxyIndex + 1) % CORS_PROXIES.length;
    const newProxy = CORS_PROXIES[currentProxyIndex];
    console.log('Switching to CORS proxy:', newProxy);
    apiStatus.proxy = newProxy;
    
    // Calculate exponential backoff delay (100ms, 200ms, 400ms, 800ms, etc.)
    const backoffDelay = Math.min(2000, 100 * Math.pow(2, attempt));
    
    // Reset failed request count when switching proxies
    // This gives each proxy a fair chance
    if (attempt > 0 && attempt % CORS_PROXIES.length === 0) {
        console.log('Tried all proxies, resetting rate limit tracking');
        RATE_LIMIT.requests = [];
        RATE_LIMIT.cooldown = false;
    }
    
    // Wait before returning to avoid hammering the new proxy immediately
    await new Promise(resolve => setTimeout(resolve, backoffDelay));
    
    return newProxy;
}

/**
 * Constructs a URL with the current CORS proxy
 * @param {string} endpoint - API endpoint to call
 * @returns {string} - Full URL with proxy
 */
function getProxiedUrl(endpoint) {
    // Ensure endpoint starts with /
    if (!endpoint.startsWith('/')) {
        endpoint = '/' + endpoint;
    }
    
    const baseUrl = API_BASE_URLS[selectedRegion];
    
    // Handle proxy-specific URL formatting
    const proxy = apiStatus.proxy;
    if (proxy === 'https://api.allorigins.win/raw?url=') {
        // This proxy requires full URL encoding
        return `${proxy}${encodeURIComponent(baseUrl + endpoint)}`;
    } else if (proxy === 'https://corsproxy.io/?') {
        // This proxy expects the URL right after the ?
        return `${proxy}${encodeURIComponent(baseUrl + endpoint)}`;
    } else {
        // Most proxies expect the URL to be appended directly
        return `${proxy}${baseUrl}${endpoint}`;
    }
}

/**
 * Make a fetch request with retry logic for CORS issues
 * @param {string} endpoint - API endpoint to call
 * @param {boolean} useCache - Whether to use cache for this request
 * @returns {Promise<any>} - Promise resolving to JSON response
 */
async function fetchWithRetry(endpoint, useCache = true) {
    // Check cache first if enabled
    const cacheKey = endpoint;
    if (useCache && apiCache[cacheKey] && apiCache[cacheKey].expiry > Date.now()) {
        console.log(`Using cached data for ${endpoint}`);
        return apiCache[cacheKey].data;
    }
    
    // Check rate limits
    if (!checkRateLimit()) {
        throw new Error('Rate limit exceeded, please wait before making more requests');
    }
    
    let attempts = 0;
    const maxAttempts = CORS_PROXIES.length * 2;
    
    while (attempts < maxAttempts) {
        try {
            const url = getProxiedUrl(endpoint);
            console.log(`Attempt ${attempts + 1}/${maxAttempts} for: ${url}`);
            
            const requestStartTime = Date.now();
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'BattleTab/1.0 (https://github.com/yourusername/battletab)',
                }
            });
            const requestDuration = Date.now() - requestStartTime;
            
            if (!response.ok) {
                console.error(`HTTP error ${response.status}: ${response.statusText}`);
                
                // Log the error
                logApiError({
                    endpoint,
                    url,
                    proxyUsed: apiStatus.proxy,
                    status: response.status,
                    statusText: response.statusText,
                    attempt: attempts + 1,
                    maxAttempts,
                    requestDuration,
                    errorType: 'http_error'
                });
                
                throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
            }
            
            const text = await response.text(); // Get response as text
            let data;
            try {
                data = JSON.parse(text); // Try to parse JSON
            } catch (e) {
                console.error('JSON parsing error:', e);
                console.log('Response text:', text.substring(0, 200)); // Show first 200 chars
                
                // Log the parsing error
                logApiError({
                    endpoint,
                    url,
                    proxyUsed: apiStatus.proxy,
                    attempt: attempts + 1,
                    maxAttempts,
                    requestDuration,
                    errorType: 'json_parse_error',
                    rawResponse: text.substring(0, 1000), // Limit size
                    parseError: e.toString()
                });
                
                throw e;
            }
            
            // Update API status
            apiStatus.isWorking = true;
            apiStatus.lastChecked = new Date();
            apiStatus.message = 'API connection working';
            
            // Cache the response
            if (useCache) {
                apiCache[cacheKey] = {
                    data,
                    expiry: Date.now() + CACHE_DURATION
                };
                saveCacheToStorage();
            }
            
            return data;
        } catch (error) {
            attempts++;
            console.error(`API fetch attempt ${attempts} failed:`, error);
            
            // Log network errors
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                logApiError({
                    endpoint,
                    url: getProxiedUrl(endpoint),
                    proxyUsed: apiStatus.proxy,
                    attempt: attempts,
                    maxAttempts,
                    errorType: 'network_error',
                    errorMessage: error.toString()
                });
            }
            
            // Switch to next proxy if we've tried this one
            if (attempts % 2 === 0) {
                await switchCorsProxy(Math.floor(attempts / 2));
            }
            
            // If we've tried all proxies multiple times, give up
            if (attempts >= maxAttempts) {
                apiStatus.isWorking = false;
                apiStatus.message = `Failed after ${maxAttempts} attempts: ${error.message}`;
                
                // Final error log entry
                logApiError({
                    endpoint,
                    proxyUsed: apiStatus.proxy,
                    errorType: 'max_attempts_reached',
                    errorMessage: error.toString(),
                    totalAttempts: attempts
                });
                
                throw new Error(`Failed to fetch after ${maxAttempts} attempts: ${error.message}`);
            }
            
            // Wait before retrying with exponential backoff
            const backoffDelay = Math.min(5000, 200 * Math.pow(2, Math.floor(attempts / 2)));
            await new Promise(r => setTimeout(r, backoffDelay));
        }
    }
}

/**
 * Fetch deaths for the Double Overcharge alliance
 * @param {number} limit - Maximum number of deaths to fetch
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Array>} - Array of death objects
 */
async function fetchAllianceDeaths(limit = 50, offset = 0) {
    try {
        // First try: alliance deaths endpoint with pagination
        const allianceEndpoint = `/alliances/${DOUBLE_OVERCHARGE_ID}/deaths?limit=${limit}&offset=${offset}`;
        console.log('Fetching alliance deaths from:', allianceEndpoint);
        
        try {
            const deaths = await fetchWithRetry(allianceEndpoint);
            console.log(`Successfully fetched ${deaths.length} deaths`);
            // Tag each death event as a "death"
            deaths.forEach(death => death.eventType = 'death');
            return deaths;
        } catch (error) {
            console.warn('Alliance deaths endpoint failed, trying backup method:', error.message);
            
            // Second try: general events endpoint filtered for our alliance
            const eventsEndpoint = `/events?limit=100&offset=${offset}`;
            const events = await fetchWithRetry(eventsEndpoint);
            
            console.log(`Fetched ${events.length} events, filtering for alliance deaths`);
            
            // Filter for events where victim is in Double Overcharge alliance
            const allianceDeaths = events.filter(event => 
                event.Victim && 
                event.Victim.AllianceId === DOUBLE_OVERCHARGE_ID
            );
            
            // Tag each death event as a "death"
            allianceDeaths.forEach(death => death.eventType = 'death');
            
            console.log(`Found ${allianceDeaths.length} alliance deaths in events`);
            return allianceDeaths.slice(0, limit);
        }
    } catch (error) {
        console.error('All fetch methods failed:', error);
        throw error;
    }
}

/**
 * Fetch kills for the Double Overcharge alliance
 * @param {number} limit - Maximum number of kills to fetch
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Array>} - Array of kill objects
 */
async function fetchAllianceKills(limit = 50, offset = 0) {
    try {
        // First try: alliance kills endpoint with pagination
        const allianceEndpoint = `/alliances/${DOUBLE_OVERCHARGE_ID}/kills?limit=${limit}&offset=${offset}`;
        console.log('Fetching alliance kills from:', allianceEndpoint);
        
        try {
            const kills = await fetchWithRetry(allianceEndpoint);
            console.log(`Successfully fetched ${kills.length} kills`);
            // Tag each kill event as a "kill"
            kills.forEach(kill => kill.eventType = 'kill');
            return kills;
        } catch (error) {
            console.warn('Alliance kills endpoint failed, trying backup method:', error.message);
            
            // Second try: general events endpoint filtered for our alliance
            const eventsEndpoint = `/events?limit=100&offset=${offset}`;
            const events = await fetchWithRetry(eventsEndpoint);
            
            console.log(`Fetched ${events.length} events, filtering for alliance kills`);
            
            // Filter for events where killer is in Double Overcharge alliance
            const allianceKills = events.filter(event => 
                event.Killer && 
                event.Killer.AllianceId === DOUBLE_OVERCHARGE_ID
            );
            
            // Tag each kill event as a "kill"
            allianceKills.forEach(kill => kill.eventType = 'kill');
            
            console.log(`Found ${allianceKills.length} alliance kills in events`);
            return allianceKills.slice(0, limit);
        }
    } catch (error) {
        console.error('All fetch methods failed:', error);
        throw error;
    }
}

/**
 * Fetch both deaths and kills for the Double Overcharge alliance
 * @param {number} limit - Maximum number of events to fetch (will be split between deaths and kills)
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Array>} - Array of death and kill objects
 */
async function fetchAllianceEvents(limit = 50, offset = 0) {
    try {
        // Fetch both deaths and kills in parallel
        const [deaths, kills] = await Promise.all([
            fetchAllianceDeaths(limit / 2, offset),
            fetchAllianceKills(limit / 2, offset)
        ]);
        
        // Combine and sort by timestamp (newest first)
        const allEvents = [...deaths, ...kills].sort((a, b) => 
            new Date(b.TimeStamp) - new Date(a.TimeStamp)
        );
        
        console.log(`Combined ${deaths.length} deaths and ${kills.length} kills`);
        return allEvents;
    } catch (error) {
        console.error('Failed to fetch alliance events:', error);
        throw error;
    }
}

/**
 * Test API connectivity and display status
 * @returns {Promise<Object>} - API status object
 */
async function testApiConnection() {
    try {
        const testEndpoint = `/alliances/${DOUBLE_OVERCHARGE_ID}`;
        console.log('Testing API connection with endpoint:', testEndpoint);
        
        const testStartTime = Date.now();
        const data = await fetchWithRetry(testEndpoint);
        const testDuration = Date.now() - testStartTime;
        
        apiStatus.isWorking = true;
        apiStatus.lastChecked = new Date();
        apiStatus.message = `Connected to API, alliance name: ${data.Name || 'N/A'}`;
        console.log('API test successful:', apiStatus);
        
        return {
            success: true,
            data: data,
            status: apiStatus,
            duration: testDuration
        };
    } catch (error) {
        apiStatus.isWorking = false;
        apiStatus.lastChecked = new Date();
        apiStatus.message = `API test failed: ${error.message}`;
        console.error('API test failed:', error);
        
        return {
            success: false,
            error: error.message,
            status: apiStatus
        };
    }
}

// Expose functions to global scope
window.setApiRegion = setApiRegion;
window.fetchAllianceDeaths = fetchAllianceDeaths;
window.fetchAllianceKills = fetchAllianceKills;
window.fetchAllianceEvents = fetchAllianceEvents;
window.testApiConnection = testApiConnection;
window.getApiStatus = () => apiStatus;

// Expose error logging functions
window.getApiErrorLog = getApiErrorLog;
window.clearApiErrorLog = clearApiErrorLog;
window.logApiError = logApiError; // For manual logging

// Add this at the end of the file - for preview environment support
// Test if we're in a preview environment
const { environment } = getEnvironmentConfig();
if (environment === 'preview') {
    console.log('%cPREVIEW ENVIRONMENT', 'background: #ff6b00; color: white; padding: 2px 5px; border-radius: 2px;');
    
    // Tag all API requests with preview info
    const originalFetchWithRetry = fetchWithRetry;
    window.fetchWithRetry = async function(endpoint, useCache = true) {
        console.log(`[PREVIEW] Fetching: ${endpoint}`);
        return originalFetchWithRetry(endpoint, useCache);
    };
}