const API_BASE_URLS = {
    americas: 'https://gameinfo.albiononline.com/api/gameinfo',
    europe: 'https://gameinfo-ams.albiononline.com/api/gameinfo',
    asia: 'https://gameinfo-sgp.albiononline.com/api/gameinfo'
};

const CORS_PROXY = 'https://corsproxy.io/?';
const DOUBLE_OVERCHARGE_ID = 'TH8JjVwVRiuFnalrzESkRQ'; // Alliance ID

let selectedRegion = 'americas';

function setApiRegion(region) {
    selectedRegion = region;
    console.log('API region set to:', region);
}

async function fetchAllianceDeaths(limit = 50) {
    const baseUrl = API_BASE_URLS[selectedRegion];
    const url = `${CORS_PROXY}${baseUrl}/alliances/${DOUBLE_OVERCHARGE_ID}/deaths?limit=${limit}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Fetched deaths:', data);
        return data;
    } catch (error) {
        console.error('Could not fetch deaths:', error);
        return null;
    }
}

window.setApiRegion = setApiRegion;
window.fetchAllianceDeaths = fetchAllianceDeaths;
