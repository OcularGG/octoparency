/**
 * Database integration with Supabase
 * This file provides functions to interact with a Supabase backend
 */

// Supabase configuration
const SUPABASE_URL = 'https://jjghqgxcccqvsxywvddt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqZ2hxZ3hjY2NxdnN4eXd2ZGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTMzMzg4NzIsImV4cCI6MjAyODkxNDg3Mn0.JvOHFdWlc1fHdNjTQnuSNr0TiAQ4jIoZiLGK5l6rMp0';
const DOUBLE_OVERCHARGE_ID = 'TH8JjVwVRiuFnalrzESkRQ'; // Alliance ID

// For development, we'll also use localStorage as a fallback cache
const LOCAL_STORAGE_KEY = 'battleTab_events_cache';

/**
 * Function to detect environment
 * @returns {Object} Environment configuration
 */
function getEnvironmentConfig() {
  // Check environment variables first (works in Vercel)
  const envPreview = typeof process !== 'undefined' && 
    process.env.NEXT_PUBLIC_IS_PREVIEW === 'true';
    
  // Fallback to hostname detection (works for browser-only)
  const hostnamePreview = typeof window !== 'undefined' && 
    window.location.hostname.includes('vercel.app') && 
    !window.location.hostname.includes('battletab.vercel.app');
    
  // For local development detection
  const isLocalDev = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1');
  
  // Main production URL detection
  const isProduction = typeof window !== 'undefined' && 
    window.location.hostname === 'battletab.vercel.app';
  
  // Add debug logging to help troubleshoot environment detection
  console.log({
    envPreview,
    hostnamePreview,
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'not in browser'
  });
  
  let environment = 'production';
  if (envPreview || hostnamePreview) {
    environment = 'preview';
  } else if (isLocalDev) {
    environment = 'development';
  }
  
  console.log(`Running in ${environment} environment`);
  return { environment };
}

/**
 * Get table prefix based on environment
 * @returns {string} Table prefix
 */
function getTablePrefix() {
  const { environment } = getEnvironmentConfig();
  return environment === 'preview' ? 'preview_' : '';
}

/**
 * Initialize Supabase client
 * @returns {Object} Supabase client
 */
function initSupabase() {
  try {
    // Initialize the actual Supabase client
    const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { environment } = getEnvironmentConfig();
    console.log(`Supabase client initialized for ${environment} environment`);
    return client;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return createFallbackClient();
  }
}

/**
 * Create a fallback client that uses localStorage
 * @returns {Object} Fallback client with Supabase-like interface
 */
function createFallbackClient() {
  console.log('Using localStorage fallback for data storage');
  return {
    from: (table) => ({
      select: () => ({
        order: () => ({
          limit: async () => getFromLocalCache()
        }),
        eq: () => ({
          limit: async () => getFromLocalCache()
        })
      }),
      insert: async (data) => saveToLocalCache(data),
      upsert: async (data) => saveToLocalCache(data)
    }),
    storage: {
      from: () => ({
        upload: async () => ({ data: { path: 'simulated-path' } }),
        getPublicUrl: () => ({ data: { publicUrl: 'simulated-url' } })
      })
    }
  };
}

/**
 * Save deaths to local cache (fallback or additional cache layer)
 * @param {Array} deaths - Death events to cache
 */
async function saveToLocalCache(deaths) {
  try {
    const existingData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    deaths.forEach(death => {
      const existingIndex = existingData.findIndex(d => d.EventId === death.EventId);
      if (existingIndex >= 0) {
        existingData[existingIndex] = death;
      } else {
        existingData.push(death);
      }
    });
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existingData));
    console.log(`Cached ${deaths.length} deaths locally`);
    return { data: deaths };
  } catch (e) {
    console.error('Error caching deaths:', e);
    return { error: e };
  }
}

/**
 * Get deaths from local cache
 * @param {number} limit - Max items to retrieve
 * @returns {Array} - Cached death events
 */
async function getFromLocalCache(limit = 50) {
  try {
    const data = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    // Sort by timestamp, newest first
    data.sort((a, b) => new Date(b.TimeStamp) - new Date(a.TimeStamp));
    return { data: data.slice(0, limit) };
  } catch (e) {
    console.error('Error retrieving cached deaths:', e);
    return { data: [], error: e };
  }
}

/**
 * Save events (deaths or kills) to database
 * @param {Array} events - Events to save
 * @returns {Promise} - Result of database operation
 */
async function saveEvents(events) {
  if (!Array.isArray(events)) {
    events = [events];
  }
  
  // Save to local cache regardless of whether Supabase is available
  await saveToLocalCache(events);
  
  // Separate deaths and killmails
  const deaths = [];
  const killmails = [];
  
  events.forEach(event => {
    // Format the event data for database storage
    const formattedEvent = {
      event_id: event.EventId,
      timestamp: event.TimeStamp,
      victim_id: event.Victim?.Id,
      victim_name: event.Victim?.Name,
      victim_guild: event.Victim?.GuildName,
      victim_alliance_id: event.Victim?.AllianceId,
      killer_id: event.Killer?.Id,
      killer_name: event.Killer?.Name,
      killer_guild: event.Killer?.GuildName,
      killer_alliance_id: event.Killer?.AllianceId,
      fame: event.TotalVictimKillFame,
      event_data: event
    };
    
    // Check if this is a death or killmail
    if (event.Victim?.AllianceId === DOUBLE_OVERCHARGE_ID) {
      deaths.push(formattedEvent);
    } else if (event.Killer?.AllianceId === DOUBLE_OVERCHARGE_ID) {
      killmails.push(formattedEvent);
    }
  });
  
  // Use table prefix for different environments
  const prefix = getTablePrefix();
  
  try {
    const results = await Promise.all([
      // Insert or update deaths
      deaths.length > 0 ? supabase
        .from(`${prefix}deaths`)
        .upsert(deaths, { onConflict: 'event_id' }) 
        : { data: [], error: null },
      
      // Insert or update killmails
      killmails.length > 0 ? supabase
        .from(`${prefix}killmails`)
        .upsert(killmails, { onConflict: 'event_id' }) 
        : { data: [], error: null }
    ]);
    
    const [deathsResult, killmailsResult] = results;
    
    if (deathsResult.error) {
      console.error('Error saving deaths to Supabase:', deathsResult.error);
    } else if (deaths.length > 0) {
      console.log(`Saved ${deaths.length} deaths to Supabase`);
    }
    
    if (killmailsResult.error) {
      console.error('Error saving killmails to Supabase:', killmailsResult.error);
    } else if (killmails.length > 0) {
      console.log(`Saved ${killmails.length} killmails to Supabase`);
    }
    
    return { 
      data: events, 
      source: 'supabase', 
      deaths: deathsResult.data, 
      killmails: killmailsResult.data 
    };
  } catch (error) {
    console.error('Exception saving to Supabase:', error);
    return { data: events, error, source: 'localStorage' };
  }
}

/**
 * Get events (deaths and/or killmails) from database
 * @param {Object} options - Query options
 * @param {number} options.limit - Max items to retrieve
 * @param {string} options.allianceId - Filter by alliance ID
 * @param {string} options.eventType - Filter by event type ('death' or 'killmail')
 * @returns {Promise<Array>} - Events
 */
async function getEvents({ limit = 50, allianceId = null, eventType = null }) {
  try {
    const prefix = getTablePrefix();
    
    let deathsPromise = Promise.resolve({ data: [] });
    let killmailsPromise = Promise.resolve({ data: [] });
    
    // Fetch deaths if needed
    if (!eventType || eventType === 'death') {
      deathsPromise = supabase
        .from(`${prefix}deaths`)
        .select('event_data')
        .order('timestamp', { ascending: false })
        .limit(limit);
      
      if (allianceId) {
        deathsPromise = deathsPromise.eq('victim_alliance_id', allianceId);
      }
    }
    
    // Fetch killmails if needed
    if (!eventType || eventType === 'killmail') {
      killmailsPromise = supabase
        .from(`${prefix}killmails`)
        .select('event_data')
        .order('timestamp', { ascending: false })
        .limit(limit);
      
      if (allianceId) {
        killmailsPromise = killmailsPromise.eq('killer_alliance_id', allianceId);
      }
    }
    
    const [deathsResult, killmailsResult] = await Promise.all([deathsPromise, killmailsPromise]);
    
    // Handle errors
    if (deathsResult.error) {
      console.warn('Supabase deaths query error:', deathsResult.error);
    }
    
    if (killmailsResult.error) {
      console.warn('Supabase killmails query error:', killmailsResult.error);
    }
    
    // If both failed, fall back to local cache
    if (deathsResult.error && killmailsResult.error) {
      console.warn('Both queries failed, falling back to local cache');
      return getFromLocalCache(limit);
    }
    
    // Extract event_data from results
    const deaths = deathsResult.data?.map(row => {
      const event = row.event_data;
      event.eventType = 'death';
      return event;
    }) || [];
    
    const killmails = killmailsResult.data?.map(row => {
      const event = row.event_data;
      event.eventType = 'killmail';
      return event;
    }) || [];
    
    // Combine and sort by timestamp
    let allEvents = [...deaths, ...killmails].sort((a, b) => 
      new Date(b.TimeStamp) - new Date(a.TimeStamp)
    );
    
    // Limit the final result set
    allEvents = allEvents.slice(0, limit);
    
    if (allEvents.length > 0) {
      console.log(`Retrieved ${deaths.length} deaths and ${killmails.length} killmails from Supabase`);
      
      // Update local cache with the latest data
      await saveToLocalCache(allEvents);
      return { data: allEvents, source: 'supabase' };
    } else {
      console.log('No data in Supabase, checking local cache');
      return getFromLocalCache(limit);
    }
  } catch (error) {
    console.error('Exception querying Supabase:', error);
    return getFromLocalCache(limit);
  }
}

/**
 * Save a receipt image to storage
 * @param {string} imageData - Base64 encoded image data
 * @param {Object} event - Event data
 * @returns {Promise<string>} - URL of the saved image
 */
async function saveReceiptImage(imageData, event) {
  try {
    const eventId = event.EventId;
    const eventType = event.eventType || 
                      (event.Victim?.AllianceId === DOUBLE_OVERCHARGE_ID ? 'death' : 'killmail');
    
    // Convert base64 to blob
    const base64Data = imageData.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });
    
    // Create file from blob
    const file = new File([blob], `receipt_${eventId}.png`, { type: 'image/png' });
    
    // Determine storage folder based on environment
    const { environment } = getEnvironmentConfig();
    const storagePrefix = environment === 'preview' ? 'preview/' : '';
    
    // Upload to Supabase storage with environment prefix
    const { data, error } = await supabase.storage
      .from('receipts')
      .upload(`${storagePrefix}${eventType}/${eventId}.png`, file, {
        upsert: true
      });
    
    if (error) {
      console.error('Error uploading receipt to Supabase:', error);
      return imageData; // Fall back to returning the original image data
    }
    
    // Get public URL
    const { data: urlData } = await supabase.storage
      .from('receipts')
      .getPublicUrl(`${storagePrefix}${eventType}/${eventId}.png`);
    
    // Store the receipt reference
    await supabase
      .from('receipts') // Add prefix here
      .upsert({ 
        event_id: eventId,
        event_type: eventType,
        image_url: urlData.publicUrl
      }, { onConflict: 'event_id' });
    
    console.log(`Receipt saved to Supabase: ${urlData.publicUrl} (${eventType})`);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Exception saving receipt image:', error);
    return imageData; // Fall back to returning the original image data
  }
}

// Backward compatibility functions
async function getDeaths(options) {
  return getEvents({...options, eventType: 'death'});
}

async function saveDeath(deaths) {
  return saveEvents(deaths);
}

// Export functions
window.db = {
  saveDeath,       // Deprecated but kept for compatibility
  getDeaths,       // Deprecated but kept for compatibility
  saveEvents,      // Function to save both deaths and killmails
  getEvents,       // Function to get both deaths and killmails
  saveReceiptImage // Updated function to save receipt images with event type
};

// Test connection on initialization
(async function testConnection() {
  const supabase = initSupabase();
  try {
    // Try to query the deaths table
    const { data: deathsData, error: deathsError } = await supabase
      .from('deaths')
      .select('count(*)', { count: 'exact', head: true });
    
    // Try to query the killmails table
    const { data: killmailsData, error: killmailsError } = await supabase
      .from('killmails')
      .select('count(*)', { count: 'exact', head: true });
    
    if (deathsError && killmailsError) {
      console.error('Failed to connect to Supabase:', deathsError);
    } else {
      console.log('Successfully connected to Supabase database');
    }
  } catch (error) {
    console.error('Exception testing Supabase connection:', error);
  }
})();

/**
 * database.js - Enhanced Database Layer
 * 
 * Features:
 * - Optimized IndexedDB operations
 * - Transaction batching
 * - Robust error handling
 * - Auto migration for schema changes
 */

const DB_NAME = 'battletabDB';
const DB_VERSION = 1;
let db = null;
let dbInitPromise = null;

/**
 * Initialize the database connection
 * @returns {Promise<IDBDatabase>} Database connection promise
 */
function initDB() {
    // Return existing promise if already initializing
    if (dbInitPromise) return dbInitPromise;
    
    // Return existing connection if available
    if (db) return Promise.resolve(db);
    
    dbInitPromise = new Promise((resolve, reject) => {
        // Check if IndexedDB is available
        if (!window.indexedDB) {
            const error = new Error('IndexedDB is not supported in this browser');
            console.error(error);
            reject(error);
            return;
        }
        
        console.log('Initializing database...');
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = (event) => {
            const error = new Error(`Database error: ${event.target.error}`);
            console.error(error);
            reject(error);
        };
        
        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('Database initialized successfully');
            
            // Handle connection errors
            db.onerror = (event) => {
                console.error(`Database error: ${event.target.error}`);
            };
            
            resolve(db);
        };
        
        // Handle database upgrades/migrations
        request.onupgradeneeded = (event) => {
            console.log(`Upgrading database from version ${event.oldVersion} to ${event.newVersion}`);
            const database = event.target.result;
            
            // Create object stores if they don't exist
            if (!database.objectStoreNames.contains('events')) {
                const eventStore = database.createObjectStore('events', { keyPath: 'id' });
                eventStore.createIndex('by_timestamp', 'TimeStamp', { unique: false });
                eventStore.createIndex('by_eventType', 'eventType', { unique: false });
                eventStore.createIndex('by_eventId', 'EventId', { unique: false });
                console.log('Created events store');
            }
            
            if (!database.objectStoreNames.contains('settings')) {
                database.createObjectStore('settings', { keyPath: 'key' });
                console.log('Created settings store');
            }
            
            if (!database.objectStoreNames.contains('players')) {
                const playerStore = database.createObjectStore('players', { keyPath: 'Id' });
                playerStore.createIndex('by_name', 'Name', { unique: false });
                playerStore.createIndex('by_guild', 'GuildId', { unique: false });
                console.log('Created players store');
            }
        };
    });
    
    // Clear promise reference when settled
    dbInitPromise.finally(() => {
        dbInitPromise = null;
    });
    
    return dbInitPromise;
}

/**
 * Store a batch of events in the database
 * 
 * @param {Array} events - Array of event objects
 * @returns {Promise<boolean>} Success status
 */
async function storeEvents(events) {
    if (!Array.isArray(events) || events.length === 0) {
        console.warn('No events provided to store');
        return false;
    }
    
    try {
        const database = await initDB();
        
        // Process events in batches to avoid UI freezing
        const batchSize = 50;
        const batches = [];
        
        for (let i = 0; i < events.length; i += batchSize) {
            const batch = events.slice(i, i + batchSize);
            batches.push(batch);
        }
        
        // Process each batch sequentially
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            
            await new Promise((resolve, reject) => {
                const transaction = database.transaction(['events'], 'readwrite');
                const store = transaction.objectStore('events');
                
                transaction.oncomplete = () => resolve();
                transaction.onerror = (e) => reject(e.target.error);
                
                batch.forEach(event => {
                    // Generate consistent ID if missing
                    if (!event.id) {
                        const idBase = event.EventId || event.eventId || `event-${Date.now()}`;
                        event.id = `${idBase}-${Math.random().toString(36).substr(2, 9)}`;
                    }
                    
                    // Add or update timestamp for indexing
                    if (event.TimeStamp && typeof event.TimeStamp === 'string') {
                        try {
                            event._timestampMs = new Date(event.TimeStamp).getTime();
                        } catch (e) {
                            console.warn('Invalid timestamp format', event.TimeStamp);
                        }
                    }
                    
                    store.put(event);
                });
            });
            
            // Allow UI to breathe between batches
            if (i < batches.length - 1) {
                await new Promise(r => setTimeout(r, 0));
            }
        }
        
        console.log(`Stored ${events.length} events in database`);
        return true;
    } catch (error) {
        console.error('Failed to store events:', error);
        return false;
    }
}

/**
 * Get events from the database
 * 
 * @param {Object} options - Query options
 * @param {number} options.limit - Maximum number of events to return
 * @param {string} options.order - Sort order ('asc' or 'desc')
 * @param {number} options.startTime - Filter events after this timestamp
 * @param {number} options.endTime - Filter events before this timestamp
 * @param {string} options.eventType - Filter by event type
 * @returns {Promise<Array>} Array of events
 */
async function getEvents(options = {}) {
    const limit = options.limit || 100;
    const order = options.order || 'desc';
    
    try {
        const database = await initDB();
        
        return new Promise((resolve, reject) => {
            const transaction = database.transaction(['events'], 'readonly');
            const store = transaction.objectStore('events');
            const index = store.index('by_timestamp');
            
            let range = null;
            if (options.startTime && options.endTime) {
                range = IDBKeyRange.bound(options.startTime, options.endTime);
            } else if (options.startTime) {
                range = IDBKeyRange.lowerBound(options.startTime);
            } else if (options.endTime) {
                range = IDBKeyRange.upperBound(options.endTime);
            }
            
            const direction = order === 'asc' ? 'next' : 'prev';
            const request = index.openCursor(range, direction);
            const results = [];
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor && results.length < limit) {
                    const event = cursor.value;
                    
                    // Apply event type filter if specified
                    if (!options.eventType || 
                        event.eventType === options.eventType ||
                        (event.EventType && event.EventType === options.eventType)) {
                        results.push(cursor.value);
                    }
                    
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };
            
            request.onerror = (event) => {
                console.error('Error reading events:', event.target.error);
                reject(event.target.error);
            };
        });
    } catch (error) {
        console.error('Failed to get events:', error);
        return [];
    }
}

/**
 * Count events in the database
 * 
 * @param {Object} options - Query options
 * @returns {Promise<number>} Event count
 */
async function countEvents(options = {}) {
    try {
        const database = await initDB();
        
        return new Promise((resolve, reject) => {
            const transaction = database.transaction(['events'], 'readonly');
            const store = transaction.objectStore('events');
            
            const request = store.count();
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = (event) => {
                console.error('Error counting events:', event.target.error);
                reject(event.target.error);
            };
        });
    } catch (error) {
        console.error('Failed to count events:', error);
        return 0;
    }
}

/**
 * Clear all events from the database
 * 
 * @returns {Promise<boolean>} Success status
 */
async function clearEvents() {
    try {
        const database = await initDB();
        
        return new Promise((resolve, reject) => {
            const transaction = database.transaction(['events'], 'readwrite');
            const store = transaction.objectStore('events');
            
            const request = store.clear();
            
            request.onsuccess = () => {
                console.log('All events cleared from database');
                resolve(true);
            };
            
            request.onerror = (event) => {
                console.error('Error clearing events:', event.target.error);
                reject(event.target.error);
            };
        });
    } catch (error) {
        console.error('Failed to clear events:', error);
        return false;
    }
}

/**
 * Store player data in the database
 * 
 * @param {Object} player - Player object
 * @returns {Promise<boolean>} Success status
 */
async function storePlayer(player) {
    if (!player || !player.Id) {
        console.warn('Invalid player data provided');
        return false;
    }
    
    try {
        const database = await initDB();
        
        return new Promise((resolve, reject) => {
            const transaction = database.transaction(['players'], 'readwrite');
            const store = transaction.objectStore('players');
            
            const request = store.put(player);
            
            request.onsuccess = () => {
                resolve(true);
            };
            
            request.onerror = (event) => {
                console.error('Error storing player:', event.target.error);
                reject(event.target.error);
            };
        });
    } catch (error) {
        console.error('Failed to store player:', error);
        return false;
    }
}

/**
 * Get a player from the database
 * 
 * @param {string} playerId - Player ID
 * @returns {Promise<Object>} Player object or null
 */
async function getPlayer(playerId) {
    try {
        const database = await initDB();
        
        return new Promise((resolve, reject) => {
            const transaction = database.transaction(['players'], 'readonly');
            const store = transaction.objectStore('players');
            
            const request = store.get(playerId);
            
            request.onsuccess = () => {
                resolve(request.result || null);
            };
            
            request.onerror = (event) => {
                console.error('Error getting player:', event.target.error);
                reject(event.target.error);
            };
        });
    } catch (error) {
        console.error('Failed to get player:', error);
        return null;
    }
}

/**
 * Save a setting to the database
 * 
 * @param {string} key - Setting key
 * @param {any} value - Setting value
 * @returns {Promise<boolean>} Success status
 */
async function saveSetting(key, value) {
    if (!key) {
        console.warn('No key provided for setting');
        return false;
    }
    
    try {
        const database = await initDB();
        
        return new Promise((resolve, reject) => {
            const transaction = database.transaction(['settings'], 'readwrite');
            const store = transaction.objectStore('settings');
            
            const request = store.put({ key, value });
            
            request.onsuccess = () => {
                resolve(true);
            };
            
            request.onerror = (event) => {
                console.error(`Error saving setting "${key}":`, event.target.error);
                reject(event.target.error);
            };
        });
    } catch (error) {
        console.error('Failed to save setting:', error);
        return false;
    }
}

/**
 * Get a setting from the database
 * 
 * @param {string} key - Setting key
 * @param {any} defaultValue - Default value if setting not found
 * @returns {Promise<any>} Setting value
 */
async function getSetting(key, defaultValue = null) {
    if (!key) return defaultValue;
    
    try {
        const database = await initDB();
        
        return new Promise((resolve, reject) => {
            const transaction = database.transaction(['settings'], 'readonly');
            const store = transaction.objectStore('settings');
            
            const request = store.get(key);
            
            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? result.value : defaultValue);
            };
            
            request.onerror = (event) => {
                console.error(`Error getting setting "${key}":`, event.target.error);
                resolve(defaultValue); // Return default on error
            };
        });
    } catch (error) {
        console.error('Failed to get setting:', error);
        return defaultValue;
    }
}

/**
 * Get all settings from the database
 * 
 * @returns {Promise<Object>} All settings
 */
async function getAllSettings() {
    try {
        const database = await initDB();
        
        return new Promise((resolve, reject) => {
            const transaction = database.transaction(['settings'], 'readonly');
            const store = transaction.objectStore('settings');
            
            const request = store.getAll();
            
            request.onsuccess = () => {
                const settings = {};
                request.result.forEach(item => {
                    settings[item.key] = item.value;
                });
                resolve(settings);
            };
            
            request.onerror = (event) => {
                console.error('Error getting all settings:', event.target.error);
                reject(event.target.error);
            };
        });
    } catch (error) {
        console.error('Failed to get all settings:', error);
        return {};
    }
}

/**
 * Delete a setting from the database
 * 
 * @param {string} key - Setting key
 * @returns {Promise<boolean>} Success status
 */
async function deleteSetting(key) {
    if (!key) return false;
    
    try {
        const database = await initDB();
        
        return new Promise((resolve, reject) => {
            const transaction = database.transaction(['settings'], 'readwrite');
            const store = transaction.objectStore('settings');
            
            const request = store.delete(key);
            
            request.onsuccess = () => {
                resolve(true);
            };
            
            request.onerror = (event) => {
                console.error(`Error deleting setting "${key}":`, event.target.error);
                reject(event.target.error);
            };
        });
    } catch (error) {
        console.error('Failed to delete setting:', error);
        return false;
    }
}

// Initialize the database
initDB().catch(error => {
    console.error('Failed to initialize database:', error);
});

// Export functions
window.storeEvents = storeEvents;
window.getEvents = getEvents;
window.countEvents = countEvents;
window.clearEvents = clearEvents;
window.storePlayer = storePlayer;
window.getPlayer = getPlayer;
window.saveSetting = saveSetting;
window.getSetting = getSetting;
window.getAllSettings = getAllSettings;
window.deleteSetting = deleteSetting;