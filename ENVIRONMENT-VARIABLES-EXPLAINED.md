# Environment Variables - How It Works

## 🔍 Understanding Vite Environment Variables

Vite uses a specific system for environment variables. Here's how it picks up your domain:

### 1. Environment Files

Vite automatically loads environment files based on the mode:

```
.env                # Loaded in all cases
.env.local          # Loaded in all cases, ignored by git
.env.[mode]         # Only loaded in specified mode
.env.[mode].local   # Only loaded in specified mode, ignored by git
```

**Priority (highest to lowest):**
1. `.env.[mode].local`
2. `.env.[mode]`
3. `.env.local`
4. `.env`

### 2. How Variables Are Loaded

**In `vite.config.ts`:**
```typescript
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');  // Loads .env files
    return {
      define: {
        'process.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'http://localhost:3001')
      }
    }
});
```

**In your code (`config.ts`):**
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
```

### 3. Build Modes

**Development Mode:**
```bash
npm run dev
# Uses: .env.development or .env
```

**Production Mode:**
```bash
npm run build
# Uses: .env.production or .env
```

## 📝 Your Setup

### For Local Development

Create `.env` or `.env.development`:
```bash
VITE_API_URL=http://localhost:3001
```

### For Production (EC2 with Domain)

Create `.env.production`:
```bash
VITE_API_URL=https://ibmcertlab.cops.webmethods.io
```

## 🚀 How It Works in Deployment

### Step 1: Build Process
When you run `npm run build` on EC2:

1. Vite reads `.env.production`
2. Finds `VITE_API_URL=https://ibmcertlab.cops.webmethods.io`
3. Replaces all `import.meta.env.VITE_API_URL` with the actual value
4. Bundles the code with the hardcoded domain

### Step 2: Runtime
The built JavaScript files contain:
```javascript
const API_BASE_URL = "https://ibmcertlab.cops.webmethods.io";
```

**NOT:**
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL;
```

## 🔧 Deployment Script Does This

The `deploy-with-domain.sh` script creates `.env.production`:

```bash
cat > .env.production << EOF
PORT=3001
NODE_ENV=production
VITE_API_URL=https://ibmcertlab.cops.webmethods.io
EOF

npm run build  # This reads .env.production
```

## ✅ Verification

### Check Environment Variable During Build

Add this to your build process to verify:

```bash
# Before building
echo "VITE_API_URL=$VITE_API_URL"

# Build
npm run build

# Check built files
grep -r "ibmcertlab.cops.webmethods.io" dist/
```

### Check in Browser Console

After deployment, open browser console:
```javascript
// This won't work (import.meta.env only exists during build)
console.log(import.meta.env.VITE_API_URL);

// But the actual value is hardcoded in your config.ts
// Check the network tab to see API calls going to your domain
```

## 🎯 Summary

**Development (Local):**
```
.env → VITE_API_URL=http://localhost:3001
     ↓
npm run dev
     ↓
App uses: http://localhost:3001
```

**Production (EC2):**
```
.env.production → VITE_API_URL=https://ibmcertlab.cops.webmethods.io
     ↓
npm run build (reads .env.production)
     ↓
Vite replaces import.meta.env.VITE_API_URL with actual value
     ↓
dist/ contains hardcoded: https://ibmcertlab.cops.webmethods.io
     ↓
App uses: https://ibmcertlab.cops.webmethods.io
```

## 🔍 Troubleshooting

### Issue: App still uses localhost after deployment

**Cause:** `.env.production` not created or not read during build

**Solution:**
```bash
# On EC2, verify .env.production exists
cat .env.production

# Should show:
# VITE_API_URL=https://ibmcertlab.cops.webmethods.io

# Rebuild
npm run build

# Verify in built files
grep -r "localhost:3001" dist/  # Should return nothing
grep -r "ibmcertlab.cops.webmethods.io" dist/  # Should find matches
```

### Issue: How to verify which URL is being used?

**Check Network Tab:**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Reload page
4. Look for API calls to `/api/` or `/health`
5. Check the domain in the request URL

**Should see:**
```
Request URL: https://ibmcertlab.cops.webmethods.io/api/domain-info
```

**NOT:**
```
Request URL: http://localhost:3001/api/domain-info
```

## 📋 Quick Reference

| Environment | File | Command | Result |
|-------------|------|---------|--------|
| Development | `.env` or `.env.development` | `npm run dev` | Uses localhost |
| Production | `.env.production` | `npm run build` | Uses domain |

## 🎓 Key Takeaways

1. **Environment variables are replaced at BUILD time, not runtime**
2. **`.env.production` is used when running `npm run build`**
3. **The deployment script automatically creates `.env.production`**
4. **After build, the domain is hardcoded in the JavaScript files**
5. **You must rebuild (`npm run build`) to change the API URL**

---

**Made with ❤️ by IBM Bob**