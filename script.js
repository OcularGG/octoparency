// Replace with your deployed Google Apps Script URL
const apiUrl = 'https://script.google.com/macros/s/AKfycbwqtDif0ZKw4dfCrIN12L93XQwX9GeZPmC2nj72kbs-KFJpfHlqoQ2lp4iMzVsseCHZ/exec';

// Fetch data from the API
fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
        // Process the data and create charts
        createCharts(data);
    })
    .catch(error => console.error('Error fetching data:', error));

// Function to create the charts
function createCharts(data) {
    const ctxIncomeExpenditure = document.getElementById('incomeExpenditureChart').getContext('2d');
    const ctxCategoryBreakdown = document.getElementById('categoryBreakdownChart').getContext('2d');
    const ctxMonthlySummary = document.getElementById('monthlySummaryChart').getContext('2d');
    const ctxNetIncomeTrend = document.getElementById('netIncomeTrendChart').getContext('2d');

    // Example data processing (customize according to your data structure)
    const dates = data.map(item => item.Date); // Assuming you have a 'Date' column
    const income = data.map(item => parseFloat(item.Income)); // Assuming you have an 'Income' column
    const expenditure = data.map(item => parseFloat(item.Expenditure)); // Assuming you have an 'Expenditure' column
    const categories = [...new Set(data.map(item => item.Category))]; // Assuming you have a 'Category' column
    const categoryData = categories.map(category => {
        return data.filter(item => item.Category === category).reduce((sum, item) => sum + parseFloat(item.Expenditure), 0);
    });

    // Income vs. Expenditure Line Chart
    new Chart(ctxIncomeExpenditure, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'Income',
                    data: income,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Expenditure',
                    data: expenditure,
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Category Breakdown Pie Chart
    new Chart(ctxCategoryBreakdown, {
        type: 'pie',
        data: {
            labels: categories,
            datasets: [{
                label: 'Category Breakdown',
                data: categoryData,
                backgroundColor: categories.map((_, i) => `hsl(${i * 50}, 70%, 70%)`),
                borderColor: categories.map((_, i) => `hsl(${i * 50}, 70%, 30%)`),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                }
            }
        }
    });

    // Monthly Summary Bar Chart
    const monthlySummary = getMonthlySummary(data);
    new Chart(ctxMonthlySummary, {
        type: 'bar',
        data: {
            labels: monthlySummary.months,
            datasets: [
                {
                    label: 'Income',
                    data: monthlySummary.income,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Expenditure',
                    data: monthlySummary.expenditure,
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Net Income Trend Line Chart
    const netIncome = income.map((inc, i) => inc - expenditure[i]);
    new Chart(ctxNetIncomeTrend, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Net Income',
                data: netIncome,
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Helper function to get monthly summary
function getMonthlySummary(data) {
    const summary = {};
    data.forEach(item => {
        const date = new Date(item.Date);
        const monthYear = `${date.getMonth() + 1}-${date.getFullYear()}`;
        if (!summary[monthYear]) {
            summary[monthYear] = { income: 0, expenditure: 0 };
        }
        summary[monthYear].income += parseFloat(item.Income);
        summary[monthYear].expenditure += parseFloat(item.Expenditure);
    });

    const months = Object.keys(summary);
    const income = months.map(month => summary[month].income);
    const expenditure = months.map(month => summary[month].expenditure);

    return { months, income, expenditure };
}

document.addEventListener('DOMContentLoaded', function() {
    // Set up Chart.js defaults
    Chart.defaults.font.family = "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
    Chart.defaults.color = '#718096';
    Chart.defaults.plugins.title.font.weight = 'normal';
    
    // Sample data for demonstration
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Commits Over Time Chart
    const commitsCtx = document.getElementById('commitsChart').getContext('2d');
    const commitsChart = new Chart(commitsCtx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Commits',
                data: [165, 210, 145, 250, 320, 280, 350, 390, 360, 410, 480, 520],
                borderColor: '#4299e1',
                backgroundColor: 'rgba(66, 153, 225, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#4299e1',
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: '#2a4365',
                    padding: 10,
                    bodyFont: {
                        size: 14
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        borderDash: [2, 4],
                        color: '#e2e8f0'
                    }
                }
            }
        }
    });
    
    // Language Distribution Chart
    const languageCtx = document.getElementById('languageChart').getContext('2d');
    const languageChart = new Chart(languageCtx, {
        type: 'doughnut',
        data: {
            labels: ['JavaScript', 'Python', 'Java', 'TypeScript', 'C#', 'Other'],
            datasets: [{
                data: [35, 25, 15, 10, 10, 5],
                backgroundColor: [
                    '#f6e05e', // JavaScript
                    '#38b2ac', // Python
                    '#ed8936', // Java
                    '#3182ce', // TypeScript
                    '#9f7aea', // C#
                    '#a0aec0'  // Other
                ],
                borderWidth: 0,
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                }
            },
            cutout: '70%'
        }
    });
    
    // Contributors Activity Chart
    const contributorsCtx = document.getElementById('contributorsChart').getContext('2d');
    const contributorsChart = new Chart(contributorsCtx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [{
                label: 'Active Contributors',
                data: [42, 50, 55, 63, 60, 75, 80, 85, 92, 88, 95, 100],
                backgroundColor: '#805ad5'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        borderDash: [2, 4],
                        color: '#e2e8f0'
                    }
                }
            }
        }
    });
    
    // Issues Chart
    const issuesCtx = document.getElementById('issuesChart').getContext('2d');
    const issuesChart = new Chart(issuesCtx, {
        type: 'pie',
        data: {
            labels: ['Open', 'Closed', 'In Progress'],
            datasets: [{
                data: [25, 65, 10],
                backgroundColor: [
                    '#f56565', // Open (red)
                    '#48bb78', // Closed (green)
                    '#ecc94b'  // In Progress (yellow)
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'rectRounded'
                    }
                }
            }
        }
    });
});