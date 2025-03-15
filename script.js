// Make functions globally available
window.previewKillmail = function(killmailId) {
    // Implement preview functionality
    const modal = document.getElementById('preview-modal');
    const previewContent = document.getElementById('preview-content');
    
    // Format the killmail as a receipt
    fetchKillmailDetails(killmailId)
        .then(killmail => {
            if (killmail) {
                previewContent.innerHTML = formatKillmailReceipt(killmail);
                modal.style.display = 'block';
            } else {
                alert('Could not find details for this killmail');
            }
        })
        .catch(error => {
            console.error('Error fetching killmail details:', error);
            alert('Error previewing killmail');
        });
};

window.downloadKillmail = function(killmailId) {
    // Implement download functionality
    fetchKillmailDetails(killmailId)
        .then(killmail => {
            if (killmail) {
                // Create a temporary div to render the receipt
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = formatKillmailReceipt(killmail);
                tempDiv.style.width = '400px';
                tempDiv.style.padding = '20px';
                tempDiv.style.background = 'white';
                tempDiv.style.fontFamily = 'Courier New, monospace';
                document.body.appendChild(tempDiv);
                
                // Use html2canvas to convert to image
                html2canvas(tempDiv).then(canvas => {
                    // Remove the temporary div
                    document.body.removeChild(tempDiv);
                    
                    // Create download link
                    const link = document.createElement('a');
                    link.download = `killmail-${killmailId}.png`;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                });
            } else {
                alert('Could not find details for this killmail');
            }
        })
        .catch(error => {
            console.error('Error fetching killmail details:', error);
            alert('Error downloading killmail');
        });
};

async function fetchKillmailDetails(killmailId) {
    try {
        const serverUrl = getSelectedServerUrl();
        const response = await fetch(`${serverUrl}events/${killmailId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching killmail details:', error);
        return null;
    }
}

function formatKillmailReceipt(killmail) {
    // Create a receipt-like display for the killmail
    const date = new Date(killmail.TimeStamp || Date.now()).toLocaleString();
    
    let receipt = `
        <div class="receipt">
            <h2>ALBION ONLINE KILLMAIL</h2>
            <p>============================</p>
            <p>Date: ${date}</p>
            <p>Killer: ${killmail.Killer?.Name || 'Unknown'}</p>
            <p>Victim: ${killmail.Victim?.Name || 'Unknown'}</p>
            <p>Fame: ${killmail.TotalVictimKillFame || 0}</p>
            <p>============================</p>
    `;
    
    if (killmail.Victim && killmail.Victim.Equipment) {
        receipt += `<p>EQUIPMENT LOST:</p>`;
        const equipment = killmail.Victim.Equipment;
        for (const slot in equipment) {
            if (equipment[slot] && equipment[slot].Type) {
                receipt += `<p>${slot}: ${equipment[slot].Type}</p>`;
            }
        }
    }
    
    if (killmail.Victim && killmail.Victim.Inventory) {
        receipt += `<p>INVENTORY LOST:</p>`;
        killmail.Victim.Inventory.forEach(item => {
            if (item && item.Type) {
                receipt += `<p>${item.Type} x${item.Count || 1}</p>`;
            }
        });
    }
    
    receipt += `<p>============================</p>
                <p>Thank you for dying in Albion!</p>
                <p>Please come again.</p>
            </div>`;
            
    return receipt;
}

function getSelectedServerUrl() {
    const serverSelect = document.getElementById('server-select');
    const servers = {
        'america': 'https://gameinfo.albiononline.com/api/gameinfo/',
        'europe': 'https://gameinfo-ams.albiononline.com/api/gameinfo/',
        'asia': 'https://gameinfo-sgp.albiononline.com/api/gameinfo/'
    };
    return servers[serverSelect.value] || servers['america'];
}

async function searchAlbionAPI(searchTerm) {
    const serverUrl = getSelectedServerUrl();
    const resultsContainer = document.getElementById('results');
    const killmailsContainer = document.getElementById('killmails');
    resultsContainer.innerHTML = 'Loading...';
    killmailsContainer.innerHTML = '';

    try {
        const searchUrl = `${serverUrl}search?q=${encodeURIComponent(searchTerm)}`;
        console.log(`Searching URL: ${searchUrl}`);

        // Log before the fetch
        console.log('About to fetch...');
        const response = await fetch(searchUrl);

        // Log after the fetch
        console.log('Fetch completed.');

        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const rawData = await response.text();
        console.log('Raw API response:', rawData);

        let data;
        try {
            data = JSON.parse(rawData);
        } catch (e) {
            console.error('JSON parse error:', e);
            throw new Error('Failed to parse API response');
        }

        console.log('Search results object:', data);

        resultsContainer.innerHTML = '<h2>Search Results</h2>';
        let resultsFound = false;

        if (data && data.players && Array.isArray(data.players) && data.players.length > 0) {
            resultsContainer.innerHTML += '<h3>Players</h3>';
            data.players.forEach(player => {
                resultsFound = true;
                const resultElement = document.createElement('div');
                resultElement.className = 'search-result';
                resultElement.textContent = `${player.Name} (Player)`;
                resultElement.addEventListener('click', () => {
                    console.log(`Fetching killmails for player: ${player.Id}`);
                    fetchKillmails(player.Id, 'player');
                });
                resultsContainer.appendChild(resultElement);
            });
        }

        if (!resultsFound) {
            resultsContainer.innerHTML += '<p>No player results found. Try a different search term or server.</p>';
        }

        saveSearchTermToLocalStorage(searchTerm);
    } catch (error) {
        console.error('Search error:', error);
        resultsContainer.innerHTML = `
            <h2>Search Error</h2>
            <p>${error.message}</p>
            <p>Please try another search term or select a different server.</p>
            <p>Technical details: ${error.toString()}</p>
        `;
    }
}

async function fetchKillmails(id, type) {
    const serverUrl = getSelectedServerUrl();

    const killmailsContainer = document.getElementById('killmails');
    killmailsContainer.innerHTML = 'Loading killmails...';

    try {
        let endpoint;
        if (type === 'player') {
            endpoint = `players/${id}/kills`;
        } else if (type === 'guild') {
            endpoint = `guilds/${id}/top?range=week&limit=10`;
        } else {
            killmailsContainer.innerHTML = `Invalid type: ${type}`;
            return;
        }

        const url = `${serverUrl}${endpoint}`;
        console.log(`Fetching from URL: ${url}`);
        
        // Log before the fetch
        console.log('About to fetch killmails...');
        const response = await fetch(url);
        
        // Log after the fetch
        console.log('Killmail fetch completed.');
        
        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Log the raw response for debugging
        const rawData = await response.text();
        console.log('Raw killmail response:', rawData);
        
        // Try to parse the JSON
        let data;
        try {
            data = JSON.parse(rawData);
        } catch (e) {
            console.error('JSON parse error:', e);
            throw new Error('Failed to parse API response');
        }
        
        console.log('Killmail data:', data);

        killmailsContainer.innerHTML = '';
        
        if (data && data.length > 0) {
            data.forEach(killmail => {
                const killmailElement = document.createElement('div');
                killmailElement.className = 'killmail';
                
                // Create a safer HTML template
                let killmailHTML = `<h3>Killmail</h3>`;
                
                // For player kills
                if (killmail.Victim && killmail.Killer) {
                    // Standard kill data
                    killmailHTML += `
                        <p>Victim: ${killmail.Victim.Name || 'Unknown'}</p>
                        <p>Killer: ${killmail.Killer.Name || 'Unknown'}</p>
                        <p>Fame: ${killmail.TotalVictimKillFame || 0}</p>
                        <p>Time: ${new Date(killmail.TimeStamp).toLocaleString()}</p>
                    `;
                    
                    // Add items if available
                    if (killmail.Victim.Inventory && killmail.Victim.Inventory.length > 0) {
                        killmailHTML += `<p>Items Lost:</p><ul>`;
                        killmail.Victim.Inventory.forEach(item => {
                            if (item && item.Type) {
                                killmailHTML += `<li>${item.Type} (x${item.Count || 1})</li>`;
                            } else if (item && item.ItemTypeId) {
                                killmailHTML += `<li>${item.ItemTypeId} (x${item.Count || 1})</li>`;
                            }
                        });
                        killmailHTML += `</ul>`;
                    }
                } 
                // For guild top kills
                else if (killmail.EventId) {
                    killmailHTML += `
                        <p>Event ID: ${killmail.EventId}</p>
                        <p>Fame: ${killmail.Fame || 0}</p>
                    `;
                    
                    if (killmail.Killer && killmail.Victim) {
                        killmailHTML += `
                            <p>Killer: ${killmail.Killer.Name || 'Unknown'}</p>
                            <p>Victim: ${killmail.Victim.Name || 'Unknown'}</p>
                        `;
                    }
                }
                // Generic case if we don't recognize the format
                else {
                    killmailHTML += `<p>ID: ${killmail.Id || killmail.EventId || 'Unknown'}</p>`;
                    killmailHTML += `<p>Data format not recognized. Raw data in console.</p>`;
                }
                
                // Add buttons
                const eventId = killmail.EventId || killmail.Id || 0;
                killmailHTML += `
                    <div>
                        <button class="preview-button" onclick="previewKillmail(${eventId})">Preview</button>
                        <button class="download-button" onclick="downloadKillmail(${eventId})">Download</button>
                    </div>
                `;
                
                killmailElement.innerHTML = killmailHTML;
                killmailsContainer.appendChild(killmailElement);
            });
        } else {
            killmailsContainer.innerHTML = 'No killmails found for this selection.';
        }
    } catch (error) {
        console.error('Killmail fetch error:', error);
        killmailsContainer.innerHTML = `
            <div class="error-message">
                <h3>Error Fetching Killmails</h3>
                <p>${error.message}</p>
                <p>Try selecting a different server or search term.</p>
            </div>
        `;
    }
}

// localStorage functions for search history
function saveSearchTermToLocalStorage(searchTerm) {
    console.log('Saving search term to localStorage:', searchTerm);
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    
    // Check if the search term already exists to avoid duplicates
    const existingIndex = history.findIndex(item => item.search_term === searchTerm);
    if (existingIndex !== -1) {
        history.splice(existingIndex, 1);
    }
    
    history.unshift({
        search_term: searchTerm,
        timestamp: new Date().toISOString()
    });
    
    // Keep only the last 10 searches
    if (history.length > 10) {
        history.pop();
    }
    
    localStorage.setItem('searchHistory', JSON.stringify(history));
    return { data: { search_term: searchTerm } };
}

function getSearchHistoryFromLocalStorage() {
    console.log('Getting search history from localStorage');
    return JSON.parse(localStorage.getItem('searchHistory') || '[]');
}

// Handle search history display
async function displaySearchHistory() {
    try {
        const searchHistory = getSearchHistoryFromLocalStorage();
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
    console.log('DOM loaded, setting up event listeners');
    
    // Set up the search button click event
    document.getElementById('search-button').addEventListener('click', () => {
        const searchTerm = document.getElementById('search-input').value;
        if (searchTerm) {
            console.log('Search button clicked with term:', searchTerm);
            searchAlbionAPI(searchTerm);
        } else {
            alert('Please enter a search term');
        }
    });
    
    // Allow hitting Enter to search
    document.getElementById('search-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const searchTerm = document.getElementById('search-input').value;
            if (searchTerm) {
                console.log('Enter key pressed with term:', searchTerm);
                searchAlbionAPI(searchTerm);
            } else {
                alert('Please enter a search term');
            }
        }
    });
    
    // Test API connectivity on page load
    fetch('https://gameinfo.albiononline.com/api/gameinfo/search?q=test')
        .then(response => {
            console.log('API connectivity test response:', response.status);
            if (!response.ok) {
                document.getElementById('results').innerHTML = `
                    <div class="error-message">
                        <h3>API Connection Warning</h3>
                        <p>The Albion Online API may not be accessible right now (status: ${response.status}).</p>
                        <p>Searches might not return results.</p>
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('API connectivity test error:', error);
            document.getElementById('results').innerHTML = `
                <div class="error-message">
                    <h3>API Connection Error</h3>
                    <p>Cannot connect to the Albion Online API. Searches will not work.</p>
                    <p>Error: ${error.message}</p>
                </div>
            `;
        });
    
    // Set up modal close button
    const modal = document.getElementById('preview-modal');
    const closeButton = document.querySelector('.close-button');
    
    closeButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    // Close modal when clicking outside the content
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Display search history on page load
    displaySearchHistory();
});
