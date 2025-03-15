import { saveSearchTerm, getSearchHistory } from './supabase.js';

document.getElementById('search-button').addEventListener('click', async () => {
    const searchTerm = document.getElementById('search-input').value;
    if (searchTerm) {
        await saveSearchTerm(searchTerm);
        searchAlbionAPI(searchTerm);
        displaySearchHistory();
    }
});

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
        const responses = await Promise.all(servers.map(server => fetch(`${server}search?q=${searchTerm}`)));
        const data = await Promise.all(responses.map(response => response.json()));

        resultsContainer.innerHTML = '';
        data.forEach(serverData => {
            serverData.forEach(result => {
                const resultElement = document.createElement('div');
                resultElement.textContent = `${result.Name} (${result.Type})`;
                resultElement.addEventListener('click', () => fetchKillmails(result.Id));
                resultsContainer.appendChild(resultElement);
            });
        });
    } catch (error) {
        resultsContainer.innerHTML = 'Error fetching data';
        console.error(error);
    }
}

async function fetchKillmails(playerId) {
    const servers = [
        'https://gameinfo.albiononline.com/api/gameinfo/',
        'https://gameinfo-ams.albiononline.com/api/gameinfo/',
        'https://gameinfo-sgp.albiononline.com/api/gameinfo/'
    ];

    const killmailsContainer = document.getElementById('killmails');
    killmailsContainer.innerHTML = 'Loading killmails...';

    try {
        const responses = await Promise.all(servers.map(server => fetch(`${server}players/${playerId}/kills`)));
        const data = await Promise.all(responses.map(response => response.json()));

        killmailsContainer.innerHTML = '';
        data.forEach(serverData => {
            serverData.forEach(killmail => {
                const killmailElement = document.createElement('div');
                killmailElement.className = 'killmail';
                killmailElement.innerHTML = `
                    <h3>Killmail</h3>
                    <p>Victim: ${killmail.Victim.Name}</p>
                    <p>Killer: ${killmail.Killer.Name}</p>
                    <p>Fame: ${killmail.TotalVictimKillFame}</p>
                    <p>Items Lost:</p>
                    <ul>
                        ${killmail.Victim.Inventory.map(item => `<li>${item.ItemTypeId} (x${item.Count})</li>`).join('')}
                    </ul>
                    <button class="preview-button" onclick="previewKillmail(${killmail.Id})">Preview</button>
                    <button class="download-button" onclick="downloadKillmail(${killmail.Id})">Download</button>
                `;
                killmailsContainer.appendChild(killmailElement);
            });
        });
    } catch (error) {
        killmailsContainer.innerHTML = 'Error fetching killmails';
        console.error(error);
    }
}

function previewKillmail(killmailId) {
    // Implement preview functionality
    alert(`Previewing killmail ${killmailId}`);
}

function downloadKillmail(killmailId) {
    // Implement download functionality
    alert(`Downloading killmail ${killmailId}`);
}

async function displaySearchHistory() {
    const searchHistory = await getSearchHistory();
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '<h2>Search History</h2>';
    searchHistory.forEach(entry => {
        const entryElement = document.createElement('div');
        entryElement.textContent = `${entry.search_term} (searched at ${new Date(entry.timestamp).toLocaleString()})`;
        resultsContainer.appendChild(entryElement);
    });
}

// Initial display of search history
displaySearchHistory();
