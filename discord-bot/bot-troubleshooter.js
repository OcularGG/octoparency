// A comprehensive diagnostic tool for identifying Discord bot issues
require('dotenv').config({ path: '.env.local' });
const { Client, GatewayIntentBits } = require('discord.js');

async function runDiagnostics() {
  console.log('🔍 Running Discord Bot Diagnostics');
  console.log('================================');
  
  // Check environment
  console.log('\n📋 Environment Check:');
  console.log(`Node.js Version: ${process.version}`);
  console.log(`Platform: ${process.platform}`);
  
  // Check required environment variables
  console.log('\n🔑 Environment Variables Check:');
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const serverId = process.env.DISCORD_SERVER_ID;
  
  console.log(`Bot Token: ${botToken ? '✅ Present' : '❌ Missing'}`);
  if (botToken) {
    console.log(`  Token length: ${botToken.length} characters`);
    console.log(`  First few characters: ${botToken.substring(0, 5)}...`);
    console.log(`  Last few characters: ...${botToken.substring(botToken.length - 5)}`);
  }
  
  console.log(`Server ID: ${serverId ? '✅ Present' : '❌ Missing'}`);
  if (serverId) {
    if (/^\d+$/.test(serverId)) {
      console.log(`  Server ID appears valid (numeric: ${serverId})`);
    } else {
      console.log(`  ⚠️ Server ID appears invalid (not numeric: ${serverId})`);
    }
  }
  
  // Attempt to connect to Discord
  console.log('\n🔌 Discord Connection Test:');
  
  try {
    console.log('Attempting to connect to Discord...');
    
    const client = new Client({ 
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
      ] 
    });
    
    await new Promise((resolve, reject) => {
      // Set timeout
      const timeout = setTimeout(() => {
        reject(new Error('Connection timed out after 15 seconds'));
      }, 15000);
      
      client.once('ready', () => {
        clearTimeout(timeout);
        resolve();
      });
      
      client.login(botToken).catch(err => {
        clearTimeout(timeout);
        reject(err);
      });
    });
    
    console.log(`✅ Successfully connected as ${client.user.tag}`);
    
    // Check server
    if (serverId) {
      console.log('\n🏢 Server Check:');
      const guild = client.guilds.cache.get(serverId);
      
      if (guild) {
        console.log(`✅ Bot is in the server: ${guild.name}`);
        console.log(`   Server has ${guild.memberCount} members`);
        
        // Check roles
        console.log('\n👑 Role Check:');
        console.log('Looking for the specified roles:');
        
        const roleIds = ['1336395193980817458', '1336395194995834971'];
        roleIds.forEach(roleId => {
          const role = guild.roles.cache.get(roleId);
          if (role) {
            console.log(`   ✅ Found role: ${role.name} (${roleId}) with ${role.members.size} members`);
          } else {
            console.log(`   ❌ Could not find role with ID: ${roleId}`);
          }
        });
        
        // Check test user
        console.log('\n👤 Test User Check:');
        const testUserId = '1207434980855259206';
        try {
          const member = await guild.members.fetch(testUserId);
          if (member) {
            console.log(`   ✅ Found test user: ${member.user.tag}`);
          }
        } catch (err) {
          console.log(`   ❌ Could not find test user with ID: ${testUserId}`);
          console.log(`   Error: ${err.message}`);
        }
        
      } else {
        console.log(`❌ Bot is NOT in the server with ID: ${serverId}`);
        console.log('   Servers the bot is in:');
        client.guilds.cache.forEach(g => {
          console.log(`   - ${g.name} (${g.id})`);
        });
      }
    }
    
    // Cleanup
    client.destroy();
    
  } catch (err) {
    console.log(`❌ Failed to connect: ${err.message}`);
    if (err.code === 'TokenInvalid') {
      console.log('   The token appears to be invalid. Check it in the Discord Developer Portal.');
    } else if (err.code === 'DisallowedIntents') {
      console.log('   The bot is missing required privileged intents. Enable them in the Discord Developer Portal.');
    }
  }
  
  console.log('\n✨ Diagnostics Completed ✨');
}

runDiagnostics().catch(err => {
  console.error('Error running diagnostics:', err);
});
