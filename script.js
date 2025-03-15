// Replace with your deployed Google Apps Script URL
const apiUrl = 'https://script.google.com/macros/s/AKfycbwqtDif0ZKw4dfCrIN12L93XQwX9GeZPmC2nj72kbs-KFJpfHlqoQ2lp4iMzVsseCHZ/exec';

// Global variables to store data
let financialData = [];
let chartInstances = {};

// Fetch data from the API
async function fetchData() {
    try {
        // Show loading indicators
        document.querySelectorAll('.stat-value').forEach(el => {
            el.innerHTML = '<div class="loading-spinner"></div>';
        });
        
        console.log('Fetching data from API...');
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Data received:', data);
        
        // Check if data is valid and has expected format
        if (!Array.isArray(data)) {
            throw new Error('Data is not an array. Received: ' + JSON.stringify(data).substring(0, 100) + '...');
        }
        
        if (data.length === 0) {
            throw new Error('Received empty data array');
        }
        
        // Check if first item has expected properties
        const sampleItem = data[0];
        console.log('Sample data item:', sampleItem);
        
        const requiredProperties = [
            'Date', 
            'Guild Total Value (including illiquid assets)', 
            'Total Liquid/Sellable Assets',
            'Total Illiquid/Non-sell assets',
            'Net Liquid Value',
            'Amount Owed to Members (Bot)'
        ];
        
        for (const prop of requiredProperties) {
            if (!(prop in sampleItem)) {
                throw new Error(`Data missing required property: ${prop}`);
            }
        }
        
        financialData = data;
        
        // Update stats cards
        updateStatsCards();
        
        // Create all charts
        createAllCharts();
        
        // Add event listeners for chart filters
        setupEventListeners();
        
        console.log('Data loaded successfully!');
    } catch (error) {
        console.error('Error fetching data:', error);
        
        // Show error messages in stats cards
        document.querySelectorAll('.stat-value').forEach(el => {
            el.textContent = 'Error loading data';
            el.style.color = 'var(--danger-color)';
        });
        
        // Show error message for user
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.innerHTML = `
            <div class="error-icon"><i class="fas fa-exclamation-circle"></i></div>
            <div class="error-content">
                <h3>Error Loading Data</h3>
                <p>${error.message}</p>
                <button onclick="fetchData()">Try Again</button>
            </div>
        `;
        
        // Insert after main header
        const header = document.querySelector('.dashboard-header');
        if (header && header.nextSibling) {
            header.parentNode.insertBefore(errorMessage, header.nextSibling);
        } else {
            document.querySelector('.main-content').appendChild(errorMessage);
        }
    }
}

// Format numbers with commas and handle potential NaN values
function formatNumber(num) {
    if (num === undefined || num === null || isNaN(num)) {
        console.warn('Invalid number value:', num);
        return '0';
    }
    
    // Parse as float and then convert to integer
    const value = parseFloat(num);
    if (isNaN(value)) {
        console.warn('Failed to parse number:', num);
        return '0';
    }
    
    return Math.round(value).toLocaleString();
}

// Update the stats cards with the latest data
function updateStatsCards() {
    // Get the latest data entry
    const latestData = financialData[financialData.length - 1];
    
    if (!latestData) {
        console.error('No data available for stats cards');
        return;
    }
    
    console.log('Updating stats cards with latest data:', latestData);
    
    try {
        // Update stat cards - with error handling for each value
        document.getElementById('total-value').textContent = formatNumber(latestData['Guild Total Value (including illiquid assets)']);
        document.getElementById('liquid-assets').textContent = formatNumber(latestData['Total Liquid/Sellable Assets']);
        document.getElementById('illiquid-assets').textContent = formatNumber(latestData['Total Illiquid/Non-sell assets']);
        document.getElementById('owed-members').textContent = formatNumber(latestData['Amount Owed to Members (Bot)']);
        
        // Add color indicators based on changes
        if ('📈Liquid Change' in latestData) {
            const liquidChange = parseFloat(latestData['📈Liquid Change']);
            const liquidCard = document.getElementById('liquid-assets-card');
            if (!isNaN(liquidChange)) {
                liquidCard.style.borderLeft = liquidChange >= 0 ? '4px solid var(--success-color)' : '4px solid var(--danger-color)';
            }
        }
    } catch (err) {
        console.error('Error updating stats cards:', err);
    }
}

// Safely parse numeric values with fallback
function safeParseFloat(value, fallback = 0) {
    if (value === undefined || value === null) return fallback;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? fallback : parsed;
}

// Create all charts
function createAllCharts() {
    try {
        console.log('Creating charts with data points:', financialData.length);
        
        // Process data for charts with safe parsing
        const dates = financialData.map(item => item.Date || '');
        const guildTotalValue = financialData.map(item => safeParseFloat(item['Guild Total Value (including illiquid assets)']));
        const totalIlliquid = financialData.map(item => safeParseFloat(item['Total Illiquid/Non-sell assets']));
        const totalLiquid = financialData.map(item => safeParseFloat(item['Total Liquid/Sellable Assets']));
        const netLiquidValue = financialData.map(item => safeParseFloat(item['Net Liquid Value']));
        const amountOwed = financialData.map(item => safeParseFloat(item['Amount Owed to Members (Bot)']));
        const siphonedNet = financialData.map(item => safeParseFloat(item['Siphoned Net (Deposit - Withdraw)']));
        
        // Create Guild Total Value Chart
        const gtvCtx = document.getElementById('guildTotalValueChart');
        if (!gtvCtx) {
            console.error('Canvas element guildTotalValueChart not found');
        } else {
            chartInstances.guildTotalValue = createLineChart(
                'guildTotalValueChart',
                'Guild Total Value Over Time',
                dates,
                [
                    {
                        label: 'Guild Total Value',
                        data: guildTotalValue,
                        borderColor: '#3182ce',
                        backgroundColor: 'rgba(49, 130, 206, 0.1)',
                        tension: 0.4
                    }
                ]
            );
        }
        
        // Create Liquid vs Illiquid Assets Chart
        const latestTotalLiquid = totalLiquid[totalLiquid.length - 1] || 0;
        const latestTotalIlliquid = totalIlliquid[totalIlliquid.length - 1] || 0;
        
        const liCtx = document.getElementById('liquidIlliquidChart');
        if (!liCtx) {
            console.error('Canvas element liquidIlliquidChart not found');
        } else {
            chartInstances.liquidIlliquid = new Chart(liCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Liquid Assets', 'Illiquid Assets'],
                    datasets: [{
                        data: [latestTotalLiquid, latestTotalIlliquid],
                        backgroundColor: ['#4299e1', '#ed8936'],
                        borderColor: '#ffffff',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.label}: ${formatNumber(context.raw)}`;
                                }
                            }
                        }
                    }
                }
            });
        }
        
        // Create Net Liquid Value Trend Chart
        const nlvCtx = document.getElementById('netLiquidValueChart');
        if (!nlvCtx) {
            console.error('Canvas element netLiquidValueChart not found');
        } else {
            chartInstances.netLiquidValue = createLineChart(
                'netLiquidValueChart',
                'Net Liquid Value Over Time',
                dates,
                [
                    {
                        label: 'Net Liquid Value',
                        data: netLiquidValue,
                        borderColor: '#805ad5',
                        backgroundColor: 'rgba(128, 90, 213, 0.1)',
                        tension: 0.4
                    }
                ]
            );
        }
        
        // Create Amount Owed Chart - Using latest entry to get various owed categories
        const latestEntry = financialData[financialData.length - 1] || {};
        
        const aoCtx = document.getElementById('amountOwedChart');
        if (!aoCtx) {
            console.error('Canvas element amountOwedChart not found');
        } else {
            chartInstances.amountOwed = new Chart(aoCtx, {
                type: 'bar',
                data: {
                    labels: ['Total Owed', 'Ocular Silver', 'OCLU Silver', 'Vanguard Silver', 'Alt Silver'],
                    datasets: [{
                        label: 'Amount',
                        data: [
                            safeParseFloat(latestEntry['Amount Owed to Members (Bot)']),
                            safeParseFloat(latestEntry['Ocular Silver']),
                            safeParseFloat(latestEntry['OCLU Silver']),
                            safeParseFloat(latestEntry['Vanguard Silver']),
                            safeParseFloat(latestEntry['Alt Silver'])
                        ],
                        backgroundColor: [
                            '#4299e1',
                            '#48bb78',
                            '#ed8936',
                            '#9f7aea',
                            '#f56565'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return formatNumber(value);
                                }
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.dataset.label}: ${formatNumber(context.raw)}`;
                                }
                            }
                        }
                    }
                }
            });
        }
        
        // Create Siphoned Net Chart
        const snCtx = document.getElementById('siphonedNetChart');
        if (!snCtx) {
            console.error('Canvas element siphonedNetChart not found');
        } else {
            chartInstances.siphonedNet = createLineChart(
                'siphonedNetChart',
                'Siphoned Net Value Over Time',
                dates,
                [
                    {
                        label: 'Siphoned Net Value',
                        data: siphonedNet,
                        borderColor: '#f56565',
                        backgroundColor: 'rgba(245, 101, 101, 0.1)',
                        tension: 0.4
                    }
                ]
            );
        }
        
        // Create Active Players Chart if all required data exists
        try {
            const apCtx = document.getElementById('activePlayersChart');
            if (!apCtx) {
                console.error('Canvas element activePlayersChart not found');
            } else {
                const ocularActive = safeParseFloat(latestEntry['Ocular  (Active Last Week)']);
                const vanguardActive = safeParseFloat(latestEntry['Ocular Vanguard (Active Last Week)']);
                const universityActive = safeParseFloat(latestEntry['Ocular University (Active Last Week)']);
                const totalActive = safeParseFloat(latestEntry['Active Players']);
                
                // Calculate "Other" with safeguard against negative values
                const otherActive = Math.max(0, totalActive - (ocularActive + vanguardActive + universityActive));
                
                const latestDate = dates[dates.length - 1] || 'Current Date';
                
                chartInstances.activePlayers = new Chart(apCtx, {
                    type: 'pie',
                    data: {
                        labels: ['Ocular', 'Vanguard', 'University', 'Other'],
                        datasets: [{
                            data: [ocularActive, vanguardActive, universityActive, otherActive],
                            backgroundColor: ['#4299e1', '#48bb78', '#ed8936', '#9f7aea'],
                            borderColor: '#ffffff',
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom'
                            },
                            title: {
                                display: true,
                                text: `Active Players as of ${latestDate}`
                            }
                        }
                    }
                });
            }
        } catch (err) {
            console.error('Error creating active players chart:', err);
        }
        
    } catch (error) {
        console.error('Error creating charts:', error);
    }
}

// Helper function to create a line chart with error handling
function createLineChart(canvasId, title, labels, datasets) {
    try {
        const ctx = document.getElementById(canvasId);
        if (!ctx) {
            throw new Error(`Canvas with id '${canvasId}' not found`);
        }
        
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: title
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${formatNumber(context.raw)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: function(value) {
                                return formatNumber(value);
                            }
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error(`Failed to create chart ${canvasId}:`, error);
        return null;
    }
}

// Filter data by time period
function filterData(period) {
    if (period === 'all') {
        return financialData;
    }
    
    if (!financialData || financialData.length === 0) {
        console.warn('No data available to filter');
        return [];
    }
    
    const now = new Date();
    let cutoffDate;
    
    switch(period) {
        case 'monthly':
            cutoffDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
        case 'quarterly':
            cutoffDate = new Date(now.setMonth(now.getMonth() - 3));
            break;
        default:
            return financialData;
    }
    
    return financialData.filter(item => {
        try {
            if (!item.Date) return false;
            const itemDate = new Date(item.Date);
            return !isNaN(itemDate.getTime()) && itemDate >= cutoffDate;
        } catch (e) {
            console.warn('Error processing date:', item.Date, e);
            return false;
        }
    });
}

// Setup event listeners for chart filters
function setupEventListeners() {
    try {
        // Guild Total Value chart filters
        const gtvMonthly = document.getElementById('gtv-monthly');
        if (gtvMonthly) {
            gtvMonthly.addEventListener('click', () => {
                updateChart('guildTotalValue', 'monthly');
            });
        }
        
        const gtvAll = document.getElementById('gtv-all');
        if (gtvAll) {
            gtvAll.addEventListener('click', () => {
                updateChart('guildTotalValue', 'all');
            });
        }
        
        // Net Liquid Value chart filters
        const nlvMonthly = document.getElementById('nlv-monthly');
        if (nlvMonthly) {
            nlvMonthly.addEventListener('click', () => {
                updateChart('netLiquidValue', 'monthly');
            });
        }
        
        const nlvAll = document.getElementById('nlv-all');
        if (nlvAll) {
            nlvAll.addEventListener('click', () => {
                updateChart('netLiquidValue', 'all');
            });
        }
        
        // Siphoned Net Value chart filters
        const siphonQuarterly = document.getElementById('siphon-quarterly');
        if (siphonQuarterly) {
            siphonQuarterly.addEventListener('click', () => {
                updateChart('siphonedNet', 'quarterly');
            });
        }
        
        const siphonAll = document.getElementById('siphon-all');
        if (siphonAll) {
            siphonAll.addEventListener('click', () => {
                updateChart('siphonedNet', 'all');
            });
        }
        
        // Refresh buttons
        const assetRefresh = document.getElementById('asset-refresh');
        if (assetRefresh) {
            assetRefresh.addEventListener('click', () => {
                updateAssetDistributionChart();
            });
        }
        
        const owedRefresh = document.getElementById('owed-refresh');
        if (owedRefresh) {
            owedRefresh.addEventListener('click', () => {
                updateAmountOwedChart();
            });
        }
        
        const playersRefresh = document.getElementById('players-refresh');
        if (playersRefresh) {
            playersRefresh.addEventListener('click', () => {
                updateActivePlayersChart();
            });
        }
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

// Update chart with filtered data
function updateChart(chartName, period) {
    try {
        if (!chartInstances[chartName]) {
            console.warn(`Chart instance ${chartName} not found`);
            return;
        }
        
        const filteredData = filterData(period);
        
        // If no data after filtering, return
        if (filteredData.length === 0) {
            console.warn(`No data available for period ${period}`);
            return;
        }
        
        const dates = filteredData.map(item => item.Date || '');
        
        switch(chartName) {
            case 'guildTotalValue':
                const guildTotalValue = filteredData.map(item => safeParseFloat(item['Guild Total Value (including illiquid assets)']));
                chartInstances.guildTotalValue.data.labels = dates;
                chartInstances.guildTotalValue.data.datasets[0].data = guildTotalValue;
                chartInstances.guildTotalValue.update();
                break;
                
            case 'netLiquidValue':
                const netLiquidValue = filteredData.map(item => safeParseFloat(item['Net Liquid Value']));
                chartInstances.netLiquidValue.data.labels = dates;
                chartInstances.netLiquidValue.data.datasets[0].data = netLiquidValue;
                chartInstances.netLiquidValue.update();
                break;
                
            case 'siphonedNet':
                const siphonedNet = filteredData.map(item => safeParseFloat(item['Siphoned Net (Deposit - Withdraw)']));
                chartInstances.siphonedNet.data.labels = dates;
                chartInstances.siphonedNet.data.datasets[0].data = siphonedNet;
                chartInstances.siphonedNet.update();
                break;
        }
    } catch (error) {
        console.error(`Error updating chart ${chartName}:`, error);
    }
}

// Update asset distribution chart with latest data
function updateAssetDistributionChart() {
    try {
        if (!chartInstances.liquidIlliquid) {
            console.warn('Liquid/Illiquid chart instance not found');
            return;
        }
        
        const latestData = financialData[financialData.length - 1];
        
        if (!latestData) {
            console.warn('No data available for asset distribution chart');
            return;
        }
        
        const liquidAssets = safeParseFloat(latestData['Total Liquid/Sellable Assets']);
        const illiquidAssets = safeParseFloat(latestData['Total Illiquid/Non-sell assets']);
        
        chartInstances.liquidIlliquid.data.datasets[0].data = [liquidAssets, illiquidAssets];
        chartInstances.liquidIlliquid.update();
    } catch (error) {
        console.error('Error updating asset distribution chart:', error);
    }
}

// Update amount owed chart with latest data
function updateAmountOwedChart() {
    try {
        if (!chartInstances.amountOwed) {
            console.warn('Amount owed chart instance not found');
            return;
        }
        
        const latestData = financialData[financialData.length - 1];
        
        if (!latestData) {
            console.warn('No data available for amount owed chart');
            return;
        }
        
        chartInstances.amountOwed.data.datasets[0].data = [
            safeParseFloat(latestData['Amount Owed to Members (Bot)']),
            safeParseFloat(latestData['Ocular Silver']),
            safeParseFloat(latestData['OCLU Silver']),
            safeParseFloat(latestData['Vanguard Silver']),
            safeParseFloat(latestData['Alt Silver'])
        ];
        
        chartInstances.amountOwed.update();
    } catch (error) {
        console.error('Error updating amount owed chart:', error);
    }
}

// Update active players chart with latest data
function updateActivePlayersChart() {
    try {
        if (!chartInstances.activePlayers) {
            console.warn('Active players chart instance not found');
            return;
        }
        
        const latestData = financialData[financialData.length - 1];
        
        if (!latestData) {
            console.warn('No data available for active players chart');
            return;
        }
        
        const ocularActive = safeParseFloat(latestData['Ocular  (Active Last Week)']);
        const vanguardActive = safeParseFloat(latestData['Ocular Vanguard (Active Last Week)']);
        const universityActive = safeParseFloat(latestData['Ocular University (Active Last Week)']);
        const totalActive = safeParseFloat(latestData['Active Players']);
        
        // Calculate "Other" with safeguard against negative values
        const otherActive = Math.max(0, totalActive - (ocularActive + vanguardActive + universityActive));
        
        chartInstances.activePlayers.data.datasets[0].data = [
            ocularActive, vanguardActive, universityActive, otherActive
        ];
        
        chartInstances.activePlayers.update();
    } catch (error) {
        console.error('Error updating active players chart:', error);
    }
}

// Add CSS for loading spinner and error message
function addDynamicStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .loading-spinner {
            width: 20px;
            height: 20px;
            border: 3px solid rgba(0, 0, 0, 0.1);
            border-radius: 50%;
            border-top-color: var(--secondary-color);
            animation: spin 1s ease-in-out infinite;
            margin: 0 auto;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .error-message {
            background-color: #fff5f5;
            border-left: 4px solid var(--danger-color);
            margin: 1rem 0;
            padding: 1rem;
            border-radius: 4px;
            display: flex;
            align-items: flex-start;
        }
        
        .error-icon {
            font-size: 1.5rem;
            color: var(--danger-color);
            margin-right: 1rem;
        }
        
        .error-content h3 {
            margin-top: 0;
            color: var(--danger-color);
        }
        
        .error-content button {
            background-color: var(--secondary-color);
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 0.5rem;
        }
        
        .error-content button:hover {
            background-color: var(--primary-color);
        }
    `;
    document.head.appendChild(style);
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing application...');
    addDynamicStyles();
    fetchData();
});

// Alternative initialization for older browsers
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM loaded (readyState handler), initializing application...');
        addDynamicStyles();
        fetchData();
    });
} else {
    console.log('DOM already loaded, initializing application immediately...');
    addDynamicStyles();
    fetchData();
}