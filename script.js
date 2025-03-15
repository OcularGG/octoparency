import { saveSearchTerm, getSearchHistory } from './supabase.js';

// Make functions globally available
window.previewKillmail = function(killmailId) {
    // Implement preview functionality
    alert(`Previewing killmail ${killmailId}`);
};

window.downloadKillmail = function(killmailId) {
    // Implement download functionality
    alert(`Downloading killmail ${killmailId}`);
};

async function searchAlbionAPI(searchTerm) {
    const servers = [
        'https://gameinfo.albiononline.com/api/gameinfo/',
        'https://gameinfo-ams.albiononline.com/api/gameinfo/',
        'https://gameinfo-sgp.albiononline.com/api/gameinfo/'
    ];

    const resultsContainer = document.getElementById('results');
    const killmailsContainer = document.getElementById('killmails');
    resultsContainer.innerHTML = 'Loading...';
    killmailsContainer.innerHTML = '';

    try {
        // For now, just use one server to test functionality
        const response = await fetch(`${servers[0]}search?q=${searchTerm}`);
        const data = await response.json();

        resultsContainer.innerHTML = '<h2>Search Results</h2>';
        
        if (data && data.length > 0) {
            data.forEach(result => {
                const resultElement = document.createElement('div');
                resultElement.className = 'search-result';
                resultElement.textContent = `${result.Name} (${result.Type})`;
                resultElement.addEventListener('click', () => fetchKillmails(result.Id, result.Type));
                resultsContainer.appendChild(resultElement);
            });
        } else {
            resultsContainer.innerHTML += '<p>No results found</p>';
        }
    } catch (error) {
        resultsContainer.innerHTML = 'Error fetching data';
        console.error(error);
    }
}

async function fetchKillmails(id, type) {
    const servers = [
        'https://gameinfo.albiononline.com/api/gameinfo/'
    ];

    const killmailsContainer = document.getElementById('killmails');
    killmailsContainer.innerHTML = 'Loading killmails...';

    try {
        let endpoint;
        if (type === 'player') {
            endpoint = `players/${id}/kills`;
        } else if (type === 'guild') {
            endpoint = `guilds/${id}/top?range=week&limit=10`;
        } else if (type === 'alliance') {
            endpoint = `alliances/${id}`;
            // Note: Alliances don't have a direct killmail endpoint, we'd need to fetch guilds first
            killmailsContainer.innerHTML = 'Alliance killmails not directly available';
            return;
        } else {
            killmailsContainer.innerHTML = 'Invalid type';
            return;
        }

        const response = await fetch(`${servers[0]}${endpoint}`);
        const data = await response.json();

        killmailsContainer.innerHTML = '';
        
        if (data && data.length > 0) {
            data.forEach(killmail => {
                const killmailElement = document.createElement('div');
                killmailElement.className = 'killmail';
                killmailElement.innerHTML = `
                    <h3>Killmail</h3>
                    <p>Victim: ${killmail.Victim?.Name || 'Unknown'}</p>
                    <p>Killer: ${killmail.Killer?.Name || 'Unknown'}</p>
                    <p>Fame: ${killmail.TotalVictimKillFame || 0}</p>
                    <div>
                        <button class="preview-button" onclick="previewKillmail(${killmail.Id || 0})">Preview</button>
                        <button class="download-button" onclick="downloadKillmail(${killmail.Id || 0})">Download</button>
                    </div>
                `;
                killmailsContainer.appendChild(killmailElement);
            });
        } else {
            killmailsContainer.innerHTML = 'No killmails found';
        }
    } catch (error) {
        killmailsContainer.innerHTML = 'Error fetching killmails';
        console.error(error);
    }
}

async function displaySearchHistory() {
    try {
        const searchHistory = await getSearchHistory();
        const resultsContainer = document.getElementById('results');
        
        if (searchHistory && searchHistory.length > 0) {
            resultsContainer.innerHTML = '<h2>Search History</h2>';
            searchHistory.forEach(entry => {
                const entryElement = document.createElement('div');
                entryElement.className = 'search-history-item';
                entryElement.textContent = `${entry.search_term} (searched at ${new Date(entry.timestamp).toLocaleString()})`;
                entryElement.addEventListener('click', () => {
                    document.getElementById('search-input').value = entry.search_term;
                    searchAlbionAPI(entry.search_term);
                });
                resultsContainer.appendChild(entryElement);
            });
        } else {
            resultsContainer.innerHTML = '<h2>Search History</h2><p>No search history found</p>';
        }
    } catch (error) {
        console.error('Error fetching search history:', error);
        const resultsContainer = document.getElementById('results');
        resultsContainer.innerHTML = '<h2>Search History</h2><p>Error fetching search history</p>';
    }
}

// Set up event listener for the search button
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('search-button').addEventListener('click', async () => {
        const searchTerm = document.getElementById('search-input').value;
        if (searchTerm) {
            try {
                await saveSearchTerm(searchTerm);
                searchAlbionAPI(searchTerm);
            } catch (error) {
                console.error('Error saving search term:', error);
                searchAlbionAPI(searchTerm);
            }
        }
    });
    
    // Allow hitting Enter to search
    document.getElementById('search-input').addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            const searchTerm = document.getElementById('search-input').value;
            if (searchTerm) {
                try {
                    await saveSearchTerm(searchTerm);
                    searchAlbionAPI(searchTerm);
                } catch (error) {
                    console.error('Error saving search term:', error);
                    searchAlbionAPI(searchTerm);
                }
            }
        }
    });

    // Display search history on page load
    displaySearchHistory();
});
