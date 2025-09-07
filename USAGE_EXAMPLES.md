# KremStream Neo - Usage Examples

## Overview

After the refactoring, KremStream Neo now supports running either Twitch, YouTube, or both integrations independently. The system automatically handles source marking based on which integrations are active.

## Environment Variables

Make sure you have the required environment variables set:

```env
# Twitch Configuration
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret
TWITCH_REDIRECT_URI=http://localhost:3000/auth/twitch/callback
TWITCH_USER_ID=your_twitch_user_id

# YouTube Configuration
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
YOUTUBE_REDIRECT_URI=http://localhost:3000/auth/youtube/callback
```

## Usage Scenarios

### Scenario 1: Twitch Only

1. Set up only Twitch environment variables (TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET, TWITCH_USER_ID)
2. Start the server: `bun run start`
3. If no tokens exist, visit the URL provided in console output
4. Result: Only Twitch events are processed, no source marking on messages

**Expected Console Output:**
```
🌐 Server running at http://localhost:3000
🚀 Starting KremStream Neo initialization...
🔍 Enabled integrations: twitch
🔍 twitch: missing
🔐 Authentication required:
   - Authentication required for the following integrations:
   - Twitch: http://localhost:3000/auth/twitch
Server will wait for authentication before proceeding...

🔑 twitch authentication received
✅ twitch tokens validated
🎯 Starting integrations...
✅ twitch integration started successfully
🎉 KremStream Neo is ready! Active integrations: twitch
📝 Source marking disabled (single integration active)
```

**Message Format:**
```json
{
  "type": "chat",
  "data": {
    "id": "msg_123",
    "username": "viewer_name",
    "text": "Hello world!",
    "color": "#ff256a",
    "profilePic": "https://...",
    "source": ""
  }
}
```

### Scenario 2: YouTube Only

1. Set up only YouTube environment variables (YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET)
2. Make sure you have an active YouTube live stream
3. Start the server: `bun run start`
4. If no tokens exist, visit the URL provided in console output
5. Result: Only YouTube events are processed, no source marking on messages

**Expected Console Output:**
```
🌐 Server running at http://localhost:3000
🚀 Starting KremStream Neo initialization...
🔍 Enabled integrations: youtube
🔍 youtube: missing
🔐 Authentication required:
   - Authentication required for the following integrations:
   - YouTube: http://localhost:3000/auth/youtube
Server will wait for authentication before proceeding...

🔑 youtube authentication received
✅ youtube tokens validated
🎯 Starting integrations...
✅ youtube integration started successfully
🎉 KremStream Neo is ready! Active integrations: youtube
📝 Source marking disabled (single integration active)
```

**Message Format:**
```json
{
  "type": "chat",
  "data": {
    "id": "msg_456",
    "username": "youtube_viewer",
    "text": "Great stream!",
    "color": "#ff0000",
    "profilePic": "https://...",
    "source": ""
  }
}
```

### Scenario 3: Both Integrations

1. Set up both Twitch and YouTube environment variables
2. Start the server: `bun run start`
3. If no tokens exist, visit the URLs provided in console output
4. Result: Both platforms work simultaneously, messages show source

**Expected Console Output:**
```
🌐 Server running at http://localhost:3000
🚀 Starting KremStream Neo initialization...
🔍 Enabled integrations: twitch, youtube
🔍 twitch: missing
🔍 youtube: missing
🔐 Authentication required:
   - Authentication required for the following integrations:
   - Twitch: http://localhost:3000/auth/twitch
   - YouTube: http://localhost:3000/auth/youtube
Server will wait for authentication before proceeding...

🔑 twitch authentication received
✅ twitch tokens validated
🔑 youtube authentication received
✅ youtube tokens validated
🎯 Starting integrations...
✅ twitch integration started successfully
✅ youtube integration started successfully
🎉 KremStream Neo is ready! Active integrations: twitch, youtube
📝 Source marking enabled (multiple integrations active)
```

**Message Formats:**
```json
// Twitch message
{
  "type": "chat",
  "data": {
    "id": "msg_123",
    "username": "twitch_viewer",
    "text": "Hello from Twitch!",
    "source": "twitch"
  }
}

// YouTube message
{
  "type": "chat",
  "data": {
    "id": "msg_456",
    "username": "youtube_viewer",
    "text": "Hello from YouTube!",
    "source": "youtube"
  }
}
```

### Scenario 4: No Environment Variables

1. Start server without setting any CLIENT_ID/CLIENT_SECRET environment variables
2. Result: Clear guidance on required environment variables

**Expected Console Output:**
```
🌐 Server running at http://localhost:3000
🚀 Starting KremStream Neo initialization...
❌ No integrations enabled. Please set environment variables:
   - For Twitch: TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET
   - For YouTube: YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET
```

### Scenario 5: Mixed Token States

1. Have valid Twitch tokens but missing YouTube tokens (or vice versa)
2. Start the server: `bun run start`
3. Result: Available integrations start immediately, others wait for auth

**Expected Console Output:**
```
🌐 Server running at http://localhost:3000
🚀 Starting KremStream Neo initialization...
🔍 Enabled integrations: twitch, youtube
✅ twitch: valid
🔍 youtube: missing
🔐 Authentication required:
   - Authentication required for the following integrations:
   - YouTube: http://localhost:3000/auth/youtube
Server will wait for authentication before proceeding...

🎯 Starting integrations...
✅ twitch integration started successfully
📝 Source marking disabled (single integration active)

# After YouTube auth completes:
🔑 youtube authentication received
✅ youtube tokens validated
✅ youtube integration started successfully
📝 Source marking now enabled (multiple integrations active)
```

## WebSocket Events

All overlays connect to `ws://localhost:3000/ws` and receive these event types:

### Chat Events
```json
{
  "type": "chat",
  "data": {
    "id": "unique_message_id",
    "username": "viewer_name",
    "text": "Message with <img class=\"emote\" alt=\"Kappa\" src=\"...\"> emotes",
    "color": "#ff256a",
    "profilePic": "https://profile-pic-url",
    "source": "twitch" // or "youtube" or "" if only one integration active
  }
}
```

### Follow Events
```json
{
  "type": "follow",
  "data": {
    "username": "new_follower",
    "profilePic": "https://profile-pic-url"
  }
}
```

### Message Delete Events
```json
{
  "type": "chatDelete",
  "data": {
    "id": "message_id_to_delete"
  }
}
```

### Control Events (from overlays to server)
```json
// Toggle dark mode
{
  "type": "overlay",
  "data": {
    "subType": "darkMode"
  }
}

// Toggle pause/freeze
{
  "type": "overlay",
  "data": {
    "subType": "pause"
  }
}

// Change OBS scene
{
  "type": "obs",
  "data": {
    "subType": "scene",
    "sceneName": "Gaming Scene"
  }
}
```

## Error Handling

The new system gracefully handles various error scenarios:

### Integration Failures
- If Twitch fails to connect, YouTube continues working (and vice versa)
- Failed integrations are logged but don't crash the server
- Automatic reconnection attempts for network issues

### Token Issues
- Expired tokens are automatically refreshed
- Invalid tokens trigger re-authorization flow
- Missing tokens simply prevent that integration from starting

### API Rate Limits
- YouTube polling automatically adjusts interval based on API responses
- Twitch WebSocket reconnects on keepalive timeouts
- Profile picture caching reduces API calls

## Integration Management

The system provides internal APIs for managing integrations:

```typescript
// Check status
const status = integrationManager.getIntegrationStatus();
// Returns: { twitch: true, youtube: false }

// Start specific integration
await integrationManager.startIntegration("youtube");

// Stop specific integration
await integrationManager.stopIntegration("twitch");

// Start all available
await integrationManager.startAllAvailableIntegrations();

// Stop all
await integrationManager.stopAllIntegrations();
```

## Troubleshooting

### Common Issues

1. **YouTube integration not starting**
   - Make sure you have an active live stream on YouTube
   - Check that YouTube API quotas aren't exceeded
   - Verify the OAuth scope includes `youtube.readonly`

2. **Twitch integration connection issues**
   - Verify WebSocket connectivity (firewall/proxy issues)
   - Check that TWITCH_USER_ID matches your broadcaster account
   - Ensure OAuth scopes include required permissions

3. **Emotes not loading**
   - Check TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET are set
   - Verify network connectivity to Twitch, BTTV, 7TV, and FFZ APIs

4. **Source marking not working**
   - Source only shows when 2+ integrations are active
   - Check that both integrations successfully started

### Token Refresh Scenarios

The system automatically handles token refresh:

```
🔍 Enabled integrations: twitch, youtube
✅ twitch: valid
⏰ youtube: expired
# System attempts to refresh YouTube tokens automatically
✅ youtube tokens refreshed successfully
🎯 Starting integrations...
✅ twitch integration started successfully
✅ youtube integration started successfully
```

If refresh fails:
```
🔍 Enabled integrations: twitch, youtube
✅ twitch: valid
❌ youtube: invalid
🔐 Authentication required:
   - Authentication required for the following integrations:
   - YouTube: http://localhost:3000/auth/youtube
```

### Debug Mode

Enable verbose logging by setting environment variable:
```env
DEBUG=1
```

This will show detailed integration status and event processing information.
