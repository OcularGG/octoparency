/**
 * Database integration with Supabase
 * This file provides functions to interact with a Supabase backend
 */

// Initialize with your Supabase project URL and anon key
// Replace these with your actual Supabase project details when you create one
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// For development, we'll use localStorage as a simple cache
// When you implement Supabase, you'll replace these functions
const LOCAL_STORAGE_KEY = 'battleTab_deaths_cache';

/**
 * Initialize Supabase client (placeholder)
 * @returns {Object} Supabase client
 */
function initSupabase() {
  // This is a placeholder - replace with actual Supabase client initialization
  // when you add the library to your project
  console.log('Supabase client would initialize here');
  
  // When using the actual Supabase client, you would do:
  // return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  return {
    // Placeholder methods that simulate what Supabase would do
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
 * Save deaths to local cache (placeholder for database)
 * @param {Array} deaths - Death events to cache
 */
async function saveToLocalCache(deaths) {
  try {
    const existingData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    
    // For each new death, check if it already exists by EventId
    deaths.forEach(death => {
      const existingIndex = existingData.findIndex(d => d.EventId === death.EventId);
      if (existingIndex >= 0) {
        // Update existing record
        existingData[existingIndex] = death;
      } else {
        // Add new record
        existingData.push(death);
      }
    });
    
    // Store back in localStorage
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existingData));
    console.log(`Cached ${deaths.length} deaths locally`);
    return { data: deaths };
  } catch (e) {
    console.error('Error caching deaths:', e);
    return { error: e };
  }
}

/**
 * Get deaths from local cache (placeholder for database)
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
  
  // In production, this would save to Supabase
  // const { data, error } = await supabase.from('deaths').upsert(deaths);
  
  // For now, just use our local storage implementation
  return saveToLocalCache(deaths);
}

/**
 * Get deaths from database
 * @param {Object} options - Query options
 * @param {number} options.limit - Max items to retrieve
 * @param {string} options.allianceId - Filter by alliance ID
 * @returns {Promise<Array>} - Death events
 */
async function getDeaths({ limit = 50, allianceId = null }) {
  // In production, this would query Supabase
  // const query = supabase.from('deaths').select('*').order('TimeStamp', { ascending: false });
  // 
  // if (allianceId) {
  //   query = query.eq('Victim.AllianceId', allianceId);
  // }
  // 
  // const { data, error } = await query.limit(limit);
  
  // For now, just use our local storage implementation
  const result = await getFromLocalCache(limit);
  
  // If local cache is empty, and we have allianceId, try to fetch from API
  if (!result.error && (!result.data || result.data.length === 0) && allianceId) {
    try {
      const apiDeaths = await window.fetchAllianceDeaths(limit);
      if (apiDeaths && apiDeaths.length > 0) {
        // Cache the results
        await saveToLocalCache(apiDeaths);
        return { data: apiDeaths };
      }
    } catch (e) {
      console.error('Error fetching deaths from API:', e);
    }
  }
  
  return result;
}

/**
 * Save a receipt image to storage
 * @param {string} imageData - Base64 encoded image data
 * @param {string} deathId - ID of the death event
 * @returns {Promise<string>} - URL of the saved image
 */
async function saveReceiptImage(imageData, deathId) {
  // In production with Supabase:
  // 1. Convert base64 to file
  // const blob = await fetch(imageData).then(res => res.blob());
  // const file = new File([blob], `receipt_${deathId}.png`, { type: 'image/png' });
  // 
  // 2. Upload to Supabase storage
  // const { data, error } = await supabase.storage
  //   .from('receipts')
  //   .upload(`receipts/${deathId}.png`, file);
  // 
  // 3. Get public URL
  // const { data: urlData } = supabase.storage
  //   .from('receipts')
  //   .getPublicUrl(`receipts/${deathId}.png`);
  // 
  // return urlData.publicUrl;
  
  // For now, just return the image data directly
  return imageData;
}

// Initialize Supabase client
const supabase = initSupabase();

// Export functions
window.db = {
  saveDeath,
  getDeaths,
  saveReceiptImage
};
