/**
 * api.js - Enhanced API client for Albion Online
 * 
 * Provides methods to search and retrieve data for any guild or alliance
 */

// Configuration
const API_CONFIG = {
    baseUrl: 'https://gameinfo-sgp.albiononline.com/api/gameinfo',
    retryAttempts: 3,
    retryDelay: 1000,
    cacheTime: 10 * 60 * 1000, // 10 minutes
};

// Cache system
const apiCache = new Map();

/**
 * Generic API request method with retry logic and caching
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Request options
 * @returns {Promise<any>} API response
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${API_CONFIG.baseUrl}${endpoint}`;
    const cacheKey = `${url}${JSON.stringify(options)}`;
    
    // Check cache first
    const cachedData = checkCache(cacheKey);
    if (cachedData) {
        console.log(`Using cached data for: ${endpoint}`);
        return cachedData;
    }
    
    // Show loading indicator
    document.dispatchEvent(new CustomEvent('api-loading-start', { 
        detail: { endpoint } 
    }));
    
    // Configure fetch options
    const fetchOptions = {
        method: options.method || 'GET',
        headers: {
            'Accept': 'application/json',
            ...options.headers
        },
        ...options
    };
    
    // Implement retry logic
    let lastError = null;
    for (let attempt = 0; attempt < API_CONFIG.retryAttempts; attempt++) {
        try {
            if (attempt > 0) {
                const delay = API_CONFIG.retryDelay * Math.pow(2, attempt - 1);
                console.log(`Retry ${attempt+1}/${API_CONFIG.retryAttempts} after ${delay}ms`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
            
            const response = await fetch(url, fetchOptions);
            
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Cache successful response
            cacheResponse(cacheKey, data);
            
            // Hide loading indicator
            document.dispatchEvent(new CustomEvent('api-loading-end', { 
                detail: { endpoint, success: true } 
            }));
            
            return data;
        } catch (error) {
            lastError = error;
            console.error(`API request failed (attempt ${attempt+1}):`, error);
        }
    }
    
    // Hide loading indicator with error
    document.dispatchEvent(new CustomEvent('api-loading-end', { 
        detail: { endpoint, success: false, error: lastError } 
    }));
    
    throw lastError;
}

/**
 * Check if a valid cache entry exists
 * @private
 */
function checkCache(key) {
    if (!apiCache.has(key)) return null;
    
    const cacheEntry = apiCache.get(key);
    if (Date.now() > cacheEntry.expiry) {
        apiCache.delete(key);
        return null;
    }
    
    return cacheEntry.data;
}

/**
 * Cache an API response
 * @private
 */
function cacheResponse(key, data) {
    apiCache.set(key, {
        data,
        expiry: Date.now() + API_CONFIG.cacheTime
    });
}

/**
 * Search for a guild by name
 * @param {string} guildName - Name of the guild to search for
 * @returns {Promise<Object>} Guild data
 */
async function searchGuild(guildName) {
    try {
        const endpoint = `/search?q=${encodeURIComponent(guildName)}&types=guild`;
        const data = await apiRequest(endpoint);
        return data.guilds || [];
    } catch (error) {
        console.error(`Failed to search for guild: ${error.message}`);
        throw error;
    }
}

/**
 * Search for an alliance by name
 * @param {string} allianceName - Name of the alliance to search for
 * @returns {Promise<Object>} Alliance data
 */
async function searchAlliance(allianceName) {
    try {
        const endpoint = `/search?q=${encodeURIComponent(allianceName)}&types=alliance`;
        const data = await apiRequest(endpoint);
        return data.alliances || [];
    } catch (error) {
        console.error(`Failed to search for alliance: ${error.message}`);
        throw error;
    }
}

// Export the API functions to the window object
window.searchGuild = searchGuild;
window.searchAlliance = searchAlliance;