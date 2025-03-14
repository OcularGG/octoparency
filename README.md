# BattleTab

BattleTab is a web application for viewing and analyzing Albion Online PvP battle statistics. It allows players to search for characters and view their kill/death records in a clean, easy-to-read format.

## Features

- Player search by name
- View kill and death statistics
- Detailed battle receipts with equipment and participant information
- Clean, responsive UI design

## Deployment Instructions

### Local Development

1. Clone the repository:
   ```
   git clone https://github.com/OcularGG/battletab.git
   cd battletab
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start local development server:
   ```
   npm run dev
   ```

4. Visit `http://localhost:3000` in your browser

### Deploying to Vercel

1. Push your code to GitHub

2. Connect your GitHub repository to Vercel:
   - Create a new project in Vercel
   - Import from your GitHub repository
   - Configure with these settings:
     - Framework Preset: Other
     - Build Command: Leave empty
     - Output Directory: `.` (root directory)
     - Install Command: `npm install`

3. Important deployment settings:
   - Ensure all files are properly committed
   - If you see a blank page, check browser console for errors
   - CORS issues may require using a proxy (configured in api.js)

## Troubleshooting

If you encounter a blank page after deployment:

1. Check browser console for errors
2. Verify that all files are being served correctly
3. Make sure CORS is handled properly for API requests
4. Try clearing browser cache or using incognito mode

## API Information

This application uses the Albion Online Game Info API:
- Base API URL: https://gameinfo.albiononline.com/api/gameinfo
- No API key is required, but CORS may be an issue for client-side requests

## License

MIT
