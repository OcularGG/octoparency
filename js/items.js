/**
 * items.js
 *
 * Parses the provided CSV data and provides an item lookup function.
 */

async function loadItemsFromCSV(csvData) {
    const items = {};
    const lines = csvData.split('\n');
    const headers = lines[0].split(',');

    for (let i = 1; i < lines.length; i++) {
        const data = lines[i].split(',');
        if (data.length === headers.length) {
            const item = {};
            for (let j = 0; j < headers.length; j++) {
                item[headers[j].trim()] = data[j].trim();
            }
            if (item['T4A ID']) {
                items[item['T4A ID']] = item;
            }
        }
    }
    return items;
}

async function getItemInfo(itemId) {
    if (!window.itemData) {
        console.warn('Item data not loaded yet.');
        return null;
    }
    return window.itemData[itemId] || null;
}

// Load item data from CSV
async function initializeItems() {
    try {
        const response = await fetch('apicsv.csv');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvData = await response.text();
        window.itemData = await loadItemsFromCSV(csvData);
        console.log('Item data loaded successfully.');
    } catch (error) {
        console.error('Error loading item data:', error);
    }
}

// Initialize items when the script is loaded
(async () => {
    await initializeItems();
})();

window.getItemInfo = getItemInfo;
