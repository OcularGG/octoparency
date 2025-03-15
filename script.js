// Replace with your deployed Google Apps Script URL
const apiUrl = 'https://script.google.com/macros/s/AKfycbwqtDif0ZKw4dfCrIN12L93XQwX9GeZPmC2nj72kbs-KFJpfHlqoQ2lp4iMzVsseCHZ/exec';

// Global variables to store data
let financialData = [];
let chartInstances = {};

// Fetch data from the API
async function fetchData() {
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
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
        document.body.innerHTML += `<div style="color: red; text-align: center; margin-top: 20px;">Error loading data. Please try again later.</div>`;
    }
}

// Update the stats cards with the latest data
function updateStatsCards() {
    // Get the latest data entry
    const latestData = financialData[financialData.length - 1];
    
    if (!latestData) return;
    
    // Format numbers with commas
    const formatNumber = (num) => {
        return parseInt(num).toLocaleString();
    };
    
    // Update stat cards
    document.getElementById('total-value').textContent = formatNumber(latestData['Guild Total Value (including illiquid assets)']);
    document.getElementById('liquid-assets').textContent = formatNumber(latestData['Total Liquid/Sellable Assets']);
    document.getElementById('illiquid-assets').textContent = formatNumber(latestData['Total Illiquid/Non-sell assets']);
    document.getElementById('owed-members').textContent = formatNumber(latestData['Amount Owed to Members (Bot)']);
    
    // Add color indicators based on changes
    const liquidChange = parseFloat(latestData['📈Liquid Change']);
    const liquidCard = document.getElementById('liquid-assets-card');
    liquidCard.style.borderLeft = liquidChange >= 0 ? '4px solid var(--success-color)' : '4px solid var(--danger-color)';
}

// Create all charts
function createAllCharts() {
    // Process data for charts
    const dates = financialData.map(item => item.Date);
    const guildTotalValue = financialData.map(item => parseFloat(item['Guild Total Value (including illiquid assets)']));
    const totalIlliquid = financialData.map(item => parseFloat(item['Total Illiquid/Non-sell assets']));
    const totalLiquid = financialData.map(item => parseFloat(item['Total Liquid/Sellable Assets']));
    const netLiquidValue = financialData.map(item => parseFloat(item['Net Liquid Value']));
    const amountOwed = financialData.map(item => parseFloat(item['Amount Owed to Members (Bot)']));
    const siphonedNet = financialData.map(item => parseFloat(item['Siphoned Net (Deposit - Withdraw)']));
    const activePlayersTotal = financialData.map(item => parseFloat(item['Active Players']));
    const ocularActive = financialData.map(item => parseFloat(item['Ocular  (Active Last Week)']));
    const vanguardActive = financialData.map(item => parseFloat(item['Ocular Vanguard (Active Last Week)']));
    const universityActive = financialData.map(item => parseFloat(item['Ocular University (Active Last Week)']));
    
    // Create Guild Total Value Chart
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
    
    // Create Liquid vs Illiquid Assets Chart
    const latestTotalLiquid = totalLiquid[totalLiquid.length - 1];
    const latestTotalIlliquid = totalIlliquid[totalIlliquid.length - 1];
    
    chartInstances.liquidIlliquid = new Chart(document.getElementById('liquidIlliquidChart'), {
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
                            return `${context.label}: ${parseInt(context.raw).toLocaleString()}`;
                        }
                    }
                }
            }
        }
    });
    
    // Create Net Liquid Value Trend Chart
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
    
    // Create Amount Owed Chart - Using latest entry to get various owed categories
    const latestEntry = financialData[financialData.length - 1];
    
    chartInstances.amountOwed = new Chart(document.getElementById('amountOwedChart'), {
        type: 'bar',
        data: {
            labels: ['Total Owed', 'Ocular Silver', 'OCLU Silver', 'Vanguard Silver', 'Alt Silver'],
            datasets: [{
                label: 'Amount',
                data: [
                    parseFloat(latestEntry['Amount Owed to Members (Bot)']),
                    parseFloat(latestEntry['Ocular Silver']),
                    parseFloat(latestEntry['OCLU Silver']),
                    parseFloat(latestEntry['Vanguard Silver']),
                    parseFloat(latestEntry['Alt Silver'])
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
                            return value.toLocaleString();
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${parseInt(context.raw).toLocaleString()}`;
                        }
                    }
                }
            }
        }
    });
    
    // Create Siphoned Net Chart
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
    
    // Create Active Players Chart
    const latestDate = dates[dates.length - 1];
    
    chartInstances.activePlayers = new Chart(document.getElementById('activePlayersChart'), {
        type: 'pie',
        data: {
            labels: ['Ocular', 'Vanguard', 'University', 'Other'],
            datasets: [{
                data: [
                    parseFloat(latestEntry['Ocular  (Active Last Week)']),
                    parseFloat(latestEntry['Ocular Vanguard (Active Last Week)']),
                    parseFloat(latestEntry['Ocular University (Active Last Week)']),
                    parseFloat(latestEntry['Active Players']) - 
                        (parseFloat(latestEntry['Ocular  (Active Last Week)']) + 
                         parseFloat(latestEntry['Ocular Vanguard (Active Last Week)']) + 
                         parseFloat(latestEntry['Ocular University (Active Last Week)']))
                ],
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

// Helper function to create a line chart
function createLineChart(canvasId, title, labels, datasets) {
    return new Chart(document.getElementById(canvasId), {
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
                            return `${context.dataset.label}: ${parseInt(context.raw).toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString();
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
}

// Filter data by time period
function filterData(period) {
    if (period === 'all') {
        return financialData;
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
        const itemDate = new Date(item.Date);
        return itemDate >= cutoffDate;
    });
}

// Setup event listeners for chart filters
function setupEventListeners() {
    // Guild Total Value chart filters
    document.getElementById('gtv-monthly').addEventListener('click', () => {
        updateChart('guildTotalValue', 'monthly');
    });
    
    document.getElementById('gtv-all').addEventListener('click', () => {
        updateChart('guildTotalValue', 'all');
    });
    
    // Net Liquid Value chart filters
    document.getElementById('nlv-monthly').addEventListener('click', () => {
        updateChart('netLiquidValue', 'monthly');
    });
    
    document.getElementById('nlv-all').addEventListener('click', () => {
        updateChart('netLiquidValue', 'all');
    });
    
    // Siphoned Net Value chart filters
    document.getElementById('siphon-quarterly').addEventListener('click', () => {
        updateChart('siphonedNet', 'quarterly');
    });
    
    document.getElementById('siphon-all').addEventListener('click', () => {
        updateChart('siphonedNet', 'all');
    });
    
    // Refresh buttons
    document.getElementById('asset-refresh').addEventListener('click', () => {
        updateAssetDistributionChart();
    });
    
    document.getElementById('owed-refresh').addEventListener('click', () => {
        updateAmountOwedChart();
    });
    
    document.getElementById('players-refresh').addEventListener('click', () => {
        updateActivePlayersChart();
    });
}

// Update chart with filtered data
function updateChart(chartName, period) {
    const filteredData = filterData(period);
    
    // If no data after filtering, return
    if (filteredData.length === 0) return;
    
    const dates = filteredData.map(item => item.Date);
    
    switch(chartName) {
        case 'guildTotalValue':
            const guildTotalValue = filteredData.map(item => parseFloat(item['Guild Total Value (including illiquid assets)']));
            chartInstances.guildTotalValue.data.labels = dates;
            chartInstances.guildTotalValue.data.datasets[0].data = guildTotalValue;
            chartInstances.guildTotalValue.update();
            break;
            
        case 'netLiquidValue':
            const netLiquidValue = filteredData.map(item => parseFloat(item['Net Liquid Value']));
            chartInstances.netLiquidValue.data.labels = dates;
            chartInstances.netLiquidValue.data.datasets[0].data = netLiquidValue;
            chartInstances.netLiquidValue.update();
            break;
            
        case 'siphonedNet':
            const siphonedNet = filteredData.map(item => parseFloat(item['Siphoned Net (Deposit - Withdraw)']));
            chartInstances.siphonedNet.data.labels = dates;
            chartInstances.siphonedNet.data.datasets[0].data = siphonedNet;
            chartInstances.siphonedNet.update();
            break;
    }
}

// Update asset distribution chart with latest data
function updateAssetDistributionChart() {
    const latestData = financialData[financialData.length - 1];
    
    if (!latestData) return;
    
    const liquidAssets = parseFloat(latestData['Total Liquid/Sellable Assets']);
    const illiquidAssets = parseFloat(latestData['Total Illiquid/Non-sell assets']);
    
    chartInstances.liquidIlliquid.data.datasets[0].data = [liquidAssets, illiquidAssets];
    chartInstances.liquidIlliquid.update();
}

// Update amount owed chart with latest data
function updateAmountOwedChart() {
    const latestData = financialData[financialData.length - 1];
    
    if (!latestData) return;
    
    chartInstances.amountOwed.data.datasets[0].data = [
        parseFloat(latestData['Amount Owed to Members (Bot)']),
        parseFloat(latestData['Ocular Silver']),
        parseFloat(latestData['OCLU Silver']),
        parseFloat(latestData['Vanguard Silver']),
        parseFloat(latestData['Alt Silver'])
    ];
    
    chartInstances.amountOwed.update();
}

// Update active players chart with latest data
function updateActivePlayersChart() {
    const latestData = financialData[financialData.length - 1];
    
    if (!latestData) return;
    
    chartInstances.activePlayers.data.datasets[0].data = [
        parseFloat(latestData['Ocular  (Active Last Week)']),
        parseFloat(latestData['Ocular Vanguard (Active Last Week)']),
        parseFloat(latestData['Ocular University (Active Last Week)']),
        parseFloat(latestData['Active Players']) - 
            (parseFloat(latestData['Ocular  (Active Last Week)']) + 
             parseFloat(latestData['Ocular Vanguard (Active Last Week)']) + 
             parseFloat(latestData['Ocular University (Active Last Week)']))
    ];
    
    chartInstances.activePlayers.update();
}

// Initialize the application
fetchData();