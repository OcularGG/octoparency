// Simple utility to check if the Discord token is valid
require('dotenv').config({ path: '.env.local' });
const { Client } = require('discord.js');

// Create minimal client for testing
const client = new Client({ intents: [] });

console.log('Testing Discord bot token...');

client.login(process.env.DISCORD_BOT_TOKEN)
  .then(() => {
    console.log('✅ TOKEN VALID: Your Discord token is valid!');
    console.log(`   Bot username: ${client.user.tag}`);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ TOKEN ERROR: Your Discord token is invalid or has an issue!');
    console.error('   Error details:', error.message);
    
    if (error.code === 0) {
      console.error('\n🔍 This usually means your token is incorrect or has been revoked.');
      console.error('   Please check your token in the .env.local file and make sure it matches');
      console.error('   the token shown in the Discord Developer Portal.');
    }
    
    process.exit(1);
  });
