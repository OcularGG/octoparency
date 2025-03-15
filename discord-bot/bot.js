// Load environment variables from .env.local file
require('dotenv').config({ path: '.env.local' });

const { initializeDiscordClient } = require('./utils/discord');

// Start the bot
async function startBot() {
  try {
    console.log('Starting Discord bot...');
    console.log('Using token:', process.env.DISCORD_BOT_TOKEN ? '***' + process.env.DISCORD_BOT_TOKEN.slice(-5) : 'undefined');
    console.log('Using server ID:', process.env.DISCORD_SERVER_ID || 'undefined');
    
    // Add error handling for the Discord client initialization
    await initializeDiscordClient()
      .catch(error => {
        console.error('Failed to initialize Discord client:', error);
        if (error.code === 'TokenInvalid') {
          console.error('The bot token is invalid. Please check your token in .env.local');
        } else if (error.code === 'DisallowedIntents') {
          console.error('The bot is missing required privileged intents. Please enable them in the Discord Developer Portal.');
        }
        throw error;
      });
      
    console.log('Bot is running! Press Ctrl+C to exit.');
    
    // Keep the process running
    process.on('SIGINT', () => {
      console.log('Bot shutting down...');
      process.exit(0);
    });
  } catch (error) {
    console.error('Error starting bot:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

startBot();
