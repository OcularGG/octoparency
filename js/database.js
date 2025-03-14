/**
 * Database integration with Supabase
 * This file provides functions to interact with a Supabase backend
 */

// Supabase configuration
// Note: Connection URI is parsed to extract URL and key components
const SUPABASE_CONNECTION_URI = 'postgresql://postgres:[Albion321#1]@db.jjghqgxcccqvsxywvddt.supabase.co:5432/postgres';
const SUPABASE_URL = 'https://jjghqgxcccqvsxywvddt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqZ2hxZ3hjY2NxdnN4eXd2ZGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTMzMzg4NzIsImV4cCI6MjAyODkxNDg3Mn0.JvOHFdWlc1fHdNjTQnuSNr0TiAQ4jIoZiLGK5l6rMp0';

// For development, we'll also use localStorage as a fallback cache
// when offline or if Supabase connection fails
const LOCAL_STORAGE_KEY = 'battleTab_deaths_cache';

/**
 * Initialize Supabase client
 * @returns {Object} Supabase client
 */
function initSupabase() {
  // Check if Supabase client is available
  if (typeof createClient === 'undefined') {
    console.warn('Supabase client not loaded, using localStorage fallback');
    return createFallbackClient();
  }
  
  try {
    // Initialize the actual Supabase client
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase client initialized successfully');
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
    
    // For each new death, check if it already exists by EventId
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
 * Save deaths to database
 * @param {Array} deaths - Death events to save
 * @returns {Promise} - Result of database operation
 */
async function saveDeath(deaths) {
  if (!Array.isArray(deaths)) {
    deaths = [deaths];
  }
  
  // Save to local cache regardless of whether Supabase is available
  await saveToLocalCache(deaths);
  
  // Transform the data to match our schema
  const formattedDeaths = deaths.map(death => ({
    event_id: death.EventId,
    timestamp: death.TimeStamp,
    victim_id: death.Victim.Id,
    victim_name: death.Victim.Name,
    victim_guild: death.Victim.GuildName,
    victim_alliance_id: death.Victim.AllianceId,
    killer_id: death.Killer.Id,
    killer_name: death.Killer.Name,
    killer_guild: death.Killer.GuildName,
    killer_alliance_id: death.Killer.AllianceId,
    kill_fame: death.TotalVictimKillFame,
    event_data: death
  }));
  
  try {
    // Insert or update the deaths in the database
    const { data, error } = await supabase
      .from('deaths')
      .upsert(formattedDeaths, { onConflict: 'event_id' });
    
    if (error) {
      console.error('Error saving deaths to Supabase:', error);
      return { data: deaths, error, source: 'localStorage' };
    }
    
    console.log('Deaths saved to Supabase successfully');
    return { data, source: 'supabase' };
  } catch (error) {
    console.error('Exception saving to Supabase:', error);
    return { data: deaths, error, source: 'localStorage' };
  }
}

/**
 * Get deaths from database or local cache
 * @param {Object} options - Query options
 * @param {number} options.limit - Max items to retrieve
 * @param {string} options.allianceId - Filter by alliance ID
 * @returns {Promise<Array>} - Death events
 */
async function getDeaths({ limit = 50, allianceId = null }) {
  try {
    // Try to get data from Supabase
    let query = supabase
      .from('deaths')
      .select('event_data')
      .order('timestamp', { ascending: false });
    
    if (allianceId) {
      query = query.eq('victim_alliance_id', allianceId);
    }
    
    const { data, error } = await query.limit(limit);
    
    if (error) {
      console.warn('Supabase query error, falling back to local cache:', error);
      return getFromLocalCache(limit);
    }
    
    if (data && data.length > 0) {
      console.log(`Retrieved ${data.length} deaths from Supabase`);
      // Extract event_data from each row
      const eventData = data.map(row => row.event_data);
      
      // Also update local cache with the latest data
      await saveToLocalCache(eventData);
      
      return { data: eventData, source: 'supabase' };
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
 * @param {string} deathId - ID of the death event
 * @returns {Promise<string>} - URL of the saved image
 */
async function saveReceiptImage(imageData, deathId) {
  try {
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
    const file = new File([blob], `receipt_${deathId}.png`, { type: 'image/png' });
    
    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('receipts')
      .upload(`receipts/${deathId}.png`, file, {
        upsert: true
      });
    
    if (error) {
      console.error('Error uploading receipt to Supabase:', error);
      return imageData; // Fall back to returning the original image data
    }
    
    // Get public URL
    const { data: urlData } = await supabase.storage
      .from('receipts')
      .getPublicUrl(`receipts/${deathId}.png`);
    
    // Store the receipt reference
    await supabase
      .from('receipts')
      .upsert({
        death_event_id: deathId,
        image_url: urlData.publicUrl
      }, { onConflict: 'death_event_id' });
    
    console.log('Receipt saved to Supabase:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Exception saving receipt image:', error);
    return imageData; // Fall back to returning the original image data
  }
}

// Initialize Supabase client
const supabase = initSupabase();

// Test connection on initialization
(async function testConnection() {
  try {
    const { data, error } = await supabase.from('deaths').select('count()', { count: 'exact', head: true });
    if (error) {
      console.error('Failed to connect to Supabase:', error);
    } else {
      console.log('Successfully connected to Supabase database');
    }
  } catch (error) {
    console.error('Exception testing Supabase connection:', error);
  }
})();

// Export functions
window.db = {
  saveDeath,
  getDeaths,
  saveReceiptImage
};
