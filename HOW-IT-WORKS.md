# 🔐 CertMaster - How It Works

A comprehensive guide to understanding the CertMaster SSL/TLS Toolkit architecture and workflow.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Application Flow](#application-flow)
5. [Key Features Explained](#key-features-explained)
6. [Deployment Architecture](#deployment-architecture)
7. [Security Considerations](#security-considerations)

---

## 🎯 Overview

**CertMaster** is a web-based SSL/TLS certificate management toolkit that helps developers and system administrators:
- Analyze SSL/TLS certificates
- Fetch certificate chains from domains
- Generate OpenSSL commands
- Match private keys with certificates
- Gather domain intelligence

**Live URL:** https://ibmcertlab.cops.webmethods.io

---

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         User Browser                         │
│                  (https://ibmcertlab.cops...)               │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS (443)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Nginx Web Server                        │
│  ┌──────────────────┐         ┌─────────────────────────┐  │
│  │  Static Files    │         │   Reverse Proxy         │  │
│  │  (React App)     │         │   /api/* → :3001        │  │
│  │  from dist/      │         │                         │  │
│  └──────────────────┘         └─────────────────────────┘  │
└────────────────────────────────────┬───────────────────────┘
                                     │
                                     ▼
                    ┌────────────────────────────────┐
                    │   Node.js Backend (PM2)        │
                    │   Express Server on :3001      │
                    │                                │
                    │  • Certificate Analysis        │
                    │  • Chain Fetching             │
                    │  • Key Matching               │
                    │  • Domain Intelligence        │
                    └────────────────────────────────┘
```

### Component Breakdown

#### 1. **Frontend (React + TypeScript)**
- **Location:** `dist/` directory (built from source)
- **Framework:** React 19 with TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Build Tool:** Vite

#### 2. **Backend (Node.js + Express)**
- **Location:** `server.js`
- **Runtime:** Node.js 20
- **Framework:** Express.js
- **Process Manager:** PM2 (keeps it running 24/7)
- **Port:** 3001 (internal, not exposed to internet)

#### 3. **Web Server (Nginx)**
- **Purpose:** 
  - Serves static frontend files
  - Reverse proxy for backend API
  - SSL/TLS termination
  - Security headers
- **Port:** 443 (HTTPS), 80 (HTTP redirect)

---

## 🛠️ Technology Stack

### Frontend Technologies
```
React 19.2.3          → UI Framework
TypeScript 5.8.2      → Type Safety
Vite 6.2.0           → Build Tool & Dev Server
Tailwind CSS         → Styling (via CDN)
Lucide React 0.562.0 → Icons
```

### Backend Technologies
```
Node.js 20           → Runtime Environment
Express 4.18.2       → Web Framework
node-forge 1.3.3     → Cryptography (cert parsing, key matching)
cors 2.8.5           → Cross-Origin Resource Sharing
```

### Infrastructure
```
Nginx                → Web Server & Reverse Proxy
PM2                  → Process Manager
Let's Encrypt        → SSL Certificates (via Certbot)
Ubuntu 22.04 LTS     → Operating System
AWS EC2              → Cloud Hosting
```

---

## 🔄 Application Flow

### 1. User Accesses the Application

```
User → https://ibmcertlab.cops.webmethods.io
       ↓
Nginx receives request on port 443 (HTTPS)
       ↓
Nginx serves index.html from dist/
       ↓
Browser loads React application
       ↓
React app initializes with 5 main tools
```

### 2. Certificate Analysis Flow

```
User uploads certificate file (.crt, .pem, .cer)
       ↓
Frontend reads file content
       ↓
POST /api/analyze-cert
       ↓
Backend (server.js) receives certificate
       ↓
node-forge parses certificate
       ↓
Extracts: Subject, Issuer, Validity, SANs, Key Usage, etc.
       ↓
Returns JSON response
       ↓
Frontend displays formatted certificate details
```

### 3. Chain Fetcher Flow

```
User enters domain name (e.g., google.com)
       ↓
POST /api/fetch-chain
       ↓
Backend connects to domain:443 via TLS
       ↓
Retrieves full certificate chain
       ↓
Parses each certificate in chain
       ↓
Returns array of certificates (leaf → intermediate → root)
       ↓
Frontend displays chain with download options
```

### 4. Command Generator Flow

```
User selects command type (e.g., "View Certificate")
       ↓
User fills in parameters (file paths, domains, etc.)
       ↓
Frontend generates OpenSSL command
       ↓
Displays command with copy button
       ↓
User copies and runs in their terminal
```

### 5. Key Matcher Flow

```
User uploads private key (.key, .pem)
User uploads certificate (.crt, .pem)
       ↓
POST /api/match-key
       ↓
Backend extracts public key from certificate
Backend extracts public key from private key
       ↓
Compares modulus values
       ↓
Returns match result (true/false)
       ↓
Frontend shows success or error message
```

### 6. Domain Intelligence Flow

```
User enters domain name
       ↓
POST /api/domain-intel
       ↓
Backend performs multiple checks:
  • DNS resolution
  • WHOIS lookup
  • SSL certificate check
  • HTTP/HTTPS availability
  • Security headers analysis
       ↓
Returns comprehensive domain report
       ↓
Frontend displays organized intelligence data
```

---

## 🎨 Key Features Explained

### 1. **CertLab (Certificate Analysis)**

**Purpose:** Analyze SSL/TLS certificates to understand their properties

**How it works:**
- Uses `node-forge` library to parse X.509 certificates
- Extracts metadata: subject, issuer, validity dates, extensions
- Validates certificate structure
- Displays in human-readable format

**Use cases:**
- Verify certificate details before deployment
- Troubleshoot certificate issues
- Understand certificate properties

### 2. **ChainFetcher (Certificate Chain Retrieval)**

**Purpose:** Download complete certificate chains from live domains

**How it works:**
- Establishes TLS connection to target domain
- Retrieves peer certificate and chain
- Parses each certificate in the chain
- Provides individual and bundle downloads

**Use cases:**
- Get intermediate certificates for server configuration
- Verify certificate chain completeness
- Backup certificate chains

### 3. **CommandGen (OpenSSL Command Generator)**

**Purpose:** Generate OpenSSL commands without memorizing syntax

**How it works:**
- Provides templates for common OpenSSL operations
- Dynamically builds commands based on user input
- Includes parameter validation
- One-click copy to clipboard

**Use cases:**
- Generate CSRs (Certificate Signing Requests)
- Convert certificate formats
- Verify certificates and keys
- Create self-signed certificates

### 4. **KeyMatcher (Private Key Verification)**

**Purpose:** Verify if a private key matches a certificate

**How it works:**
- Extracts public key from certificate
- Extracts public key from private key
- Compares modulus values (RSA) or public points (EC)
- Returns match/mismatch result

**Use cases:**
- Verify correct key-certificate pairing before deployment
- Troubleshoot SSL configuration issues
- Prevent deployment of mismatched keys

### 5. **DomainIntel (Domain Intelligence)**

**Purpose:** Gather comprehensive information about a domain

**How it works:**
- DNS resolution (A, AAAA, MX, TXT records)
- WHOIS lookup (registrar, creation date, expiry)
- SSL certificate analysis
- HTTP/HTTPS availability check
- Security headers inspection

**Use cases:**
- Pre-deployment domain verification
- Security auditing
- Troubleshooting connectivity issues
- Domain ownership verification

---

## 🚀 Deployment Architecture

### Production Setup on AWS EC2

```
┌─────────────────────────────────────────────────────────┐
│                    AWS EC2 Instance                      │
│                  Ubuntu 22.04 LTS                        │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │              Nginx (Port 443/80)                │    │
│  │  • SSL Termination (Let's Encrypt)             │    │
│  │  • Static File Serving                         │    │
│  │  • Reverse Proxy                               │    │
│  └────────────────┬───────────────────────────────┘    │
│                   │                                      │
│  ┌────────────────▼───────────────────────────────┐    │
│  │         PM2 Process Manager                     │    │
│  │  ┌──────────────────────────────────────┐      │    │
│  │  │  Node.js Backend (server.js)         │      │    │
│  │  │  Port: 3001                          │      │    │
│  │  │  • Auto-restart on crash             │      │    │
│  │  │  • Log management                    │      │    │
│  │  │  • Startup on boot                   │      │    │
│  │  └──────────────────────────────────────┘      │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  File Structure:                                         │
│  /home/ubuntu/IBMcert/new/IBMCERTUTLITY/                │
│  ├── dist/              (Frontend build)                │
│  ├── server.js          (Backend)                       │
│  ├── package.json       (Dependencies)                  │
│  └── .env.production    (Environment vars)              │
└─────────────────────────────────────────────────────────┘
```

### Request Flow in Production

1. **User Request:** `https://ibmcertlab.cops.webmethods.io/`
   - DNS resolves to EC2 public IP
   - Request hits Nginx on port 443

2. **Nginx Processing:**
   - SSL/TLS handshake using Let's Encrypt certificate
   - Checks request path:
     - `/` → Serve from `dist/index.html`
     - `/api/*` → Proxy to `localhost:3001`
     - Static assets → Serve from `dist/assets/`

3. **Backend Processing (if API call):**
   - PM2-managed Node.js process receives request
   - Express routes handle the request
   - Business logic executes (cert analysis, chain fetch, etc.)
   - Response sent back through Nginx

4. **Response to User:**
   - Nginx adds security headers
   - Gzip compression applied
   - Response sent to browser

---

## 🔒 Security Considerations

### 1. **SSL/TLS Configuration**
```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers HIGH:!aNULL:!MD5;
ssl_prefer_server_ciphers on;
```
- Only modern TLS versions
- Strong cipher suites
- Server cipher preference

### 2. **Security Headers**
```nginx
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
```
- Prevents clickjacking
- Prevents MIME sniffing
- XSS protection
- Forces HTTPS

### 3. **CORS Configuration**
```javascript
cors({
  origin: process.env.VITE_API_URL,
  credentials: true
})
```
- Restricts API access to frontend domain
- Prevents unauthorized cross-origin requests

### 4. **Input Validation**
- Certificate format validation
- Domain name sanitization
- File size limits
- Content type verification

### 5. **Process Isolation**
- Backend runs as non-root user
- PM2 manages process lifecycle
- Nginx runs with minimal privileges

---

## 📊 Performance Optimizations

### 1. **Frontend Optimizations**
- **Code Splitting:** Vite automatically splits code
- **Asset Caching:** 1-year cache for static assets
- **Gzip Compression:** Reduces transfer size by ~70%
- **CDN for Libraries:** Tailwind CSS loaded from CDN

### 2. **Backend Optimizations**
- **Connection Pooling:** Reuses TLS connections
- **Async Operations:** Non-blocking I/O
- **Error Handling:** Graceful degradation
- **Timeout Management:** Prevents hanging requests

### 3. **Nginx Optimizations**
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
expires 1y;  # for static assets
```

---

## 🔧 Maintenance & Monitoring

### Logs Location
```bash
# Backend logs
pm2 logs certmaster-backend

# Nginx access logs
/var/log/nginx/access.log

# Nginx error logs
/var/log/nginx/error.log

# System logs
journalctl -u nginx
```

### Health Checks
```bash
# Check backend status
pm2 status

# Check nginx status
sudo systemctl status nginx

# Test nginx config
sudo nginx -t

# Check SSL certificate expiry
sudo certbot certificates
```

### Common Operations
```bash
# Restart backend
pm2 restart certmaster-backend

# Restart nginx
sudo systemctl restart nginx

# Renew SSL certificate
sudo certbot renew

# View real-time logs
pm2 logs certmaster-backend --lines 100
```

---

## 🎓 Summary

**CertMaster** is a full-stack web application that:

1. **Frontend:** React SPA served as static files by Nginx
2. **Backend:** Node.js API handling certificate operations
3. **Infrastructure:** Nginx reverse proxy with SSL termination
4. **Deployment:** PM2-managed processes on AWS EC2
5. **Security:** HTTPS, security headers, input validation

**Key Strengths:**
- ✅ No client-side certificate processing (security)
- ✅ Scalable architecture (can add load balancer)
- ✅ Reliable (PM2 auto-restart, nginx stability)
- ✅ Secure (HTTPS, modern TLS, security headers)
- ✅ Fast (static file serving, gzip, caching)

**Perfect for:**
- DevOps engineers managing SSL certificates
- System administrators troubleshooting TLS issues
- Developers learning about SSL/TLS
- Security teams auditing certificate configurations

---

## 📚 Additional Resources

- **OpenSSL Documentation:** https://www.openssl.org/docs/
- **Let's Encrypt:** https://letsencrypt.org/
- **Node-Forge Library:** https://github.com/digitalbazaar/forge
- **Nginx Documentation:** https://nginx.org/en/docs/

---

**Made with ❤️ by IBM SRE Team**

*Last Updated: January 2026*