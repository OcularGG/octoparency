/**
 * items.js - Optimized Version
 *
 * Efficiently loads and processes item data from CSV with
 * better performance, caching, and error handling.
 */

// Cache for storing item data with version control
const CACHE_VERSION = '1.0';
let itemDataCache = null;

/**
 * Parses CSV data in chunks to prevent UI blocking
 * @param {string} csvData - Raw CSV data as string
 * @returns {Promise<Object>} - Promise resolving to item data object
 */
async function loadItemsFromCSV(csvData) {
    if (!csvData || typeof csvData !== 'string') {
        console.error('Invalid CSV data provided');
        return {};
    }

    return new Promise(async (resolve) => {
        const items = {};
        const lines = csvData.trim().split('\n');
        
        if (lines.length <= 1) {
            console.warn('CSV data appears to be empty or contains only headers');
            resolve(items);
            return;
        }
        
        const headers = lines[0].split(',');
        
        // Process the CSV in chunks to avoid blocking the main thread
        const chunkSize = 500; // Process 500 items at a time
        const totalChunks = Math.ceil((lines.length - 1) / chunkSize);
        
        for (let chunk = 0; chunk < totalChunks; chunk++) {
            const start = chunk * chunkSize + 1; // +1 to skip headers
            const end = Math.min(start + chunkSize, lines.length);
            
            // Yield to browser between chunks to prevent UI freezing
            await new Promise(yieldResolve => {
                requestAnimationFrame(() => {
                    processChunk(lines, start, end, headers, items);
                    
                    // Report progress if progress reporting function exists
                    if (typeof window.updateLoadingProgress === 'function' && totalChunks > 1) {
                        const progress = Math.round((chunk + 1) / totalChunks * 100);
                        window.updateLoadingProgress('items', progress);
                    }
                    
                    yieldResolve();
                });
            });
        }
        
        console.log(`Item data loaded successfully: ${Object.keys(items).length} items processed`);
        resolve(items);
    });
}

/**
 * Process a chunk of CSV data
 * @private
 */
function processChunk(lines, start, end, headers, itemsObject) {
    for (let i = start; i < end; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const data = parseCSVLine(line);
        
        if (data.length === headers.length) {
            const item = {};
            for (let j = 0; j < headers.length; j++) {
                item[headers[j].trim()] = data[j].trim();
            }
            
            if (item['T4A ID']) {
                itemsObject[item['T4A ID']] = item;
            }
        }
    }
}

/**
 * Parse a CSV line correctly handling quoted values
 * @private
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"' && (i === 0 || line[i-1] !== '\\')) {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current); // Don't forget the last field
    return result;
}

/**
 * Gets information for a specific item by ID
 * @param {string} itemId - The item ID to look up
 * @returns {Object|null} - The item data or null if not found
 */
async function getItemInfo(itemId) {
    if (!window.itemData) {
        console.warn('Item data not loaded yet.');
        return null;
    }
    
    const item = window.itemData[itemId];
    
    if (!item) {
        console.warn(`Item ID "${itemId}" not found in item database.`);
        return null;
    }
    
    return item;
}

/**
 * Load item data from cache or from CSV if cache not available
 * @returns {Promise<Object>} - The loaded item data
 */
async function initializeItems() {
    // Check for cached data first
    if (tryLoadFromCache()) {
        return window.itemData;
    }
    
    try {
        console.log('Loading item data from CSV...');
        const startTime = performance.now();
        
        const response = await fetch('apicsv.csv');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvData = await response.text();
        window.itemData = await loadItemsFromCSV(csvData);
        
        // Save to cache for future use
        saveToCache(window.itemData);
        
        const loadTime = (performance.now() - startTime).toFixed(2);
        console.log(`Item data loaded successfully in ${loadTime}ms.`);
        
        return window.itemData;
    } catch (error) {
        console.error('Error loading item data:', error);
        // Fallback to empty object
        window.itemData = {};
        return window.itemData;
    }
}

/**
 * Try to load item data from browser cache
 * @private
 * @returns {boolean} - True if loaded from cache, false otherwise
 */
function tryLoadFromCache() {
    try {
        const cachedData = localStorage.getItem('itemData');
        if (!cachedData) return false;
        
        const parsed = JSON.parse(cachedData);
        
        // Validate the cache version
        if (parsed.version !== CACHE_VERSION) {
            console.log('Cache version mismatch, reloading data');
            return false;
        }
        
        window.itemData = parsed.data;
        console.log('Item data loaded from cache');
        return true;
    } catch (e) {
        console.warn('Failed to load from cache:', e);
        return false;
    }
}

/**
 * Save item data to browser cache
 * @private
 * @param {Object} data - The item data to cache
 */
function saveToCache(data) {
    try {
        const cacheObject = {
            version: CACHE_VERSION,
            timestamp: Date.now(),
            data: data
        };
        localStorage.setItem('itemData', JSON.stringify(cacheObject));
        console.log('Item data saved to cache');
    } catch (e) {
        console.warn('Failed to save to cache:', e);
        // Might be quota exceeded or private browsing mode
    }
}

/**
 * Force reload of item data bypassing the cache
 * @returns {Promise<Object>} - The reloaded item data
 */
async function reloadItemData() {
    localStorage.removeItem('itemData');
    return initializeItems();
}

/**
 * Get the number of items loaded
 * @returns {number} - Count of items in the database
 */
function getItemCount() {
    return window.itemData ? Object.keys(window.itemData).length : 0;
}

// Initialize items when the script is loaded
(async () => {
    await initializeItems();
})();

// Export the functions for external use
window.getItemInfo = getItemInfo;
window.reloadItemData = reloadItemData;
window.getItemCount = getItemCount;
