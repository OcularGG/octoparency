const { initializeDiscordClient } = require('../utils/discord');

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check for API key
  const apiKey = req.headers.authorization;
  if (apiKey !== `Bearer ${process.env.API_SECRET_KEY}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Initialize Discord client
    await initializeDiscordClient();
    
    return res.status(200).json({ 
      success: true,
      message: "Slash commands registered successfully" 
    });
  } catch (error) {
    console.error('Error in register-commands endpoint:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
};
