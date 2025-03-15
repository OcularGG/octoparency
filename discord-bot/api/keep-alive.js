const { initializeDiscordClient, client } = require('../utils/discord');

module.exports = async (req, res) => {
  try {
    // Initialize Discord client if it's not ready
    if (!client.isReady()) {
      console.log('Bot not ready, initializing Discord client...');
      await initializeDiscordClient();
    }
    
    // Create a diagnostic report
    const diagnostic = {
      success: true,
      timestamp: new Date().toISOString(),
      bot: {
        ready: client.isReady(),
        username: client.isReady() ? client.user.tag : 'Not connected',
        uptime: client.isReady() ? Math.floor(client.uptime / 1000) + ' seconds' : 'N/A'
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        tokenProvided: !!process.env.DISCORD_BOT_TOKEN,
        serverIdProvided: !!process.env.DISCORD_SERVER_ID,
        apiKeyProvided: !!process.env.API_SECRET_KEY
      }
    };

    // If we can access the guild, add that info too
    if (client.isReady() && process.env.DISCORD_SERVER_ID) {
      const guild = client.guilds.cache.get(process.env.DISCORD_SERVER_ID);
      diagnostic.server = guild ? {
        name: guild.name,
        memberCount: guild.memberCount,
        botInServer: true
      } : {
        botInServer: false,
        possibleIssue: "Bot is not in the specified server. Check the server ID or invite the bot to that server."
      };
    }
    
    return res.status(200).json(diagnostic);
  } catch (error) {
    console.error('Error in keep-alive endpoint:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error', 
      message: error.message,
      stack: error.stack
    });
  }
};
