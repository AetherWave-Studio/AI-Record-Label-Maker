# Protocol Calendar Extension for Outlook

A custom Outlook web add-in that enables you to attach **emotional relics**, **narrative lore**, and **protocol metadata** to calendar events. This MVP provides a foundation for building your AI Meeting Protocol system.

## 🎯 Features

- **Emotional Relic Tagging**: Tag events with emotional states (joy, reflection, determination, etc.)
- **Lore Type Classification**: Assign narrative elements (origin story, quest, ritual, etc.)
- **Contributor Status**: Broadcast your engagement level (ready, reflecting, needs support, etc.)
- **Custom Tags**: Add freeform tags for additional context
- **Protocol Notes**: Attach rich contextual notes to events
- **Microsoft Graph Integration**: Stores metadata using open extensions
- **Offline-Ready**: Data persists in calendar events across devices

## 📋 Prerequisites

Before you begin, ensure you have:

1. **Microsoft 365 Account** with Outlook access
2. **Azure AD App Registration** (we'll create this)
3. **Node.js** (for local development server)
4. **Modern web browser** (Chrome, Edge, Firefox)

## 🚀 Setup Instructions

### Step 1: Azure AD App Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Configure:
   - **Name**: Protocol Calendar Extension
   - **Supported account types**: Accounts in any organizational directory and personal Microsoft accounts
   - **Redirect URI**:
     - Platform: Single-page application (SPA)
     - URI: `https://localhost:3000/src/index.html`
5. Click **Register**
6. Note your **Application (client) ID** - you'll need this!

### Step 2: Configure API Permissions

1. In your app registration, go to **API permissions**
2. Click **Add a permission** > **Microsoft Graph** > **Delegated permissions**
3. Add these permissions:
   - `Calendars.ReadWrite`
   - `User.Read`
4. Click **Add permissions**
5. Click **Grant admin consent** (if you have admin rights)

### Step 3: Update Configuration

Edit `src/auth.js` and replace the placeholder with your actual Client ID:

```javascript
const msalConfig = {
  auth: {
    clientId: 'YOUR_CLIENT_ID_HERE', // Replace with your actual Client ID
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: 'https://localhost:3000/src/index.html'
  },
  // ...
};
```

### Step 4: Generate SSL Certificate (for HTTPS)

Outlook requires add-ins to be served over HTTPS. Generate a self-signed certificate:

```bash
# Install mkcert (if not already installed)
# On Windows with Chocolatey:
choco install mkcert

# Create local certificate authority
mkcert -install

# Generate certificate for localhost
cd Outlook-Protocol-Extension
mkcert localhost 127.0.0.1 ::1
```

This creates `localhost.pem` and `localhost-key.pem` files.

### Step 5: Set Up Development Server

Install a simple HTTPS server:

```bash
npm install -g http-server

# Or use Python's built-in server
python -m http.server 3000 --bind localhost
```

For HTTPS with Node.js, create a simple server (`server.js`):

```javascript
const https = require('https');
const fs = require('fs');
const path = require('path');
const express = require('express');

const app = express();
app.use(express.static(__dirname));

const options = {
  key: fs.readFileSync('localhost-key.pem'),
  cert: fs.readFileSync('localhost.pem')
};

https.createServer(options, app).listen(3000, () => {
  console.log('Server running at https://localhost:3000');
});
```

Install dependencies and run:

```bash
npm install express
node server.js
```

### Step 6: Sideload the Add-in in Outlook

#### Outlook on the Web:

1. Go to [Outlook on the web](https://outlook.office.com)
2. Open your calendar
3. Click **Settings** (gear icon) > **View all Outlook settings**
4. Go to **General** > **Manage Add-ins**
5. Click **+ Add from file**
6. Upload `manifest.xml` from your project
7. Click **Install**

#### Outlook Desktop:

1. Open Outlook desktop
2. Go to **File** > **Get Add-ins**
3. Click **My add-ins** > **Add a custom add-in** > **Add from file**
4. Select `manifest.xml`
5. Click **Install**

### Step 7: Test the Extension

1. Open a calendar event (or create a new one)
2. Look for the **Protocol Calendar** button in the ribbon
3. Click it to open the add-in panel
4. Click **Connect to Microsoft Graph**
5. Sign in with your Microsoft account
6. Add metadata to the event and click **Save Protocol Data**

## 🎨 Using the Extension

### Emotional Relics

Tag events with emotional states:
- ✨ **Joy**: Celebratory or uplifting moments
- 🌟 **Anticipation**: Looking forward to outcomes
- 🌙 **Reflection**: Contemplative or review sessions
- ⚡ **Determination**: High-focus execution mode
- 🔍 **Curiosity**: Exploratory or learning sessions
- 🙏 **Gratitude**: Appreciation or acknowledgment rituals
- 💫 **Vulnerability**: Honest, open conversations
- 🤝 **Connection**: Relationship-building moments

### Lore Types

Classify narrative elements:
- 🌱 **Origin Story**: Foundational or beginning moments
- ⚔️ **Quest/Mission**: Goal-oriented sessions
- 🕯️ **Ritual/Ceremony**: Recurring meaningful practices
- 💡 **Revelation**: Breakthrough or insight moments
- 🤝 **Alliance Formation**: Partnership or team-building
- 🎯 **Challenge/Trial**: Problem-solving or overcoming obstacles
- 🎉 **Celebration**: Milestone or achievement recognition
- 🦋 **Transformation**: Change or evolution moments

### Contributor Status

Broadcast your engagement level:
- ✅ **Ready**: Prepared and available
- 🤔 **Reflecting**: Processing or thinking
- 🆘 **Needs Support**: Seeking help or guidance
- 💫 **Inspired**: Creative or motivated state
- 🎯 **Focused**: Deep work mode
- 🤝 **Collaborating**: Actively working with others

## 🔧 Customization

### Adding New Emotional Relics

Edit `src/index.html` to add options to the `emotionalRelic` select:

```html
<option value="wonder">🌈 Wonder</option>
```

Update `src/app.js` to add display mapping:

```javascript
function getEmotionalRelicDisplay(value) {
  const map = {
    // ... existing entries
    'wonder': '🌈 Wonder'
  };
  return map[value] || value;
}
```

### Styling

Edit `src/styles.css` to customize colors, fonts, and layout.

### Metadata Schema

To add new metadata fields:

1. Add form fields in `src/index.html`
2. Collect values in `handleSaveMetadata()` in `src/app.js`
3. Display in `displaySavedMetadata()`

## 📊 Metadata Storage

Metadata is stored using **Microsoft Graph open extensions** on calendar events:

```json
{
  "@odata.type": "microsoft.graph.openTypeExtension",
  "extensionName": "com.aetherwave.protocol",
  "emotionalRelic": "joy",
  "loreType": "celebration",
  "contributorStatus": "inspired",
  "customTags": "milestone, team, launch",
  "protocolNotes": "Successful product launch celebration",
  "lastUpdated": "2025-01-12T10:30:00Z",
  "version": "1.0"
}
```

This data:
- ✅ Persists across devices
- ✅ Syncs with other calendar clients
- ✅ Can be queried via Graph API
- ✅ Supports future agentic workflows

## 🐛 Troubleshooting

### "Failed to initialize authentication"

- Check that your Client ID in `auth.js` is correct
- Verify redirect URI matches Azure AD app registration
- Ensure you're using HTTPS (not HTTP)

### "No event loaded"

- Make sure you're viewing/editing a calendar event
- The add-in only works within event context
- Try refreshing Outlook

### CORS Errors

- Ensure your server is running on `https://localhost:3000`
- Check browser console for specific CORS issues
- Verify Azure AD redirect URI is exactly `https://localhost:3000/src/index.html`

### Certificate Errors

- Accept the self-signed certificate in your browser
- Or install `mkcert` and run `mkcert -install` to trust local certificates

## 🚧 Next Steps

This MVP provides the foundation. Consider adding:

1. **View Toggle**: Personal vs. Mythic calendar views
2. **Contributor Beacons**: Real-time collaboration status
3. **Lore Overlays**: Visual narrative elements on calendar
4. **Protocol Validator**: Rule engine for metadata validation
5. **Agentic Workflows**: AI agents that read/write protocol metadata
6. **Offline Sync**: Queued operations with conflict resolution
7. **Analytics Dashboard**: Visualize emotional/narrative patterns

## 📚 Resources

- [Outlook Add-ins Documentation](https://docs.microsoft.com/en-us/office/dev/add-ins/outlook/)
- [Microsoft Graph API](https://docs.microsoft.com/en-us/graph/)
- [MSAL.js Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js)
- [Open Extensions](https://docs.microsoft.com/en-us/graph/extensibility-open-users)

## 📝 License

MIT License - Feel free to use and modify for your protocol experiments!

## 🤝 Contributing

This is a personal protocol experimentation tool, but ideas and suggestions are welcome!

---

**Built with ❤️ for the AI Meeting Protocol**
