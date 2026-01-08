# IBMSRE-CertMaster Setup Guide

## Quick Start

### Prerequisites
- Node.js v18 or higher
- npm (comes with Node.js)

### Installation

1. **Clone or download the repository**
   ```bash
   cd certmaster---ssl_tls-toolkit
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application**
   ```bash
   npm start
   ```
   This command starts both the frontend (port 5173) and backend (port 3001) servers.

4. **Access the application**
   Open your browser and navigate to: `http://localhost:5173`

## Running Options

### Option 1: Run Everything Together (Recommended)
```bash
npm start
```
- Starts frontend on `http://localhost:5173`
- Starts backend on `http://localhost:3001`
- Both run concurrently in the same terminal

### Option 2: Run Separately
```bash
# Terminal 1 - Frontend only
npm run dev

# Terminal 2 - Backend only (required for auto-fetch feature)
npm run server
```

### Option 3: Frontend Only (Limited Features)
```bash
npm run dev
```
**Note**: Certificate chain auto-fetch feature will not work without the backend server.

## Features Requiring Backend

The following features require the backend server to be running:

✅ **Auto-Fetch Certificate Chains**
- Automatically retrieve complete certificate chains from any server
- Fetch leaf, intermediate, and root certificates
- Works with any hostname and port

❌ **Without Backend**
- Manual certificate upload/paste still works
- All certificate analysis features work
- Key matching works
- Command generation works

## Port Configuration

### Default Ports
- **Frontend**: 5173 (Vite dev server)
- **Backend**: 3001 (Express server)

### Changing Backend Port
Edit `server.js`:
```javascript
const PORT = process.env.PORT || 3001;
```

Then update the frontend API endpoint in `components/ChainFetcher.tsx`:
```typescript
const response = await fetch('http://localhost:YOUR_PORT/api/fetch-chain', {
```

## Troubleshooting

### Backend Server Not Starting

**Error**: `Cannot find module 'express'`
```bash
npm install express cors
```

**Error**: Port 3001 already in use
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3001 | xargs kill -9
```

### Frontend Cannot Connect to Backend

**Error**: "Cannot connect to backend server"

1. Verify backend is running:
   ```bash
   curl http://localhost:3001/health
   ```
   Should return: `{"status":"ok","message":"Certificate chain fetcher is running"}`

2. Check if backend port is correct in `ChainFetcher.tsx`

3. Ensure no firewall is blocking port 3001

### Certificate Fetch Fails

**Error**: "Failed to connect to hostname:port"

Possible causes:
- Hostname is incorrect or unreachable
- Port is not open or not running SSL/TLS
- Firewall blocking outbound connections
- Server requires SNI (Server Name Indication)

**Solution**: Try with a known working hostname first:
```
Hostname: www.google.com
Port: 443
```

## Production Build

### Build Frontend
```bash
npm run build
```
Output: `dist/` directory

### Preview Production Build
```bash
npm run preview
```

### Deploy Backend
For production deployment, consider:
- Using PM2 or similar process manager
- Setting up reverse proxy (nginx)
- Configuring HTTPS
- Setting environment variables

Example with PM2:
```bash
npm install -g pm2
pm2 start server.js --name certmaster-backend
pm2 save
pm2 startup
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# Backend
PORT=3001
NODE_ENV=production

# Frontend (Vite)
VITE_API_URL=http://localhost:3001
```

## Security Considerations

### Backend Server
- The backend accepts self-signed certificates (`rejectUnauthorized: false`)
- This is intentional for certificate analysis purposes
- Do not use this configuration for production authentication
- Consider adding rate limiting for production use

### CORS
- Currently allows all origins for development
- Restrict CORS in production:
  ```javascript
  app.use(cors({
    origin: 'https://your-domain.com'
  }));
  ```

## Development

### File Structure
```
certmaster---ssl_tls-toolkit/
├── components/          # React components
│   ├── CertLab.tsx     # Main certificate analyzer
│   ├── ChainFetcher.tsx # Server certificate fetcher
│   ├── KeyMatcher.tsx  # Key-certificate matcher
│   ├── CommandGen.tsx  # Command generator
│   └── Toast.tsx       # Toast notifications
├── utils/
│   └── crypto.ts       # Cryptography utilities
├── server.js           # Backend Express server
├── App.tsx             # Main React app
├── package.json        # Dependencies
└── README.md           # Documentation
```

### Adding New Features

1. **Frontend Component**
   - Create in `components/` directory
   - Import in `App.tsx`
   - Add to navigation if needed

2. **Backend Endpoint**
   - Add route in `server.js`
   - Update frontend to call new endpoint
   - Test with curl or Postman

### Testing Backend API

**Health Check**
```bash
curl http://localhost:3001/health
```

**Fetch Certificate Chain**
```bash
curl -X POST http://localhost:3001/api/fetch-chain \
  -H "Content-Type: application/json" \
  -d '{"hostname":"www.google.com","port":443}'
```

## Support

For issues or questions:
1. Check this setup guide
2. Review the main README.md
3. Check the browser console for errors
4. Check the backend terminal for server errors
5. Open an issue on GitHub

## License

MIT License - See LICENSE file for details