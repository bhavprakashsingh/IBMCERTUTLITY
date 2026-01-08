# 🚀 Quick Start Guide - IBMSRE-CertMaster

## Get Started in 3 Steps

### 1️⃣ Install Dependencies
```bash
npm install
```

### 2️⃣ Start the Application
```bash
npm start
```
This starts both frontend (port 5173) and backend (port 3001) servers.

### 3️⃣ Open in Browser
Navigate to: **http://localhost:5173**

---

## 🎯 Try It Out

### Auto-Fetch Certificate Chain (New Feature!)

1. Go to the **Cert Lab** tab
2. In the "Fetch Certificate Chain from Server" section:
   - **Hostname**: `www.google.com`
   - **Port**: `443`
3. Click **"Fetch Certificate Chain"**
4. Watch as the complete certificate chain is automatically retrieved and analyzed!

### Manual Certificate Analysis

1. Paste a PEM certificate chain into the text area
2. Click **"PROCESS CHAIN & ANALYZE"**
3. View detailed information about each certificate

### Match Certificate & Private Key

1. Go to the **Key Matcher** tab
2. Upload or paste your certificate
3. Upload or paste your private key
4. Click **"VERIFY MATCH"**
5. See if they are a matching pair!

---

## 📋 What You Can Do

✅ **Auto-fetch certificate chains** from any server (like Windows Certificate Manager!)  
✅ **Analyze certificates** - View subject, issuer, validity, SAN, key usage  
✅ **Verify certificate chains** - Check if chains are valid  
✅ **Match keys with certificates** - Verify key-certificate pairs  
✅ **Export certificates** - Download individual or all certificates  
✅ **Generate HPKP pins** - For HTTP Public Key Pinning  
✅ **Copy fingerprints** - Quick clipboard access  
✅ **Generate OpenSSL commands** - Command reference tool  

---

## 🔧 Troubleshooting

### Backend Not Starting?
```bash
# Install backend dependencies
npm install express cors

# Start backend separately
npm run server
```

### Frontend Not Loading?
```bash
# Start frontend separately
npm run dev
```

### Need Help?
- Check **SETUP.md** for detailed setup instructions
- Check **README.md** for feature documentation
- Check browser console for errors
- Check terminal for server errors

---

## 🎨 Features Overview

### 🔐 Certificate Lab
- **NEW**: Auto-fetch complete certificate chains from servers
- Parse and analyze certificate chains
- View Subject Alternative Names (SAN)
- Display key usage and extended key usage
- Show basic constraints
- Generate HPKP pins
- Export certificates

### 🔑 Key Matcher
- Verify if a private key matches a certificate
- Support PKCS#8 and PKCS#1 formats
- Visual match/no-match indication
- Modulus comparison display

### 💻 Command Generator
- OpenSSL command reference
- Quick copy commands for common operations

---

## 📚 Next Steps

1. **Read the full documentation**: Check out README.md
2. **Explore all features**: Try each tab and feature
3. **Test with your certificates**: Upload your own certificates
4. **Try the auto-fetch**: Fetch chains from different servers

---

## 🌟 Pro Tips

💡 **Use auto-fetch for quick analysis** - Just enter a hostname!  
💡 **Export all certificates at once** - Use the "Export All" button  
💡 **Copy HPKP pins directly** - Click the copy icon next to pins  
💡 **Verify your key pairs** - Use Key Matcher before deployment  
💡 **Check SAN entries** - Ensure all domains are covered  

---

**Enjoy using IBMSRE-CertMaster! 🎉**