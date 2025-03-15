# Financial Overview API Documentation

## Overview
The Financial Overview API provides access to financial data stored in a Google Sheet. The API retrieves data such as guild total value, liquid and illiquid assets, net liquid value, amounts owed to members, and siphoned net values, and returns it in a structured JSON format. This API can be used to build dashboards, reports, and other financial analysis tools.

## Endpoint
### GET Financial Data
Fetches the financial data from the Google Sheet.

**URL**: `https://script.google.com/macros/s/AKfycbwqtDif0ZKw4dfCrIN12L93XQwX9GeZPmC2nj72kbs-KFJpfHlqoQ2lp4iMzVsseCHZ/exec`

**Method**: `GET`

**URL Params**: None

**Data Params**: None

**Success Response**:
- **Code**: 200 OK
- **Content**:
    ```json
    [
        {
            "Date": "2025-01-01",
            "Guild Total Value (including illiquid assets)": "1000",
            "Total Illiquid/Non-sell assets": "400",
            "Total Liquid/Sellable Assets": "600",
            "Net Liquid Value": "500",
            "📈Liquid Change": "50",
            "Amount Owed to Members (Bot)": "200",
            "Alt Silver": "50",
            "Listed Amount?": "100",
            "Ocular Silver": "150",
            "OCLU Silver": "100",
            "Vanguard Silver": "50",
            "TOTAL Liquid Items": "300",
            "Sellable Items in SIV": "50",
            "Sellable Items in Delta HO": "50",
            "Sellable Items in ML": "50",
            "Sellable EMV in Thet": "50",
            "Sellable EMV in FS": "50",
            "Sellable EMV in Lym": "50",
            "Sellable EMV in BW": "50",
            "Random Illiquid Delta Assets - use comments pls": "30",
            "Random Illiquid SIV Assets - use comments pls": "20",
            "Random Illiquid Royals Assets - use comments pls": "10",
            "Active Players": "20",
            "Ocular  (Active Last Week)": "10",
            "Ocular Vanguard (Active Last Week)": "5",
            "Ocular University (Active Last Week)": "5",
            "Player": "Player1",
            "Reason": "Reason1",
            "Siphoned Net (Deposit - Withdraw)": "100"
        }
        // More records...
    ]
    ```

**Error Response**:
- **Code**: 400 BAD REQUEST
- **Content**:
    ```json
    {
        "error": "Invalid request"
    }
    ```

## Usage
### Fetching Data with JavaScript
You can fetch the financial data from the API using JavaScript's `fetch` function.

```javascript
fetch('https://script.google.com/macros/s/AKfycbwqtDif0ZKw4dfCrIN12L93XQwX9GeZPmC2nj72kbs-KFJpfHlqoQ2lp4iMzVsseCHZ/exec')
    .then(response => response.json())
    .then(data => {
        console.log(data);
        // Process and display the data as needed
    })
    .catch(error => console.error('Error fetching data:', error));
```

### Using the Data in Charts
The following example demonstrates how to use the fetched data to create a chart using Chart.js.

```javascript
fetch('https://script.google.com/macros/s/AKfycbwqtDif0ZKw4dfCrIN12L93XQwX9GeZPmC2nj72kbs-KFJpfHlqoQ2lp4iMzVsseCHZ/exec')
    .then(response => response.json())
    .then(data => {
        // Process the data
        const dates = data.map(item => item.Date);
        const guildTotalValue = data.map(item => parseFloat(item['Guild Total Value (including illiquid assets)']));
        const totalIlliquid = data.map(item => parseFloat(item['Total Illiquid/Non-sell assets']));
        const totalLiquid = data.map(item => parseFloat(item['Total Liquid/Sellable Assets']));
        const netLiquidValue = data.map(item => parseFloat(item['Net Liquid Value']));
        const amountOwed = data.map(item => parseFloat(item['Amount Owed to Members (Bot)']));
        const siphonedNet = data.map(item => parseFloat(item['Siphoned Net (Deposit - Withdraw)']));

        // Create a chart
        const ctx = document.getElementById('financialChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [
                    {
                        label: 'Guild Total Value',
                        data: guildTotalValue,
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Total Illiquid Assets',
                        data: totalIlliquid,
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Total Liquid Assets',
                        data: totalLiquid,
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Net Liquid Value',
                        data: netLiquidValue,
                        backgroundColor: 'rgba(153, 102, 255, 0.2)',
                        borderColor: 'rgba(153, 102, 255, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Amount Owed to Members',
                        data: amountOwed,
                        backgroundColor: 'rgba(255, 206, 86, 0.2)',
                        borderColor: 'rgba(255, 206, 86, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Siphoned Net (Deposit - Withdraw)',
                        data: siphonedNet,
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
    })
    .catch(error => console.error('Error fetching data:', error));
```

## Notes
- Ensure that the Google Sheet has the necessary columns for the API to work correctly.
- The API returns data in JSON format. You can use this data to create various visualizations and analyses.