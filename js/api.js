const API_BASE_URLS = {
    americas: 'https://gameinfo.albiononline.com/api/gameinfo',
    europe: 'https://gameinfo-ams.albiononline.com/api/gameinfo',
    asia: 'https://gameinfo-sgp.albiononline.com/api/gameinfo'
};

// Default to Americas server
let selectedRegion = 'americas';

// Using a public CORS proxy to avoid CORS issues
const CORS_PROXY = 'https://corsproxy.io/?';

// Debug flag to help troubleshoot issues
const DEBUG = true;

/**
 * Set the API region
 * @param {string} region - The region to set ('americas', 'europe', 'asia')
 */
function setApiRegion(region) {
    if (API_BASE_URLS[region]) {
        selectedRegion = region;
        if (DEBUG) console.log('API region set to:', region);
    } else {
        console.error('Invalid region specified:', region);
    }
}

/**
 * Get API URL with CORS proxy
 * @param {string} endpoint - The API endpoint
 * @returns {string} - The complete URL
 */
function getApiUrl(endpoint) {
    const url = `${CORS_PROXY}${API_BASE_URLS[selectedRegion]}${endpoint}`;
    if (DEBUG) console.log('API Request URL:', url);
    return url;
}

/**
 * Search for players by name
 * @param {string} searchTerm - Player name to search for
 * @returns {Promise} Promise with search results
 */
async function searchPlayers(searchTerm) {
    try {
        const response = await fetch(getApiUrl(`/search?q=${encodeURIComponent(searchTerm)}`));
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data.players || [];
    } catch (error) {
        console.error('Error searching players:', error);
        return [];
    }
}

/**
 * Get player kills
 * @param {string} playerId - Player ID
 * @returns {Promise} Promise with player kills
 */
async function getPlayerKills(playerId) {
    try {
        const response = await fetch(getApiUrl(`/players/${playerId}/kills`));
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching player kills:', error);
        return [];
    }
}

/**
 * Get player deaths
 * @param {string} playerId - Player ID
 * @returns {Promise} Promise with player deaths
 */
async function getPlayerDeaths(playerId) {
    try {
        const response = await fetch(getApiUrl(`/players/${playerId}/deaths`));
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching player deaths:', error);
        return [];
    }
}

/**
 * Get event/killmail details
 * @param {string} eventId - Event/kill ID
 * @returns {Promise} Promise with event details
 */
async function getEventDetails(eventId) {
    try {
        const response = await fetch(getApiUrl(`/events/${eventId}`));
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching event details:', error);
        return null;
    }
}

/**
 * Get item data (for displaying equipment)
 * @param {string} itemId - Item ID
 * @returns {Promise} Promise with item details
 */
async function getItemData(itemId) {
    try {
        const response = await fetch(getApiUrl(`/items/${itemId}/data`));
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching item data:', error);
        return null;
    }
}

/**
 * Get alliance deaths
 * @param {string} allianceId - Alliance ID
 * @param {number} limit - Maximum number of deaths to retrieve
 * @returns {Promise} Promise with alliance deaths
 */
async function getAllianceDeaths(allianceId, limit = 50) {
    try {
        // First attempt - try the specific alliance deaths endpoint if it exists
        try {
            const response = await fetch(getApiUrl(`/alliances/${allianceId}/deaths?limit=${limit}`));
            if (response.ok) {
                return await response.json();
            }
        } catch (e) {
            console.log('Direct alliance deaths endpoint failed, trying alternative method');
        }
        
        // Alternative - search recent deaths and filter
        const allDeathsResponse = await fetch(getApiUrl(`/events?limit=${limit*2}`));
        if (!allDeathsResponse.ok) {
            throw new Error('Network response was not ok');
        }
        
        const allDeaths = await allDeathsResponse.json();
        
        // Filter deaths for Double Overcharge alliance
        const allianceDeaths = allDeaths.filter(death => 
            death.Victim && 
            death.Victim.AllianceId === allianceId
        );
        
        return allianceDeaths.slice(0, limit);
    } catch (error) {
        console.error('Error fetching alliance deaths:', error);
        return [];
    }
}

/**
 * Get alliance info
 * @param {string} allianceId - Alliance ID
 * @returns {Promise} Promise with alliance info
 */
async function getAllianceInfo(allianceId) {
    try {
        const response = await fetch(getApiUrl(`/alliances/${allianceId}`));
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching alliance info:', error);
        return null;
    }
}

/**
 * List all available API endpoints
 */
function listApiEndpoints() {
    const endpoints = [
        '/search?q=<search_term>',
        '/players/<ID>',
        '/players/<ID>/deaths',
        '/players/<ID>/kills',
        '/players/statistics',
        '/guilds/<ID>',
        '/guilds/<ID>/members',
        '/guilds/<ID>/data',
        '/guilds/<ID>/top',
        '/alliances/<ID>',
        '/battles',
        '/battles/<ID>',
        '/battle/<ID>',
        '/items/<ID>',
        '/items/<ID>/data',
        '/items/<ID>/_itemCategoryTree',
        '/matches/crystal',
        '/matches/crystal/<ID>',
        '/guildmatches/top',
        '/guildmatches/next',
        '/guildmatches/past',
        '/guildmatches/<ID>',
        '/events/playerfame',
        '/events/guildfame',
        '/guilds/topguildsbyattacks',
        '/guilds/topguildsbydefenses',
        '/events/playerweaponfame',
        '/items/_weaponCategories',
        '/events/killfame',
        '/events',
        '/events/<ID>'
    ];
    console.log('Available API endpoints:', endpoints);
}

// Test API connection
function testApiConnection() {
    console.log('Testing API connection...');
    getAllianceInfo('TH8JjVwVRiuFnalrzESkRQ')
        .then(data => {
            console.log('Alliance info:', data);
            getAllianceDeaths('TH8JjVwVRiuFnalrzESkRQ', 5)
                .then(deaths => {
                    console.log('Sample deaths:', deaths);
                })
                .catch(err => {
                    console.error('Error getting deaths:', err);
                });
        })
        .catch(error => {
            console.error('API test error:', error);
        });
}

// Export functions for use in main.js
window.setApiRegion = setApiRegion;
window.getAllianceDeaths = getAllianceDeaths;
window.getAllianceInfo = getAllianceInfo;
window.testApiConnection = testApiConnection;
window.listApiEndpoints = listApiEndpoints;
