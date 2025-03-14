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
const CORS_PROXIES = [
    'https://corsproxy.io/?',
    'https://api.allorigins.win/raw?url=',
    'https://cors-anywhere.herokuapp.com/'
];

let currentProxyIndex = 0;
const DOUBLE_OVERCHARGE_ID = 'TH8JjVwVRiuFnalrzESkRQ'; // Alliance ID
let selectedRegion = 'americas';

// Store the result of connectivity tests
let apiStatus = {
    lastChecked: null,
    isWorking: false,
    message: 'API status unknown',
    proxy: CORS_PROXIES[0]
};

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
 * Try to use a different CORS proxy
 * @returns {string} - The new CORS proxy URL
 */
function switchCorsProxy() {
    currentProxyIndex = (currentProxyIndex + 1) % CORS_PROXIES.length;
    const newProxy = CORS_PROXIES[currentProxyIndex];
    console.log('Switching to CORS proxy:', newProxy);
    apiStatus.proxy = newProxy;
    return newProxy;
}

/**
 * Constructs a URL with the current CORS proxy
 * @param {string} endpoint - API endpoint to call
 * @returns {string} - Full URL with proxy
 */
function getProxiedUrl(endpoint) {
    const baseUrl = API_BASE_URLS[selectedRegion];
    return `${apiStatus.proxy}${encodeURIComponent(baseUrl + endpoint)}`;
}

/**
 * Make a fetch request with retry logic for CORS issues
 * @param {string} endpoint - API endpoint to call
 * @returns {Promise<any>} - Promise resolving to JSON response
 */
async function fetchWithRetry(endpoint) {
    let attempts = 0;
    const maxAttempts = CORS_PROXIES.length * 2;
    
    while (attempts < maxAttempts) {
        try {
            const url = getProxiedUrl(endpoint);
            console.log(`Attempt ${attempts + 1}/${maxAttempts} for: ${url}`);
            
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json',
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            apiStatus.isWorking = true;
            apiStatus.lastChecked = new Date();
            apiStatus.message = 'API connection working';
            return data;
        } catch (error) {
            attempts++;
            console.error(`API fetch attempt ${attempts} failed:`, error);
            
            // Switch to next proxy if we've tried this one twice
            if (attempts % 2 === 0) {
                switchCorsProxy();
            }
            
            // If we've tried all proxies multiple times, give up
            if (attempts >= maxAttempts) {
                apiStatus.isWorking = false;
                apiStatus.message = `Failed after ${maxAttempts} attempts: ${error.message}`;
                throw new Error(`Failed to fetch after ${maxAttempts} attempts: ${error.message}`);
            }
            
            // Wait a bit before retrying
            await new Promise(r => setTimeout(r, 1000));
        }
    }
}

/**
 * Fetch deaths for the Double Overcharge alliance
 * @param {number} limit - Maximum number of deaths to fetch
 * @returns {Promise<Array>} - Array of death objects
 */
async function fetchAllianceDeaths(limit = 50) {
    try {
        // First try: alliance deaths endpoint
        const allianceEndpoint = `/alliances/${DOUBLE_OVERCHARGE_ID}/deaths?limit=${limit}`;
        console.log('Fetching alliance deaths from:', allianceEndpoint);
        
        try {
            const deaths = await fetchWithRetry(allianceEndpoint);
            console.log(`Successfully fetched ${deaths.length} deaths`);
            return deaths;
        } catch (error) {
            console.warn('Alliance deaths endpoint failed, trying backup method:', error.message);
            
            // Second try: general events endpoint filtered for our alliance
            const eventsEndpoint = `/events?limit=100`;
            const events = await fetchWithRetry(eventsEndpoint);
            
            console.log(`Fetched ${events.length} events, filtering for alliance deaths`);
            
            // Filter for events where victim is in Double Overcharge alliance
            const allianceDeaths = events.filter(event => 
                event.Victim && 
                event.Victim.AllianceId === DOUBLE_OVERCHARGE_ID
            );
            
            console.log(`Found ${allianceDeaths.length} alliance deaths in events`);
            return allianceDeaths.slice(0, limit);
        }
    } catch (error) {
        console.error('All fetch methods failed:', error);
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
        const data = await fetchWithRetry(testEndpoint);
        
        apiStatus.isWorking = true;
        apiStatus.lastChecked = new Date();
        apiStatus.message = `Connected to API, alliance name: ${data.Name || 'N/A'}`;
        console.log('API test successful:', apiStatus);
        
        return {
            success: true,
            data: data,
            status: apiStatus
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
window.testApiConnection = testApiConnection;
window.getApiStatus = () => apiStatus;
