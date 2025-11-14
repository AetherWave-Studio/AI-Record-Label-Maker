# Quick Start Guide

Get the Protocol Calendar Extension running in **5 minutes**!

## Prerequisites Checklist

- [ ] Microsoft 365 account with Outlook
- [ ] Node.js installed
- [ ] Azure AD app registration (see below)

## Step 1: Azure App Registration (3 minutes)

1. Go to https://portal.azure.com
2. **Azure Active Directory** → **App registrations** → **New registration**
3. Settings:
   - Name: `Protocol Calendar Extension`
   - Account types: **Accounts in any organizational directory and personal Microsoft accounts**
   - Redirect URI: **Single-page application** → `https://localhost:3000/src/index.html`
4. Click **Register**
5. **Copy the Application (client) ID** - you'll need it!
6. Go to **API permissions** → **Add permission** → **Microsoft Graph** → **Delegated**
7. Add: `Calendars.ReadWrite` and `User.Read`
8. Click **Grant admin consent** (if available)

## Step 2: Configure Client ID (30 seconds)

Edit `src/auth.js` line 8:

```javascript
clientId: 'YOUR_CLIENT_ID_HERE', // Paste your actual Client ID here
```

## Step 3: Generate SSL Certificate (1 minute)

### Windows (with Chocolatey):
```bash
choco install mkcert
mkcert -install
mkcert localhost
```

### macOS (with Homebrew):
```bash
brew install mkcert
mkcert -install
mkcert localhost
```

### Linux:
```bash
# Install mkcert (see https://github.com/FiloSottile/mkcert)
mkcert -install
mkcert localhost
```

This creates `localhost.pem` and `localhost-key.pem` in the current directory.

## Step 4: Install & Run (30 seconds)

```bash
npm install
npm start
```

You should see:
```
🔒 HTTPS Server running at https://localhost:3000
📅 Protocol Calendar Extension
```

## Step 5: Sideload in Outlook (1 minute)

### Outlook Web:
1. Go to https://outlook.office.com/calendar
2. **Settings** (⚙️) → **View all Outlook settings**
3. **General** → **Manage Add-ins**
4. **+ Add from file** → Upload `manifest.xml`
5. Click **Install**

### Outlook Desktop:
1. **File** → **Get Add-ins**
2. **My add-ins** → **Add a custom add-in** → **Add from file**
3. Select `manifest.xml`
4. Click **Install**

## Step 6: Test It! (30 seconds)

1. Open any calendar event (or create a test event)
2. Look for **"Add Protocol"** button in the ribbon
3. Click it to open the extension panel
4. Click **🔐 Connect to Microsoft Graph**
5. Sign in
6. Add some metadata and click **💾 Save Protocol Data**

## 🎉 Success!

Your protocol metadata is now saved to the calendar event. It will sync across all devices and persist in the calendar.

## Common Issues

### "Client ID is required"
→ You forgot to update `src/auth.js` with your Azure AD client ID

### "Certificate error" in browser
→ Click "Advanced" → "Proceed to localhost" to accept the self-signed certificate

### "Add-in doesn't appear"
→ Make sure server is running and you're viewing/editing a calendar event

### "Authentication fails"
→ Check that redirect URI in Azure AD exactly matches `https://localhost:3000/src/index.html`

## Next Steps

- Customize emotional relics and lore types in `src/index.html`
- Modify styling in `src/styles.css`
- Add new metadata fields in `src/app.js`
- Build your protocol! 🚀

## Need Help?

Check the full [README.md](README.md) for detailed documentation and troubleshooting.
