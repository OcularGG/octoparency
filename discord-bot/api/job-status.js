const { initializeDiscordClient, getDMJobStatus } = require('../utils/discord');

module.exports = async (req, res) => {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check for API key
  const apiKey = req.headers.authorization;
  if (apiKey !== `Bearer ${process.env.API_SECRET_KEY}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Make sure Discord client is initialized
    await initializeDiscordClient();
    
    // Get status of current/last DM job
    const status = getDMJobStatus();
    
    return res.status(200).json(status);
  } catch (error) {
    console.error('Error in job-status endpoint:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
};
