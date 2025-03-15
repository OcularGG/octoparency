const { Client, GatewayIntentBits } = require('discord.js');

// Create a new client instance with necessary intents
const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages
  ] 
});

// Initialize the Discord client
async function initializeDiscordClient() {
  return new Promise((resolve, reject) => {
    // Login to Discord with token
    client.login(process.env.DISCORD_BOT_TOKEN)
      .catch(reject);

    client.once('ready', async () => {
      console.log(`Logged in as ${client.user.tag}`);
      
      // Setup message handler for prefix commands
      setupPrefixCommandHandler();
      
      resolve(client);
    });
  });
}

// Setup the message handler for prefix commands
function setupPrefixCommandHandler() {
  client.on('messageCreate', async message => {
    // Ignore messages from bots or messages that don't start with the prefix
    if (message.author.bot || !message.content.startsWith('!')) return;
    
    // Get the command and arguments
    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    
    try {
      if (command === 'guildcheck') {
        // Check if user has permission (e.g., admin or manage server)
        if (!message.member.permissions.has('ADMINISTRATOR') && 
            !message.member.permissions.has('MANAGE_GUILD')) {
          return await message.reply('You do not have permission to use this command.');
        }
        
        // Reply immediately to acknowledge the command
        await message.reply('Starting to send DMs to members with selected roles. This will take several hours to complete to avoid rate limits.');
        
        // The role IDs you specified
        const roleIds = ['1336395193980817458', '1336395194995834971'];
        
        for (const roleId of roleIds) {
          // Send DM to members with the role
          await sendDMToRoleMembers(roleId);
          
          // Wait a moment between processing different roles
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
        
        // Send follow-up message
        await message.channel.send('DM sending process has been initiated for all specified roles.');
      }
      else if (command === 'guildchecktest') {
        // Check if user has permission
        if (!message.member.permissions.has('ADMINISTRATOR') && 
            !message.member.permissions.has('MANAGE_GUILD')) {
          return await message.reply('You do not have permission to use this command.');
        }
        
        await message.reply('Sending test DM to the specified user...');
        
        const testUserId = '1207434980855259206';
        
        // Send test DM
        const result = await sendDMToTestUser(testUserId);
        
        if (result.success) {
          await message.channel.send(`Test DM sent successfully to <@${testUserId}>!`);
        } else {
          await message.channel.send(`Failed to send test DM: ${result.error}`);
        }
      }
    } catch (error) {
      console.error('Error handling prefix command:', error);
      try {
        await message.channel.send('There was an error while executing this command!');
      } catch (followUpError) {
        console.error('Error sending error response:', followUpError);
      }
    }
  });
}

/**
 * Generate a random delay between min and max seconds
 * @param {number} minSeconds - Minimum delay in seconds
 * @param {number} maxSeconds - Maximum delay in seconds
 * @returns {number} - Delay in milliseconds
 */
function getRandomDelay(minSeconds, maxSeconds) {
  return Math.floor(Math.random() * (maxSeconds - minSeconds + 1) + minSeconds) * 1000;
}

/**
 * Send a DM to a specific test user
 * 
 * @param {string} userId - The ID of the user to message
 * @returns {Object} The result of the operation
 */
async function sendDMToTestUser(userId) {
  try {
    const guild = client.guilds.cache.get(process.env.DISCORD_SERVER_ID);
    
    if (!guild) {
      return {
        success: false,
        error: "Guild not found"
      };
    }

    try {
      // Fetch the member
      const member = await guild.members.fetch(userId);
      
      if (!member) {
        return {
          success: false,
          error: "Member not found in guild"
        };
      }
      
      // Get the user's display name (nickname in the server or username if no nickname)
      const displayName = member.displayName;
      
      // Personalize the message with the user's display name
      const personalizedMessage = `Hey ${displayName}, Litefootz here! Just checking in to remind you that OCULAR has daily activities running, and we'd love to see you out there with us! Whether you're looking for fights, fame, or just some good times with the guild, there's always something happening. Don't hesitate to jump in—your guildmates are waiting! See you soon! 🐙`;
      
      // Send the DM
      await member.send(personalizedMessage);
      
      return {
        success: true,
        message: "DM sent successfully to test user"
      };
    } catch (error) {
      console.error(`Failed to send DM to test user ${userId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  } catch (error) {
    console.error('Error sending test DM:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send a DM to all members with a specific role spread over a 6 hour period
 * 
 * @param {string} roleId - The ID of the role to target
 * @returns {Object} The result of the operation
 */
async function sendDMToRoleMembers(roleId) {
  try {
    const guild = client.guilds.cache.get(process.env.DISCORD_SERVER_ID);
    
    if (!guild) {
      return {
        success: false,
        error: "Guild not found",
        sentCount: 0,
        failedCount: 0,
        failedUsers: []
      };
    }

    // Force fetch all members to ensure we have the latest data
    await guild.members.fetch();
    
    const role = guild.roles.cache.get(roleId);
    if (!role) {
      return {
        success: false,
        error: "Role not found",
        sentCount: 0,
        failedCount: 0,
        failedUsers: []
      };
    }

    // Get members with the role (excluding bots)
    const members = Array.from(role.members.values()).filter(member => !member.user.bot);
    
    if (members.length === 0) {
      return {
        success: true,
        message: "No valid members with this role to message",
        sentCount: 0,
        failedCount: 0,
        failedUsers: []
      };
    }

    console.log(`Scheduling DMs to ${members.length} members with role ${role.name} over 6 hours`);
    
    // Calculate the total duration in milliseconds (6 hours)
    const totalDuration = 6 * 60 * 60 * 1000;
    
    // Calculate the average interval between messages
    // We'll use this as a baseline for randomization
    const avgInterval = totalDuration / members.length;
    
    // Set minimum and maximum interval (25% below and 25% above the average)
    const minInterval = Math.max(30000, avgInterval * 0.75); // At least 30 seconds
    const maxInterval = avgInterval * 1.25;

    console.log(`Average interval: ${avgInterval / 1000} seconds`);
    console.log(`Min interval: ${minInterval / 1000} seconds`);
    console.log(`Max interval: ${maxInterval / 1000} seconds`);
    
    // Store message schedule in global object (will persist across function calls)
    global.messageSchedule = {
      jobId: Date.now().toString(),
      roleId,
      totalMembers: members.length,
      sentCount: 0,
      failedCount: 0,
      startTime: Date.now(),
      estimatedEndTime: Date.now() + totalDuration,
      failedUsers: [],
      inProgress: true
    };
    
    // Function to send messages with random delays
    const sendMessagesWithDelay = async () => {
      for (let i = 0; i < members.length; i++) {
        const member = members[i];
        
        // Random delay between messages
        const delay = getRandomDelay(
          minInterval / 1000, 
          maxInterval / 1000
        );
        
        // Schedule the next message with the random delay
        await new Promise(resolve => setTimeout(resolve, delay));
        
        try {
          // Get the user's display name (nickname in the server or username if no nickname)
          const displayName = member.displayName;
          
          // Personalize the message with the user's display name
          const personalizedMessage = `Hey ${displayName}, Litefootz here! Just checking in to remind you that OCULAR has daily activities running, and we'd love to see you out there with us! Whether you're looking for fights, fame, or just some good times with the guild, there's always something happening. Don't hesitate to jump in—your guildmates are waiting! See you soon! 🐙`;
          
          // Send the DM
          await member.send(personalizedMessage);
          global.messageSchedule.sentCount++;
          
          // Log progress
          const progress = Math.round((i + 1) / members.length * 100);
          console.log(`[${progress}%] DM sent to ${member.user.tag} (${i + 1}/${members.length}). Next message in ${Math.round(delay / 1000)} seconds`);
        } catch (error) {
          console.error(`Failed to send DM to ${member.user.tag}:`, error);
          global.messageSchedule.failedCount++;
          global.messageSchedule.failedUsers.push({
            id: member.id,
            tag: member.user.tag,
            error: error.message
          });
        }
      }
      
      // Mark as complete
      global.messageSchedule.inProgress = false;
      console.log(`DM sending completed. Sent: ${global.messageSchedule.sentCount}, Failed: ${global.messageSchedule.failedCount}`);
    };
    
    // Start sending messages in the background
    sendMessagesWithDelay();
    
    // Return initial status
    return {
      success: true,
      message: "DM sending process started",
      jobId: global.messageSchedule.jobId,
      totalMembers: members.length,
      estimatedTimeHours: 6,
      startTime: new Date(global.messageSchedule.startTime).toISOString(),
      estimatedEndTime: new Date(global.messageSchedule.estimatedEndTime).toISOString()
    };
  } catch (error) {
    console.error('Error scheduling DMs:', error);
    return {
      success: false,
      error: error.message,
      sentCount: 0,
      failedCount: 0,
      failedUsers: []
    };
  }
}

/**
 * Get the status of the current DM sending job
 * @returns {Object} Current status
 */
function getDMJobStatus() {
  if (!global.messageSchedule) {
    return {
      success: false,
      error: "No DM job currently running or completed"
    };
  }
  
  const elapsedTime = Date.now() - global.messageSchedule.startTime;
  const estimatedTotalTime = global.messageSchedule.estimatedEndTime - global.messageSchedule.startTime;
  const progress = Math.min(100, Math.round((elapsedTime / estimatedTotalTime) * 100));
  
  return {
    success: true,
    jobId: global.messageSchedule.jobId,
    inProgress: global.messageSchedule.inProgress,
    progress: `${progress}%`,
    roleId: global.messageSchedule.roleId,
    totalMembers: global.messageSchedule.totalMembers,
    sentCount: global.messageSchedule.sentCount,
    failedCount: global.messageSchedule.failedCount,
    failedUsers: global.messageSchedule.failedUsers,
    startTime: new Date(global.messageSchedule.startTime).toISOString(),
    estimatedEndTime: new Date(global.messageSchedule.estimatedEndTime).toISOString(),
    elapsedTimeMinutes: Math.round(elapsedTime / (60 * 1000))
  };
}

module.exports = {
  client,
  initializeDiscordClient,
  sendDMToRoleMembers,
  getDMJobStatus,
  sendDMToTestUser
};
