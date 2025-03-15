# Usage Examples

## Using Slash Commands (Recommended)

After deploying your bot, you can use the following slash commands in your Discord server:

- `/guildcheck message:[your message here]` - Send DMs to all members with the specified roles
- `/guildchecktest message:[your message here]` - Send a test DM to a designated test user

## Using API Endpoints (Alternative)

### For Role ID: 1336395193980817458

```bash
curl -X POST https://your-vercel-app.vercel.app/api/send-dm \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eVw6h2JgR7nPkXfC9LqM4sT5bZyA8uQt3DxE1pKoWSaB" \
  -d '{"roleId":"1336395193980817458","message":"Hello! This is an important announcement from the server team."}'
```

### For Role ID: 1336395194995834971

```bash
curl -X POST https://your-vercel-app.vercel.app/api/send-dm \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eVw6h2JgR7nPkXfC9LqM4sT5bZyA8uQt3DxE1pKoWSaB" \
  -d '{"roleId":"1336395194995834971","message":"Hello! This is an important announcement from the server team."}'
```

### Check Job Status

```bash
curl -X GET https://your-vercel-app.vercel.app/api/job-status \
  -H "Authorization: Bearer eVw6h2JgR7nPkXfC9LqM4sT5bZyA8uQt3DxE1pKoWSaB"
```

### Register Slash Commands

```bash
curl -X POST https://your-vercel-app.vercel.app/api/register-commands \
  -H "Authorization: Bearer eVw6h2JgR7nPkXfC9LqM4sT5bZyA8uQt3DxE1pKoWSaB"
```

## Running the Bot Locally

```bash
npm install
npm start
```

This will start the bot directly on your machine, which is useful for testing slash commands.

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
