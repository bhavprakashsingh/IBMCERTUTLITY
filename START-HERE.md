# 🚀 Quick Start Instructions

## ✅ Ports are Clear - Ready to Start!

The old server processes have been terminated. You can now start the backend server with the new AUTO-FETCH CHAIN feature.

## 📝 Manual Steps to Start Backend

### Option 1: Using VSCode Terminal
1. Open a **new terminal** in VSCode (Terminal → New Terminal)
2. Run: `node server.js`
3. You should see:
   ```
   🔐 Certificate Chain Fetcher API Server
   ✅ Server running on http://localhost:3001
   
   🔐 API endpoints:
      - POST /api/fetch-chain - Fetch chain from server
      - POST /api/fetch-issuer-chain - Auto-complete chain from leaf cert
   ```

### Option 2: Using Command Prompt
1. Open Command Prompt
2. Navigate to: `cd C:\Users\BhavPrakashSingh\Downloads\certmaster---ssl_tls-toolkit`
3. Run: `node server.js`

## ✅ Verify Both Servers are Running

You should have:
- **Backend Server**: http://localhost:3001 (Terminal 1)
- **Frontend Server**: http://localhost:3000 (Terminal 2 - already running)

## 🧪 Test the AUTO-FETCH CHAIN Feature

1. Go to http://localhost:3000
2. Paste your LEAF certificate in the "Source PEM" textarea
3. Click the green **"AUTO-FETCH CHAIN"** button
4. Watch as it automatically fetches:
   - ✅ Intermediate certificate(s)
   - ✅ Root certificate
   - ✅ Complete chain verification

## 🎯 Expected Result

**Before AUTO-FETCH:**
```
⚠️ Warning: Chain does not end with a self-signed root certificate (Incomplete chain?)
Certificate 1: LEAF (integrate.ecb.europa.eu)
```

**After AUTO-FETCH:**
```
✅ Chain verification successful
Certificate 1: LEAF (integrate.ecb.europa.eu)
Certificate 2: INTERMEDIATE (DigiCert TLS RSA SHA256 2020 CA1)
Certificate 3: ROOT - SELF-SIGNED (DigiCert Global Root CA)
```

## 🔧 Troubleshooting

### If port 3001 is still in use:
```bash
netstat -ano | findstr :3001
taskkill /F /PID <PID_NUMBER>
```

### If you see "Cannot POST /api/fetch-issuer-chain":
- The backend server is running old code
- Stop it (Ctrl+C) and restart with `node server.js`

### If AUTO-FETCH button doesn't appear:
- Refresh the browser (Ctrl+F5)
- Check that frontend is running on http://localhost:3000

---

**🎉 The feature is fully implemented and ready to use!**