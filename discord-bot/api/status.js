const { client } = require('../utils/discord');

module.exports = async (req, res) => {
  // Set CORS headers to allow requests from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  try {
    const status = {
      success: true,
      timestamp: new Date().toISOString(),
      bot: {
        online: client.isReady(),
        username: client.isReady() ? client.user.tag : 'Not connected',
        uptime: client.isReady() ? Math.floor(client.uptime / 1000) + ' seconds' : 'N/A'
      },
      servers: client.isReady() ? client.guilds.cache.size : 0
    };
    
    return res.status(200).json(status);
  } catch (error) {
    console.error('Error in status endpoint:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error', 
      message: error.message 
    });
  }
};
