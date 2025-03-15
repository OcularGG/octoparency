// Global variables to store data
let financialData = [];
let chartInstances = {};

// Parse XLSX data using SheetJS
function parseXLSX(data) {
    try {
        // Parse the workbook
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first worksheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
        
        // Get headers from first row
        const headers = jsonData[0].map(header => String(header).trim());
        
        // Process the data
        const processedData = [];
        
        // Start from row 1 (skip header row)
        for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (row.length <= 1) continue; // Skip empty rows
            
            const entry = {};
            
            // Add date from the first column
            entry['Date'] = row[0] ? String(row[0]) : '';
            
            // Map each header to its corresponding value
            for (let j = 1; j < headers.length; j++) {
                const header = headers[j];
                if (header) {
                    entry[header] = row[j] !== undefined ? String(row[j]) : '';
                }
            }
            
            // Only include rows with a date
            if (entry['Date']) {
                processedData.push(entry);
            }
        }
        
        return processedData;
    } catch (error) {
        console.error('Error parsing XLSX data:', error);
        throw new Error('Failed to parse Excel file: ' + error.message);
    }
}

// Load data from the XLSX file - make it globally accessible for debugging
window.loadXLSXData = async function() {
    try {
        // Show loading indicators
        document.querySelectorAll('.stat-value').forEach(el => {
            el.innerHTML = '<div class="loading-spinner"></div>';
        });
        
        console.log('Loading XLSX data...');
        const response = await fetch('OCULAR Accounting - Book Keeping.xlsx');
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        // Get the file as ArrayBuffer
        const arrayBuffer = await response.arrayBuffer();
        console.log('XLSX data loaded, parsing...');
        
        const data = parseXLSX(arrayBuffer);
        console.log('Parsed data:', data);
        
        if (data.length === 0) {
            throw new Error('No data found in Excel file');
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
        console.error('Error loading data:', error);
        
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
                <button onclick="loadXLSXData()">Try Again</button>
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
        document.getElementById('total-value').textContent = formatNumber(latestData['Guild Total Value (including illiquid assets):']);
        document.getElementById('liquid-assets').textContent = formatNumber(latestData['Total Liquid/Sellable Assets:']);
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
        const guildTotalValue = financialData.map(item => safeParseFloat(item['Guild Total Value (including illiquid assets):']));
        const totalIlliquid = financialData.map(item => safeParseFloat(item['Total Illiquid/Non-sell assets']));
        const totalLiquid = financialData.map(item => safeParseFloat(item['Total Liquid/Sellable Assets:']));
        const netLiquidValue = financialData.map(item => safeParseFloat(item['Net Liquid Value']));
        const amountOwed = financialData.map(item => safeParseFloat(item['Amount Owed to Members (Bot)']));
        
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

// Setup event listeners for chart filters
function setupEventListeners() {
    try {
        // Guild Total Value chart filters
        const gtvMonthly = document.getElementById('gtv-monthly');
        if (gtvMonthly) {
            gtvMonthly.addEventListener('click', () => {
                // For the CSV data, we'll just use all the data
                // since there aren't many records
                console.log('Monthly filter clicked - using all available data');
            });
        }
        
        const gtvAll = document.getElementById('gtv-all');
        if (gtvAll) {
            gtvAll.addEventListener('click', () => {
                console.log('All data filter clicked');
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
        
        const liquidAssets = safeParseFloat(latestData['Total Liquid/Sellable Assets:']);
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
    window.loadXLSXData(); // Use the global function to load XLSX instead
});

// Alternative initialization for older browsers
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM loaded (readyState handler), initializing application...');
        addDynamicStyles();
        window.loadXLSXData(); // Use the global function to load XLSX instead
    });
} else {
    console.log('DOM already loaded, initializing application immediately...');
    addDynamicStyles();
    window.loadXLSXData(); // Use the global function to load XLSX instead
}