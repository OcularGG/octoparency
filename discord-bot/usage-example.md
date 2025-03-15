# Usage Examples

## Using Prefix Commands (Recommended)

After deploying your bot, you can use the following commands in your Discord server:

- `!guildcheck` - Send DMs to all members with the specified roles
- `!guildchecktest` - Send a test DM to a designated test user

These commands are only available to server administrators or users with "Manage Server" permission.

## Using API Endpoints (Alternative)

### For Role ID: 1336395193980817458

```bash
curl -X POST https://your-vercel-app.vercel.app/api/send-dm \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eVw6h2JgR7nPkXfC9LqM4sT5bZyA8uQt3DxE1pKoWSaB" \
  -d '{"roleId":"1336395193980817458"}'
```

### For Role ID: 1336395194995834971

```bash
curl -X POST https://your-vercel-app.vercel.app/api/send-dm \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eVw6h2JgR7nPkXfC9LqM4sT5bZyA8uQt3DxE1pKoWSaB" \
  -d '{"roleId":"1336395194995834971"}'
```

### Check Job Status

```bash
curl -X GET https://your-vercel-app.vercel.app/api/job-status \
  -H "Authorization: Bearer eVw6h2JgR7nPkXfC9LqM4sT5bZyA8uQt3DxE1pKoWSaB"
```

### Check Bot Status

To check if your bot is online and functioning:

```bash
curl https://your-vercel-app.vercel.app/api/status
```

Example response:

```json
{
  "success": true,
  "timestamp": "2023-06-07T18:30:38.123Z",
  "bot": {
    "online": true,
    "username": "YourBot#1234",
    "uptime": "3600 seconds"
  },
  "servers": 1
}
```

## Running the Bot Locally

```bash
npm install
npm start
```

This will start the bot directly on your machine, which is useful for testing the commands.

## Example Response for Sending DMs

```json
{
  "success": true,
  "message": "DM sending process started",
  "jobId": "1686125438123",
  "totalMembers": 25,
  "estimatedTimeHours": 6,
  "startTime": "2023-06-07T12:30:38.123Z",
  "estimatedEndTime": "2023-06-07T18:30:38.123Z"
}
```

## Example Job Status Response

```json
{
  "success": true,
  "jobId": "1686125438123",
  "inProgress": true,
  "progress": "35%",
  "roleId": "1336395193980817458",
  "totalMembers": 25,
  "sentCount": 8,
  "failedCount": 1,
  "failedUsers": [
    {
      "id": "98765432198765432",
      "tag": "DisabledDMs#1234",
      "error": "Cannot send messages to this user"
    }
  ],
  "startTime": "2023-06-07T12:30:38.123Z",
  "estimatedEndTime": "2023-06-07T18:30:38.123Z",
  "elapsedTimeMinutes": 126
}
