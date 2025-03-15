# Supabase Setup Guide for Octoparency

## 1. Create Supabase Project

1. Go to [https://supabase.com/](https://supabase.com/) and sign up or log in
2. Click "New Project"
3. Enter a name for your project (e.g., "Octoparency")
4. Set a secure database password (save it somewhere safe)
5. Choose a region closest to your users
6. Click "Create New Project"

## 2. Run Database Schema SQL

1. In your Supabase project dashboard, navigate to the SQL Editor (left sidebar)
2. Create a "New Query"
3. Copy the entire SQL code from your `supabase-schema.sql` file and paste it into the editor
4. Click "Run" to execute the SQL code and create your tables with proper permissions

## 3. Get API Credentials

1. In your Supabase project dashboard, go to Project Settings (gear icon in sidebar)
2. Go to "API" tab
3. Copy the "URL" value - this is your `SUPABASE_URL`
4. Copy the "anon" key - this is your `SUPABASE_ANON_KEY`
5. Update these values in your `app.js` file:

```javascript
const SUPABASE_URL = 'your-supabase-url-here';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

## 4. (Optional) Add Initial Data

You can add some initial data to test your dashboard:

1. In your Supabase dashboard, go to "Table Editor" in the sidebar
2. Select the "financial_data" table
3. Click "Insert Row" and enter values for the fields
4. Click "Save"

Alternatively, you can run this SQL in the SQL Editor (modify the values as needed):

```sql
INSERT INTO financial_data (
  total_assets, total_liquid_assets, total_illiquid_assets, 
  net_liquid, liquid_change, outstanding_payments,
  ocular_silver, university_silver, vanguard_silver,
  total_liquid_items, 
  sellable_siv_ho, sellable_delta_hq, sellable_coast_hq,
  sellable_martlock, sellable_thetford, sellable_lymhurst,
  sellable_bridgewatch, sellable_fort_sterling, sellable_brecilien, sellable_caerleon,
  illiquid_siv_ho, illiquid_delta_hq, illiquid_coast_hq,
  illiquid_martlock, illiquid_thetford, illiquid_lymhurst,
  illiquid_bridgewatch, illiquid_fort_sterling, illiquid_brecilien, illiquid_caerleon,
  total_members, total_active_members,
  ocular_members, university_members, vanguard_members,
  ocular_active_members, university_active_members, vanguard_active_members
) VALUES (
  10000000, 5000000, 5000000,
  4800000, 200000, 200000,
  3000000, 1000000, 1000000,
  1000000,
  200000, 150000, 150000,
  50000, 50000, 50000,
  50000, 50000, 50000, 200000,
  1000000, 800000, 800000,
  300000, 300000, 300000,
  300000, 300000, 300000, 600000,
  500, 350,
  300, 150, 50,
  200, 100, 50
);
```

## 5. Security Considerations

The current setup allows anyone to read the financial data but requires authentication to submit new data. This is appropriate for a transparency dashboard.

If you need to restrict read access later, you can modify the Row Level Security (RLS) policies.

## 6. Troubleshooting

If you encounter the error "Failed to fetch data" in your dashboard:

1. Make sure the Supabase URL and anon key are correct in app.js
2. Check the browser console for more detailed error messages
3. Verify that the table was created correctly in Supabase
4. Ensure there is at least one row of data in the financial_data table
