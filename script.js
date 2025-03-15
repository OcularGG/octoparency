// Console logging utility
const consoleOutput = document.getElementById('console-output');
function logToConsole(message, type = 'info') {
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${type}`;
    
    const timestamp = document.createElement('span');
    timestamp.className = 'log-timestamp';
    timestamp.textContent = `[${new Date().toLocaleTimeString()}]`;
    
    logEntry.appendChild(timestamp);
    logEntry.appendChild(document.createTextNode(' ' + message));
    
    consoleOutput.appendChild(logEntry);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

// Make functions globally available
window.previewKillmail = function(killmailId) {
    logToConsole(`Previewing killmail ${killmailId}`);
    const modal = document.getElementById('preview-modal');
    const previewContent = document.getElementById('preview-content');
    
    fetchKillmailDetails(killmailId)
        .then(killmail => {
            if (killmail) {
                previewContent.innerHTML = formatKillmailReceipt(killmail);
                modal.style.display = 'block';
            } else {
                alert('Could not find details for this killmail');
                logToConsole('Could not find killmail details', 'error');
            }
        })
        .catch(error => {
            console.error('Error fetching killmail details:', error);
            logToConsole(`Error fetching killmail details: ${error.message}`, 'error');
            alert('Error previewing killmail');
        });
};

window.downloadKillmail = function(killmailId) {
    logToConsole(`Downloading killmail ${killmailId}`);
    
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
                
                logToConsole('Creating image from receipt...');
                // Use html2canvas to convert to image
                html2canvas(tempDiv).then(canvas => {
                    // Remove the temporary div
                    document.body.removeChild(tempDiv);
                    
                    // Create download link
                    const link = document.createElement('a');
                    link.download = `killmail-${killmailId}.png`;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                    logToConsole('Download completed');
                });
            } else {
                alert('Could not find details for this killmail');
                logToConsole('Could not find killmail details', 'error');
            }
        })
        .catch(error => {
            console.error('Error fetching killmail details:', error);
            logToConsole(`Error fetching killmail details: ${error.message}`, 'error');
            alert('Error downloading killmail');
        });
};

async function fetchKillmailDetails(killmailId) {
    try {
        const serverUrl = getSelectedServerUrl();
        logToConsole(`Fetching killmail details from ${serverUrl}events/${killmailId}`);
        
        const response = await fetch(`${serverUrl}events/${killmailId}`);
        if (!response.ok) {
            logToConsole(`HTTP error! status: ${response.status}`, 'error');
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        logToConsole('Killmail details received successfully');
        return data;
    } catch (error) {
        console.error('Error fetching killmail details:', error);
        logToConsole(`Error: ${error.message}`, 'error');
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
    
    resultsContainer.innerHTML = '<div class="loading">Searching...</div>';
    killmailsContainer.innerHTML = '';
    
    logToConsole(`Searching for "${searchTerm}" on ${serverUrl}`);

    try {
        const searchUrl = `${serverUrl}search?q=${encodeURIComponent(searchTerm)}`;
        logToConsole(`Fetching from: ${searchUrl}`);
        
        const response = await fetch(searchUrl);
        logToConsole('Search response received');
        
        if (!response.ok) {
            logToConsole(`HTTP error! status: ${response.status}`, 'error');
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const rawData = await response.text();
        logToConsole(`Received ${rawData.length} bytes of data`);
        
        let data;
        try {
            data = JSON.parse(rawData);
            logToConsole('Successfully parsed JSON data');
        } catch (e) {
            logToConsole(`JSON parse error: ${e.message}`, 'error');
            throw new Error('Failed to parse API response');
        }

        resultsContainer.innerHTML = '';
        let resultsFound = false;

        if (data && data.players && Array.isArray(data.players) && data.players.length > 0) {
            logToConsole(`Found ${data.players.length} player results`);
            const resultsHeader = document.createElement('h2');
            resultsHeader.textContent = 'Player Results';
            resultsContainer.appendChild(resultsHeader);
            
            data.players.forEach(player => {
                resultsFound = true;
                const resultElement = document.createElement('div');
                resultElement.className = 'search-result';
                resultElement.textContent = `${player.Name} (Player)`;
                resultElement.addEventListener('click', () => {
                    logToConsole(`Selected player: ${player.Name} (${player.Id})`);
                    fetchKillmails(player.Id, 'player');
                });
                resultsContainer.appendChild(resultElement);
            });
        }

        if (!resultsFound) {
            logToConsole('No results found', 'warning');
            resultsContainer.innerHTML = `
                <div class="warning-message">
                    <h3>No Results</h3>
                    <p>No player results found for "${searchTerm}".</p>
                    <p>Try a different search term or select a different server.</p>
                </div>`;
        }

        saveSearchTermToLocalStorage(searchTerm);
    } catch (error) {
        console.error('Search error:', error);
        logToConsole(`Error: ${error.message}`, 'error');
        resultsContainer.innerHTML = `
            <div class="error-message">
                <h3>Search Error</h3>
                <p>${error.message}</p>
                <p>Please try another search term or select a different server.</p>
            </div>
        `;
    }
}

async function fetchKillmails(id, type) {
    const serverUrl = getSelectedServerUrl();
    const killmailsContainer = document.getElementById('killmails');
    
    killmailsContainer.innerHTML = '<div class="loading">Loading killmails...</div>';
    logToConsole(`Fetching killmails for ${type} with ID: ${id}`);

    try {
        let endpoint;
        if (type === 'player') {
            endpoint = `players/${id}/kills`;
        } else {
            logToConsole(`Invalid type: ${type}`, 'error');
            killmailsContainer.innerHTML = `
                <div class="error-message">
                    <h3>Invalid Type</h3>
                    <p>Invalid type: ${type}</p>
                </div>`;
            return;
        }

        const url = `${serverUrl}${endpoint}`;
        logToConsole(`Fetching from URL: ${url}`);
        
        const response = await fetch(url);
        logToConsole('Killmail response received');
        
        if (!response.ok) {
            logToConsole(`HTTP error! status: ${response.status}`, 'error');
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const rawData = await response.text();
        logToConsole(`Received ${rawData.length} bytes of killmail data`);
        
        let data;
        try {
            data = JSON.parse(rawData);
            logToConsole('Successfully parsed killmail data');
        } catch (e) {
            logToConsole(`JSON parse error: ${e.message}`, 'error');
            throw new Error('Failed to parse API response');
        }

        killmailsContainer.innerHTML = '';
        
        if (data && data.length > 0) {
            logToConsole(`Found ${data.length} killmails`);
            
            data.forEach(killmail => {
                const killmailElement = document.createElement('div');
                killmailElement.className = 'killmail';
                
                let killmailHTML = `<h3>Killmail</h3>`;
                
                if (killmail.Victim && killmail.Killer) {
                    killmailHTML += `
                        <p><strong>Victim:</strong> ${killmail.Victim.Name || 'Unknown'}</p>
                        <p><strong>Killer:</strong> ${killmail.Killer.Name || 'Unknown'}</p>
                        <p><strong>Fame:</strong> ${killmail.TotalVictimKillFame || 0}</p>
                        <p><strong>Time:</strong> ${new Date(killmail.TimeStamp).toLocaleString()}</p>
                    `;
                    
                    if (killmail.Victim.Inventory && killmail.Victim.Inventory.length > 0) {
                        killmailHTML += `<p><strong>Items Lost:</strong></p><ul>`;
                        killmail.Victim.Inventory.forEach(item => {
                            if (item && item.Type) {
                                killmailHTML += `<li>${item.Type} (x${item.Count || 1})</li>`;
                            } else if (item && item.ItemTypeId) {
                                killmailHTML += `<li>${item.ItemTypeId} (x${item.Count || 1})</li>`;
                            }
                        });
                        killmailHTML += `</ul>`;
                    }
                } else if (killmail.EventId) {
                    killmailHTML += `
                        <p><strong>Event ID:</strong> ${killmail.EventId}</p>
                        <p><strong>Fame:</strong> ${killmail.Fame || 0}</p>
                    `;
                    
                    if (killmail.Killer && killmail.Victim) {
                        killmailHTML += `
                            <p><strong>Killer:</strong> ${killmail.Killer.Name || 'Unknown'}</p>
                            <p><strong>Victim:</strong> ${killmail.Victim.Name || 'Unknown'}</p>
                        `;
                    }
                } else {
                    killmailHTML += `<p><strong>ID:</strong> ${killmail.Id || killmail.EventId || 'Unknown'}</p>`;
                    killmailHTML += `<p>Data format not recognized.</p>`;
                }
                
                const eventId = killmail.EventId || killmail.Id || 0;
                killmailHTML += `
                    <div class="killmail-actions">
                        <button class="preview-button" onclick="previewKillmail(${eventId})">Preview</button>
                        <button class="download-button" onclick="downloadKillmail(${eventId})">Download</button>
                    </div>
                `;
                
                killmailElement.innerHTML = killmailHTML;
                killmailsContainer.appendChild(killmailElement);
            });
        } else {
            logToConsole('No killmails found', 'warning');
            killmailsContainer.innerHTML = `
                <div class="warning-message">
                    <h3>No Killmails</h3>
                    <p>No killmails found for this player.</p>
                </div>`;
        }
    } catch (error) {
        console.error('Killmail fetch error:', error);
        logToConsole(`Error: ${error.message}`, 'error');
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
    logToConsole(`Saving search term: ${searchTerm}`);
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
}

function getSearchHistoryFromLocalStorage() {
    logToConsole('Retrieving search history');
    return JSON.parse(localStorage.getItem('searchHistory') || '[]');
}

// Handle search history display
async function displaySearchHistory() {
    try {
        const searchHistory = getSearchHistoryFromLocalStorage();
        const resultsContainer = document.getElementById('results');
        
        if (searchHistory && searchHistory.length > 0) {
            logToConsole(`Found ${searchHistory.length} search history items`);
            
            const historyHeader = document.createElement('h2');
            historyHeader.textContent = 'Search History';
            resultsContainer.innerHTML = '';
            resultsContainer.appendChild(historyHeader);
            
            searchHistory.forEach(entry => {
                const entryElement = document.createElement('div');
                entryElement.className = 'search-history-item';
                entryElement.textContent = `${entry.search_term} (${new Date(entry.timestamp).toLocaleString()})`;
                entryElement.addEventListener('click', () => {
                    document.getElementById('search-input').value = entry.search_term;
                    logToConsole(`Selected history item: ${entry.search_term}`);
                    searchAlbionAPI(entry.search_term);
                });
                resultsContainer.appendChild(entryElement);
            });
        } else {
            logToConsole('No search history found');
            resultsContainer.innerHTML = '<h2>Search History</h2><p>No search history found</p>';
        }
    } catch (error) {
        console.error('Error fetching search history:', error);
        logToConsole(`Error fetching search history: ${error.message}`, 'error');
        const resultsContainer = document.getElementById('results');
        resultsContainer.innerHTML = '<h2>Search History</h2><p>Error fetching search history</p>';
    }
}

// Set up event listeners
document.addEventListener('DOMContentLoaded', () => {
    logToConsole('Application initialized');
    
    // Set up the search button click event
    document.getElementById('search-button').addEventListener('click', () => {
        const searchTerm = document.getElementById('search-input').value;
        if (searchTerm) {
            logToConsole(`Search button clicked with term: ${searchTerm}`);
            searchAlbionAPI(searchTerm);
        } else {
            logToConsole('Empty search term', 'warning');
            alert('Please enter a search term');
        }
    });
    
    // Allow hitting Enter to search
    document.getElementById('search-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const searchTerm = document.getElementById('search-input').value;
            if (searchTerm) {
                logToConsole(`Enter key pressed with term: ${searchTerm}`);
                searchAlbionAPI(searchTerm);
            } else {
                logToConsole('Empty search term', 'warning');
                alert('Please enter a search term');
            }
        }
    });
    
    // Setup server change event
    document.getElementById('server-select').addEventListener('change', (e) => {
        logToConsole(`Selected server: ${e.target.value}`);
    });
    
    // Setup console clear button
    document.getElementById('clear-console').addEventListener('click', () => {
        document.getElementById('console-output').innerHTML = '';
        logToConsole('Console cleared');
    });
    
    // Test API connectivity on page load
    logToConsole('Testing API connectivity...');
    const apiStatus = document.getElementById('api-status');
    
    fetch('https://gameinfo.albiononline.com/api/gameinfo/search?q=test')
        .then(response => {
            if (response.ok) {
                logToConsole('API connection successful', 'info');
                apiStatus.textContent = 'API: Connected';
                apiStatus.className = 'status-indicator status-ok';
            } else {
                logToConsole(`API connectivity warning: ${response.status}`, 'warning');
                apiStatus.textContent = `API: Warning (${response.status})`;
                apiStatus.className = 'status-indicator status-warning';
                
                document.getElementById('results').innerHTML = `
                    <div class="warning-message">
                        <h3>API Connection Warning</h3>
                        <p>The Albion Online API may not be accessible right now (status: ${response.status}).</p>
                        <p>Searches might not return results.</p>
                    </div>
                `;
            }
        })
        .catch(error => {
            logToConsole(`API connectivity error: ${error.message}`, 'error');
            apiStatus.textContent = 'API: Disconnected';
            apiStatus.className = 'status-indicator status-error';
            
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
        logToConsole('Preview modal closed');
    });
    
    // Close modal when clicking outside the content
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
            logToConsole('Preview modal closed');
        }
    });

    // Display search history on page load
    displaySearchHistory();
});
