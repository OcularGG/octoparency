# Discord Role DM Bot

A Discord bot that sends DMs to all members with specific roles, distributed over time to avoid spam detection.

## Features

- Prefix commands (using `!`) for easy interaction
- API endpoints for programmatic control
- DMs distributed over 6 hours to avoid rate limits
- Test mode to verify functionality

## Security Notice

**IMPORTANT**: This application uses sensitive credentials that should never be shared:

1. **Discord Bot Token**: Never commit or share your bot token
2. **API Secret Key**: Keep this secure to prevent unauthorized access

If you accidentally expose your Discord bot token:
1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. Navigate to the "Bot" tab
4. Click "Reset Token" to invalidate the old token and generate a new one
5. Update your `.env.local` file with the new token

## Setup Instructions

1. Copy `.env.local.example` to `.env.local`
2. Fill in your Discord bot token, server ID, and create a secure API key
3. Run `npm install` to install dependencies
4. Deploy to Vercel using `npm run deploy`

## Discord Developer Portal Settings

1. **Bot Permissions**:
   - In the Developer Portal, go to your application
   - Navigate to "Bot" tab
   - Under "Privileged Gateway Intents", enable:
     - SERVER MEMBERS INTENT (required to see members in the server)
     - MESSAGE CONTENT INTENT (required to read command messages)
     - GUILD MESSAGES INTENT (required to see messages in channels)

2. **OAuth2 URL Generator**:
   - Navigate to "OAuth2" → "URL Generator"
   - Select the following scopes:
     - `bot`
   - Select the following bot permissions:
     - "Send Messages"
     - "Read Messages/View Channels"
   - Use the generated URL to invite the bot to your server

## Using Prefix Commands

After adding the bot to your server, you can use these commands:

- `!guildcheck` - Send DMs to all members with roles 1336395193980817458 and 1336395194995834971
- `!guildchecktest` - Send a test DM only to user 1207434980855259206

These commands can only be used by server administrators or users with the "Manage Server" permission.

## Using API Endpoints

See the `usage-example.md` file for full API documentation.
