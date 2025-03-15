# Octoparency - Accounting Transparency Dashboard

A simple financial transparency dashboard for tracking organizational assets, inventory, and membership.

## Setup Instructions

### Prerequisites
- Supabase account
- Vercel account
- Web browser

### Supabase Setup
1. Create a new Supabase project
2. Get your Supabase URL and anon key from the API settings
3. Run the SQL from `supabase-schema.sql` in the Supabase SQL editor to create necessary tables
4. Set up authentication if you plan to add admin features later

### Configuration
1. Open `app.js` and replace the placeholder values:
   ```javascript
   const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Replace with actual URL
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Replace with actual key
   ```

### Local Development
1. Clone this repository
2. Open index.html in your browser to test the application locally

### Deployment to Vercel
1. Create a new project in Vercel
2. Link to your GitHub repository (if using GitHub)
3. Set the build settings:
   - Build Command: (leave blank for static site)
   - Output Directory: ./
   - Install Command: (leave blank)
4. Deploy

## Adding Data

For now, you'll need to insert data directly into Supabase using the dashboard or API:

```sql
INSERT INTO financial_data (
  total_assets, total_liquid_assets, total_illiquid_assets,
  -- Add all other fields here
) VALUES (
  1000000, 500000, 500000,
  -- Add all other values here
);
```

## Future Enhancements
- Admin dashboard for data entry
- Historical data tracking and visualization
- Authentication for data submission
- Automated calculations for summaries
