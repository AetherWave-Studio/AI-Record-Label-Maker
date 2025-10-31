# 🎯 Quick Start - AetherWave Studio Local Development

## ⚡ Ultra-Fast Setup (5 minutes)

### 1️⃣ Get Your Database URL from Replit

```bash
# Go to: https://replit.com/@your-username/GhostMusician
# Click: Tools > Secrets
# Copy the value of: DATABASE_URL
```

### 2️⃣ Fill in `.env` File

Open `.env` in this directory and paste your DATABASE_URL:

```bash
DATABASE_URL=postgresql://your-connection-string-here-from-replit
```

**Copy all your API keys from Replit Secrets:**
- GOOGLE_API_KEY
- ANTHROPIC_API_KEY
- OPENAI_API_KEY
- GOOGLE_CLOUD_PROJECT
- GOOGLE_CLOUD_STORAGE_BUCKET

### 3️⃣ Start Development Server

```bash
npm run dev
```

### 4️⃣ Open Browser

http://localhost:5000

---

## ✅ Verification Checklist

- [ ] Dependencies installed? (`node_modules/` exists)
- [ ] `.env` file filled with DATABASE_URL?
- [ ] API keys added to `.env`?
- [ ] Dev server running? (`npm run dev`)
- [ ] Browser shows app at `localhost:5000`?

---

## 🚀 You're Ready!

**Start coding with Claude Code!**

For full details, see: [LOCAL_DEVELOPMENT_SETUP.md](./LOCAL_DEVELOPMENT_SETUP.md)

---

## 📝 Common Commands

```bash
# Start dev server (auto-reload)
npm run dev

# Type check
npm run check

# Push database schema changes
npm run db:push

# Build for production (test)
npm run build
npm run start
```

---

## 🐛 Quick Fixes

**Port 5000 already in use?**
```bash
taskkill /F /IM node.exe
```

**Database connection fails?**
- Check DATABASE_URL in `.env`
- Verify Neon database is online: https://console.neon.tech/

**API generation fails?**
- Verify API keys in `.env`
- Check key validity in respective consoles

---

## 🎯 Current Status

✅ **Node.js:** v22.18.0 (compatible)
✅ **npm:** v11.5.2
✅ **Dependencies:** Installed (`node_modules` exists)
⚠️ **Environment:** Need to configure `.env`
⚠️ **Database:** Need to add DATABASE_URL

**Next step:** Fill in `.env` file and run `npm run dev`!
