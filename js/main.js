// DOM elements
const playerSearchInput = document.getElementById('player-search');
const searchButton = document.getElementById('search-button');
const searchResultsDiv = document.getElementById('search-results');
const playerDataDiv = document.getElementById('player-data');
const playerNameElement = document.getElementById('player-name');
const playerStatsElement = document.getElementById('player-stats');
const battlesListDiv = document.getElementById('battles-list');
const tabButtons = document.querySelectorAll('.tab-button');
const battleDetailsDiv = document.getElementById('battle-details');
const backButton = document.getElementById('back-button');
const battleReceiptDiv = document.getElementById('battle-receipt');

// Current player and view state
let currentPlayerId = null;
let currentView = 'kills';

// Initialize event listeners
function initApp() {
    searchButton.addEventListener('click', handleSearch);
    playerSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentView = button.getAttribute('data-tab');
            displayBattles(currentPlayerId, currentView);
        });
    });
    
    backButton.addEventListener('click', () => {
        battleDetailsDiv.classList.add('hidden');
        playerDataDiv.classList.remove('hidden');
    });
}

// Handle player search
async function handleSearch() {
    const searchTerm = playerSearchInput.value.trim();
    if (searchTerm.length < 3) {
        alert('Please enter at least 3 characters for search');
        return;
    }
    
    searchButton.disabled = true;
    searchButton.textContent = 'Searching...';
    
    try {
        const players = await searchPlayers(searchTerm);
        displaySearchResults(players);
    } finally {
        searchButton.disabled = false;
        searchButton.textContent = 'Search';
    }
}

// Display search results
function displaySearchResults(players) {
    searchResultsDiv.innerHTML = '';
    
    if (players.length === 0) {
        searchResultsDiv.innerHTML = '<p>No players found. Try another search term.</p>';
        return;
    }
    
    players.forEach(player => {
        const playerCard = document.createElement('div');
        playerCard.className = 'player-card';
        playerCard.innerHTML = `
            <h3>${player.Name}</h3>
            <p>Guild: ${player.GuildName || 'None'}</p>
            <p>Alliance: ${player.AllianceName || 'None'}</p>
            <p>Kill Fame: ${player.KillFame.toLocaleString()}</p>
        `;
        
        playerCard.addEventListener('click', () => {
            loadPlayerData(player);
        });
        
        searchResultsDiv.appendChild(playerCard);
    });
}

// Load player data
async function loadPlayerData(player) {
    currentPlayerId = player.Id;
    playerNameElement.textContent = player.Name;
    playerStatsElement.innerHTML = `
        <p>Guild: ${player.GuildName || 'None'}</p>
        <p>Alliance: ${player.AllianceName || 'None'}</p>
        <p>Kill Fame: ${player.KillFame.toLocaleString()}</p>
        <p>Death Fame: ${player.DeathFame.toLocaleString()}</p>
        <p>Fame Ratio: ${(player.KillFame / (player.DeathFame || 1)).toFixed(2)}</p>
    `;
    
    // Show player data section, hide search results
    searchResultsDiv.innerHTML = '';
    playerDataDiv.classList.remove('hidden');
    
    // Display battles (default to kills)
    displayBattles(currentPlayerId, currentView);
}

// Display player battles
async function displayBattles(playerId, type = 'kills') {
    battlesListDiv.innerHTML = '<p>Loading battles...</p>';
    
    try {
        const battles = type === 'kills' 
            ? await getPlayerKills(playerId)
            : await getPlayerDeaths(playerId);
        
        if (battles.length === 0) {
            battlesListDiv.innerHTML = `<p>No ${type} found for this player.</p>`;
            return;
        }
        
        battlesListDiv.innerHTML = '';
        battles.slice(0, 20).forEach(battle => {
            const battleCard = document.createElement('div');
            battleCard.className = 'battle-card';
            
            const eventDate = new Date(battle.TimeStamp);
            const opponents = type === 'kills' 
                ? battle.Victim.Name
                : battle.Killer.Name;
            
            battleCard.innerHTML = `
                <h4>${type === 'kills' ? 'Kill' : 'Death'}: ${opponents}</h4>
                <p>Date: ${eventDate.toLocaleDateString()}</p>
                <p>Time: ${eventDate.toLocaleTimeString()}</p>
                <p>Fame: ${battle.TotalVictimKillFame.toLocaleString()}</p>
            `;
            
            battleCard.addEventListener('click', () => {
                showBattleDetails(battle, type);
            });
            
            battlesListDiv.appendChild(battleCard);
        });
        
    } catch (error) {
        battlesListDiv.innerHTML = `<p>Error loading battles: ${error.message}</p>`;
    }
}

// Show battle details
function showBattleDetails(battle, type) {
    playerDataDiv.classList.add('hidden');
    battleDetailsDiv.classList.remove('hidden');
    
    // Generate receipt using receipt.js
    const receipt = generateBattleReceipt(battle, type);
    battleReceiptDiv.innerHTML = receipt;
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
