# Testing Your Setup

## ✅ Backend Server is Running!

The backend server started successfully on port 3001. You should see:
```
🚀 Certificate Chain Fetcher Backend
📡 Server running on http://localhost:3001
✅ Health check: http://localhost:3001/health
🔐 API endpoint: http://localhost:3001/api/fetch-chain
```

## Next Steps

### 1. Keep the backend running in this terminal

### 2. Open a NEW terminal and start the frontend:
```bash
npm run dev
```

### 3. Open your browser:
Navigate to: http://localhost:5173

### 4. Test the auto-fetch feature:
1. Go to "Cert Lab" tab
2. Enter hostname: `www.google.com`
3. Port: `443`
4. Click "Fetch Certificate Chain"
5. You should see the complete certificate chain automatically fetched!

## Alternative: Use npm start

If you want both to run in one terminal, you can use:
```bash
npm start
```

This will run both frontend and backend together using `concurrently`.

## Troubleshooting

If `npm start` doesn't work:
- Make sure you ran `npm install` first
- Check that `concurrently` is installed: `npm list concurrently`
- If not installed: `npm install concurrently --save-dev`

## Manual Testing

You can test the backend API directly:

**Health Check:**
```bash
curl http://localhost:3001/health
```

**Fetch Certificate Chain:**
```bash
curl -X POST http://localhost:3001/api/fetch-chain \
  -H "Content-Type: application/json" \
  -d "{\"hostname\":\"www.google.com\",\"port\":443}"
```

## Success Indicators

✅ Backend shows: "Server running on http://localhost:3001"
✅ Frontend shows: "VITE v6.2.0 ready"
✅ Browser opens at: http://localhost:5173
✅ No errors in browser console
✅ Auto-fetch feature works when you enter a hostname

Enjoy using IBMSRE-CertMaster! 🎉