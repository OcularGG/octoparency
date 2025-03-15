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