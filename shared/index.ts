// shared/index.ts
export * from './schema.js';
// Export other shared modules here

# 1. Clean everything
rmdir /s /q node_modules
del package-lock.json

# 2. Install with legacy peer deps
npm install --legacy-peer-deps

# 3. Run dev
npm run dev