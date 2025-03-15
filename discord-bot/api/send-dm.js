const { initializeDiscordClient, sendDMToRoleMembers, sendDMToTestUser } = require('../utils/discord');

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
    
    const { roleId, userId } = req.body;

    // Send to test user
    if (userId) {
      const result = await sendDMToTestUser(userId);
      return res.status(result.success ? 200 : 400).json(result);
    }
    
    // Send to role members
    if (roleId) {
      const result = await sendDMToRoleMembers(roleId);
      return res.status(result.success ? 200 : 400).json(result);
    }
    
    // Neither roleId nor userId was provided
    return res.status(400).json({ 
      error: 'Missing required fields', 
      requiredFields: ['roleId OR userId'] 
    });
  } catch (error) {
    console.error('Error in send-dm endpoint:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
};
