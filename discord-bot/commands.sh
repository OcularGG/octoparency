#!/bin/bash

# URLs
VERCEL_URL="your-vercel-app.vercel.app"  # Replace with your actual Vercel URL
API_KEY="eVw6h2JgR7nPkXfC9LqM4sT5bZyA8uQt3DxE1pKoWSaB"

# Send DMs to members with role ID 1336395193980817458
send_dms_role_1() {
  curl -X POST https://${VERCEL_URL}/api/send-dm \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${API_KEY}" \
    -d '{"roleId":"1336395193980817458"}'
}

# Send DMs to members with role ID 1336395194995834971
send_dms_role_2() {
  curl -X POST https://${VERCEL_URL}/api/send-dm \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${API_KEY}" \
    -d '{"roleId":"1336395194995834971"}'
}

# Check the status of the current DM sending job
check_job_status() {
  curl -X GET https://${VERCEL_URL}/api/job-status \
    -H "Authorization: Bearer ${API_KEY}"
}

# Register slash commands
register_commands() {
  curl -X POST https://${VERCEL_URL}/api/register-commands \
    -H "Authorization: Bearer ${API_KEY}"
}

# Send a test DM to specific user
send_test_dm() {
  curl -X POST https://${VERCEL_URL}/api/send-dm \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${API_KEY}" \
    -d '{"userId":"1207434980855259206"}'
}

# To use these commands:
# 1. Replace 'your-vercel-app.vercel.app' with your actual Vercel URL at the top of this file
# 2. Make this file executable: chmod +x commands.sh
# 3. Source this file: source commands.sh
# 4. Run any command: send_dms_role_1, send_dms_role_2, check_job_status, register_commands, or send_test_dm
