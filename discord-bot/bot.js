// Load environment variables from .env.local file
require('dotenv').config({ path: '.env.local' });

const { initializeDiscordClient } = require('./utils/discord');

// Start the bot
async function startBot() {
  try {
    console.log('Starting Discord bot...');
    await initializeDiscordClient();
    console.log('Bot is running! Press Ctrl+C to exit.');
  } catch (error) {
    console.error('Error starting bot:', error);
    process.exit(1);
  }
}

startBot();
