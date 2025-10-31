# 🚀 Local Development Setup for AetherWave Studio

This guide will help you run the project locally with Claude Code while keeping Replit as your deployment environment.

---

## 📋 Prerequisites

- **Node.js 20+** (check: `node --version`)
- **npm** (comes with Node.js)
- **Git** (for version control)
- **Claude Code** (already installed)

---

## 🔧 Step 1: Install Dependencies

```bash
npm install
```

This will install all 91 dependencies + 26 dev dependencies from `package.json`.

**Expected time:** 2-3 minutes

---

## 🗄️ Step 2: Configure Database

### Option A: Use Existing Replit Neon Database (Recommended)

**Advantage:** Your local and Replit environments share the same data.

1. **Get your DATABASE_URL from Replit:**
   - Go to your Replit project: https://replit.com/@your-username/GhostMusician
   - Click **Tools** → **Secrets** (in left sidebar)
   - Copy the value of `DATABASE_URL`

2. **Add to `.env` file:**
   ```bash
   # Open .env file and paste:
   DATABASE_URL=postgresql://your-connection-string-here
   ```

3. **Test connection:**
   ```bash
   npm run db:push
   ```
   If successful, you'll see: "✓ Schema pushed successfully"

### Option B: Create Separate Local Database (Advanced)

**Advantage:** Keep local and production data separate.

1. **Create a new Neon database:**
   - Go to: https://console.neon.tech/
   - Click **Create Project**
   - Copy the connection string

2. **Add to `.env`:**
   ```bash
   DATABASE_URL=postgresql://new-local-connection-string
   ```

3. **Push schema:**
   ```bash
   npm run db:push
   ```

---

## 🔑 Step 3: Set Up API Keys

You need API keys for AI services. Get them from Replit or create new ones:

### Required Keys:

1. **Google Gemini API** (for audio analysis)
   - Get from: https://makersuite.google.com/app/apikey
   - Add to `.env`: `GOOGLE_API_KEY=your-key-here`

2. **Google Cloud Project** (for Imagen & Storage)
   - Get from: https://console.cloud.google.com/
   - Add to `.env`:
     ```
     GOOGLE_CLOUD_PROJECT=your-project-id
     GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
     GOOGLE_CLOUD_STORAGE_BUCKET=your-bucket-name
     ```

3. **Anthropic Claude API** (fallback)
   - Get from: https://console.anthropic.com/
   - Add to `.env`: `ANTHROPIC_API_KEY=your-key-here`

4. **OpenAI API** (fallback)
   - Get from: https://platform.openai.com/api-keys
   - Add to `.env`: `OPENAI_API_KEY=your-key-here`

### Quick Copy from Replit:

```bash
# In Replit, go to Tools > Secrets and copy these values:
# Then paste into your local .env file
```

---

## 🎨 Step 4: Start Development Server

```bash
npm run dev
```

**What happens:**
- Server starts on http://localhost:5000
- Vite dev server with HMR (hot module reload)
- tsx watches for TypeScript changes
- Backend auto-restarts on file changes

**Expected output:**
```
🚀 Server running on http://localhost:5000
⚡️ Vite dev server ready
```

**Open in browser:** http://localhost:5000

---

## 🧪 Step 5: Test Everything Works

### Test 1: Homepage Loads
1. Go to http://localhost:5000
2. You should see "Virtual Artist Generator" landing page

### Test 2: Database Connection
1. Check terminal for database errors
2. If connected, you'll see: "✓ Database connected"

### Test 3: Upload Audio (Full Test)
1. Sign in via Replit Auth (will redirect to Replit)
2. Upload an MP3 file
3. AI should generate an artist card
4. If successful, card appears with stats

**Troubleshooting:**
- If AI generation fails: Check API keys in `.env`
- If upload fails: Check Google Cloud Storage credentials
- If database fails: Verify DATABASE_URL is correct

---

## 🔄 Development Workflow

### Typical Workflow:

```bash
# 1. Start dev server
npm run dev

# 2. Make code changes in VS Code / Claude Code
# Files auto-reload on save

# 3. Test in browser (http://localhost:5000)

# 4. If database schema changes:
npm run db:push

# 5. Type check (optional):
npm run check

# 6. When ready to deploy to Replit:
git add .
git commit -m "Your changes"
git push origin main
# Replit auto-deploys on push
```

### Hot Module Reload (HMR):

**Frontend changes** (React components):
- ✅ Auto-reload in browser (no refresh needed)
- Edit `client/src/**/*.tsx` files

**Backend changes** (Express routes):
- ⚠️ Server restarts automatically
- May need manual browser refresh
- Edit `server/**/*.ts` files

**Database schema changes**:
- Run `npm run db:push` to sync
- Edit `shared/schema.ts`

---

## 📁 Project Structure (Quick Reference)

```
GhostMusician/
├── client/                # React frontend
│   ├── src/
│   │   ├── pages/        # Page components (home, gallery, etc.)
│   │   ├── components/   # Reusable UI components
│   │   ├── hooks/        # Custom React hooks
│   │   └── lib/          # Utilities (queryClient, etc.)
│   └── index.html        # HTML entry point
│
├── server/                # Express backend
│   ├── index.ts          # Main server file
│   ├── routes.ts         # API endpoints
│   ├── db.ts             # Database connection
│   ├── services/         # Business logic (AI, audio analysis)
│   └── uploads/          # Local file storage
│
├── shared/                # Shared code (frontend + backend)
│   └── schema.ts         # Database schema (Drizzle ORM)
│
├── .env                   # Environment variables (LOCAL ONLY)
├── package.json          # Dependencies & scripts
├── tsconfig.json         # TypeScript config
├── vite.config.ts        # Vite build config
└── drizzle.config.ts     # Database config
```

---

## 🌐 Preview URLs

### Local Development:
- **Main app:** http://localhost:5000
- **API endpoints:** http://localhost:5000/api/*

### Replit Production:
- **Current:** https://468b0a1c-1b65-41c8-a14c-bf1bc71b3154-00-3ovebdlqidjiw.kirk.replit.dev/
- **Custom domain (when ready):** https://aetherwave.studio

---

## 🚢 Deployment to Replit

Your setup keeps **Replit as deployment target**. Here's how it works:

### Auto-Deploy on Git Push:

1. **Make changes locally**
2. **Commit:**
   ```bash
   git add .
   git commit -m "Add social networking features"
   ```
3. **Push to Replit:**
   ```bash
   git push origin main
   ```
4. **Replit auto-deploys:**
   - Runs `npm run build`
   - Starts `npm run start`
   - App updates live

### Manual Deploy (if needed):

1. **In Replit, click "Run" button**
2. Or in Replit shell:
   ```bash
   npm run build && npm run start
   ```

---

## 🔍 Debugging Tips

### Check What's Running:

```bash
# See if port 5000 is in use
netstat -ano | findstr :5000

# Kill process if needed (Windows)
taskkill /PID <process-id> /F
```

### Database Issues:

```bash
# Test database connection
npm run db:push

# If schema sync fails, check:
# 1. DATABASE_URL is correct
# 2. Neon database is online (check console.neon.tech)
# 3. IP whitelist (Neon allows all by default)
```

### AI Generation Fails:

Check API keys are valid:
```bash
# In .env file, ensure these are set:
GOOGLE_API_KEY=...
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...
```

### Build Errors:

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

---

## 🎯 Common Development Tasks

### Add a New API Endpoint:

1. **Edit `server/routes.ts`:**
   ```typescript
   app.get('/api/my-new-endpoint', async (req, res) => {
     res.json({ message: 'Hello!' });
   });
   ```

2. **Test:** http://localhost:5000/api/my-new-endpoint

3. **No restart needed** (tsx auto-reloads)

### Add a New React Component:

1. **Create file:** `client/src/components/MyComponent.tsx`
2. **Import in page:** `import MyComponent from '@/components/MyComponent'`
3. **Save** → HMR auto-updates browser

### Modify Database Schema:

1. **Edit:** `shared/schema.ts`
2. **Push to DB:**
   ```bash
   npm run db:push
   ```
3. **Restart dev server** if needed

### Update Dependencies:

```bash
# Check for updates
npm outdated

# Update specific package
npm install package-name@latest

# Update all (careful!)
npm update
```

---

## 🔐 Security Notes

### ⚠️ NEVER commit `.env` file!

Already in `.gitignore`, but double-check:
```bash
git status
# Should NOT show .env in "Changes to be committed"
```

### ✅ Use `.env.example` for sharing

When team members need setup, they copy `.env.example` → `.env` and fill in their own keys.

### 🔑 API Key Best Practices

- **Local development:** Use test/development API keys
- **Replit production:** Use production API keys in Replit Secrets
- **Never hardcode** keys in source code

---

## 📊 Performance Optimization

### Build for Production (Test Locally):

```bash
npm run build
npm run start
```

This creates optimized bundles in `dist/`:
- `dist/index.js` - Backend bundle
- `dist/public/` - Frontend static files

### Check Bundle Sizes:

```bash
# After build, check dist/public/assets/
# Look for large JS chunks

# Vite automatically code-splits, but you can optimize further:
# - Lazy load heavy components
# - Use dynamic imports
# - Tree-shake unused dependencies
```

---

## 🐛 Troubleshooting Reference

| Issue | Solution |
|-------|----------|
| **Port 5000 already in use** | Kill process: `taskkill /F /IM node.exe` |
| **Database connection fails** | Check DATABASE_URL in `.env` |
| **API keys invalid** | Regenerate keys, update `.env` |
| **Vite errors** | Clear cache: `rm -rf node_modules/.vite` |
| **TypeScript errors** | Run `npm run check` to see all errors |
| **Upload fails** | Check Google Cloud Storage credentials |
| **Auth not working locally** | Replit Auth only works on Replit domain |

---

## 🎉 You're Ready!

**Next steps:**

1. ✅ Run `npm install`
2. ✅ Fill in `.env` file
3. ✅ Run `npm run dev`
4. ✅ Open http://localhost:5000
5. ✅ Start coding with Claude Code!

**Happy coding! 🚀**

For questions, check:
- [Replit Docs](https://docs.replit.com/)
- [Vite Docs](https://vitejs.dev/)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
