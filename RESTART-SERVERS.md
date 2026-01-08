# How to Restart the Servers

## The Problem
The backend server (Terminal 1) is running the OLD code without the new `/api/fetch-issuer-chain` endpoint.
You need to restart it to load the new code.

## Solution - Restart Backend Server

### Step 1: Stop the Backend Server
1. Click on **Terminal 1** (the one running `node server.js`)
2. Press **Ctrl+C** to stop the server

### Step 2: Start the Backend Server Again
In the same Terminal 1, run:
```bash
node server.js
```

You should see:
```
🚀 Certificate Chain Fetcher Backend
📡 Server running on http://localhost:3001
✅ Health check: http://localhost:3001/health
🔐 API endpoints:
   - POST /api/fetch-chain - Fetch chain from server
   - POST /api/fetch-issuer-chain - Auto-complete chain from leaf cert
```

### Step 3: Test the Feature
1. Go to http://localhost:3000 in your browser
2. Paste a LEAF certificate in the "Source PEM" text area
3. Click the green **"AUTO-FETCH CHAIN"** button
4. The application will automatically fetch and display the complete chain!

## What the AUTO-FETCH CHAIN Button Does

1. Takes your leaf certificate
2. Reads the AIA (Authority Information Access) extension
3. Downloads the intermediate certificate from the CA
4. Downloads the root certificate
5. Displays the complete chain with full analysis

## Note

- Terminal 2 (frontend) can keep running - no need to restart
- Only Terminal 1 (backend) needs to be restarted to load the new code