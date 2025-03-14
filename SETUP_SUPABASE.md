# Setting Up Supabase for BattleTab

This guide explains how to implement database functionality using Supabase for the Double Overcharge Event Tracker.

## Why Supabase?

Supabase is a great choice for this application because:

1. It provides a PostgreSQL database with a REST API
2. It offers authentication if you want to add user accounts later
3. It includes object storage for saving receipt images
4. It has a generous free tier for smaller projects

## Step-by-Step Setup

### 1. Create a Supabase Account and Project

1. Go to [Supabase.com](https://supabase.com) and sign up for an account
2. Create a new project and note your:
   - Project URL
   - anon/public key
   - service_role key (keep this secret)

### 2. Set Up the Database Tables

Execute this SQL script in your Supabase SQL Editor:

```sql
-- Create table for tracking deaths of alliance members
CREATE TABLE deaths (
  id SERIAL PRIMARY KEY,
  event_id TEXT UNIQUE NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  victim_id TEXT NOT NULL,
  victim_name TEXT NOT NULL,
  victim_guild TEXT,
  victim_alliance_id TEXT NOT NULL,
  killer_id TEXT NOT NULL,
  killer_name TEXT NOT NULL,
  killer_guild TEXT,
  killer_alliance_id TEXT,
  fame INTEGER NOT NULL,
  event_data JSONB NOT NULL,  -- Store the full API response
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create table for tracking kills by alliance members
CREATE TABLE killmails (
  id SERIAL PRIMARY KEY,
  event_id TEXT UNIQUE NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  victim_id TEXT NOT NULL,
  victim_name TEXT NOT NULL,
  victim_guild TEXT,
  victim_alliance_id TEXT,
  killer_id TEXT NOT NULL,
  killer_name TEXT NOT NULL,
  killer_guild TEXT,
  killer_alliance_id TEXT NOT NULL,
  fame INTEGER NOT NULL,
  event_data JSONB NOT NULL,  -- Store the full API response
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create table for receipt images
CREATE TABLE receipts (
  id SERIAL PRIMARY KEY,
  event_id TEXT UNIQUE NOT NULL,
  image_url TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'death' or 'killmail'
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries on deaths
CREATE INDEX idx_deaths_victim_alliance ON deaths(victim_alliance_id);
CREATE INDEX idx_deaths_timestamp ON deaths(timestamp DESC);

-- Create indexes for common queries on killmails
CREATE INDEX idx_killmails_killer_alliance ON killmails(killer_alliance_id);
CREATE INDEX idx_killmails_timestamp ON killmails(timestamp DESC);

-- Create index for receipt lookups
CREATE INDEX idx_receipts_event_id ON receipts(event_id);
```

### 3. Set Up Storage Bucket

Storage buckets are created through the Supabase dashboard UI, not SQL:

1. In your Supabase dashboard, navigate to "Storage"
2. Click "Create new bucket"
3. Enter "receipts" as the bucket name
4. Check "Public bucket" if you want images to be publicly accessible

### 4. Set Storage Policies

After creating the bucket, set up access policies:

1. Click on the "receipts" bucket
2. Go to the "Policies" tab
3. Click "Add Policy"
4. For anonymous reads:
   - Policy name: "Public Access" 
   - Policy definition: `SELECT`
   - Using expression: `true`

5. For image uploads (create another policy):
   - Policy name: "Upload Access"
   - Policy definition: `INSERT`
   - Using expression: `true` (for development) or `auth.role() = 'authenticated'` (for production)

### 5. Update the Database.js File

Replace the placeholder code in `database.js` with actual Supabase implementation:

```javascript
// Replace the placeholder values with your own
const SUPABASE_URL = 'https://your-project-url.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

// Initialize the Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function saveDeath(deaths) {
  if (!Array.isArray(deaths)) {
    deaths = [deaths];
  }
  
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
  
  // Insert or update the deaths in the database
  const { data, error } = await supabase
    .from('deaths')
    .upsert(formattedDeaths, { onConflict: 'event_id' });
  
  if (error) {
    console.error('Error saving deaths:', error);
  }
  
  return { data, error };
}

async function getDeaths({ limit = 50, allianceId = null }) {
  let query = supabase
    .from('deaths')
    .select('*')
    .order('timestamp', { ascending: false });
  
  if (allianceId) {
    query = query.eq('victim_alliance_id', allianceId);
  }
  
  const { data, error } = await query.limit(limit);
  
  if (error) {
    console.error('Error fetching deaths:', error);
    return { data: [], error };
  }
  
  // Transform the data back to match the API format
  const transformedData = data.map(item => item.event_data);
  
  return { data: transformedData };
}

async function saveReceiptImage(imageData, deathId) {
  // Convert base64 to file
  const blob = await fetch(imageData).then(res => res.blob());
  const file = new File([blob], `receipt_${deathId}.png`, { type: 'image/png' });
  
  // Upload to Supabase storage
  const { data, error } = await supabase.storage
    .from('receipts')
    .upload(`receipts/${deathId}.png`, file, {
      upsert: true
    });
  
  if (error) {
    console.error('Error uploading receipt:', error);
    return null;
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
  
  return urlData.publicUrl;
}

// Export functions
window.db = {
  saveDeath,
  getDeaths,
  saveReceiptImage
};
```

### 6. Uncomment the Supabase Script in index.html

In your `index.html` file, uncomment the Supabase script tag:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.38.4/dist/umd/supabase.min.js"></script>
```

### 7. Update the main.js File to Use the Database

Modify your `loadAllianceDeaths` function in `main.js` to use the database:

```javascript
async function loadAllianceDeaths() {
  // Show loading state
  deathsList.innerHTML = `
    <div class="loading">
      <div class="loading-spinner"></div>
    </div>
  `;
  
  try {
    // First try to get cached deaths from the database
    const { data: cachedDeaths, error: dbError } = await window.db.getDeaths({
      limit: 50,
      allianceId: DOUBLE_OVERCHARGE_ID
    });
    
    if (cachedDeaths && cachedDeaths.length > 0) {
      displayDeaths(cachedDeaths);
    }
    
    // Always try to fetch fresh data from the API
    const apiDeaths = await window.fetchAllianceDeaths();
    
    if (apiDeaths && apiDeaths.length > 0) {
      // Cache the results in the database
      await window.db.saveDeath(apiDeaths);
      displayDeaths(apiDeaths);
    }
  } catch (error) {
    console.error('Error loading deaths:', error);
    deathsList.innerHTML = `
      <div class="empty-state">
        <p>Error loading deaths. Please try again.</p>
        <p>${error.message}</p>
      </div>
    `;
  }
}
```

## Further Improvements

Once you've set up Supabase, you can:

1. Add user authentication for admin features
2. Implement analytics to track popular features
3. Add a favorites system for users to save interesting deaths
4. Create leaderboards for most deaths, highest value kills, etc.
5. Create a comments system for deaths

## Need Help?

If you need assistance with Supabase integration:

- Check out the [Supabase Documentation](https://supabase.io/docs)
- Join the [Supabase Discord](https://discord.supabase.com)
- Post issues on the project repository
