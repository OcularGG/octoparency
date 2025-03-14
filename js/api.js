// API configuration
const API_BASE_URLS = {
    americas: 'https://gameinfo.albiononline.com/api/gameinfo',
    europe: 'https://gameinfo-ams.albiononline.com/api/gameinfo',
    asia: 'https://gameinfo-sgp.albiononline.com/api/gameinfo'
};

const CORS_PROXY = 'https://corsproxy.io/?';
const DOUBLE_OVERCHARGE_ID = 'TH8JjVwVRiuFnalrzESkRQ'; // Alliance ID

let selectedRegion = 'americas';

/**
 * Set the API region
 * @param {string} region - Region to use for API calls
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
 * Fetch deaths for the Double Overcharge alliance
 * @param {number} limit - Maximum number of deaths to fetch
 * @returns {Promise<Array>} - Array of death objects
 */
async function fetchAllianceDeaths(limit = 50) {
    const baseUrl = API_BASE_URLS[selectedRegion];
    const url = `${CORS_PROXY}${baseUrl}/alliances/${DOUBLE_OVERCHARGE_ID}/deaths?limit=${limit}`;
    
    console.log('Fetching deaths from:', url);
    
    try {
        // First try: direct alliance deaths endpoint
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            console.log(`Successfully fetched ${data.length} deaths`);
            return data;
        }
        
        // If that fails, try the events endpoint and filter
        console.log('Direct endpoint failed, trying events endpoint');
        const eventsUrl = `${CORS_PROXY}${baseUrl}/events?limit=100`;
        const eventsResponse = await fetch(eventsUrl);
        
        if (!eventsResponse.ok) {
            throw new Error(`API error: ${eventsResponse.status} ${eventsResponse.statusText}`);
        }
        
        const events = await eventsResponse.json();
        console.log(`Fetched ${events.length} events, filtering for alliance deaths`);
        
        // Filter for deaths where victim is from Double Overcharge alliance
        const allianceDeaths = events.filter(event => 
            event.Victim && 
            event.Victim.AllianceId === DOUBLE_OVERCHARGE_ID
        );
        
        console.log(`Found ${allianceDeaths.length} alliance deaths`);
        return allianceDeaths.slice(0, limit);
        
    } catch (error) {
        console.error('Error fetching deaths:', error);
        throw error;
    }
}

// Expose functions to global scope
window.setApiRegion = setApiRegion;
window.fetchAllianceDeaths = fetchAllianceDeaths;
