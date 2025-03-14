const API_BASE_URL = 'https://gameinfo.albiononline.com/api/gameinfo';
const CORS_PROXY = ''; // If needed, add a CORS proxy URL here

/**
 * Get API URL with optional CORS proxy
 * @param {string} endpoint - The API endpoint
 * @returns {string} - The complete URL
 */
function getApiUrl(endpoint) {
    return `${CORS_PROXY}${API_BASE_URL}${endpoint}`;
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
