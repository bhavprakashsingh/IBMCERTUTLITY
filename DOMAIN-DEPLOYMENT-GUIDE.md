# CertMaster - Domain Deployment Guide
## Deploying to ibmcertlab.cops.webmethods.io

This guide covers deploying CertMaster to your custom domain `ibmcertlab.cops.webmethods.io` with SSL/HTTPS support.

## 📋 Prerequisites

- AWS EC2 instance (Ubuntu 22.04)
- Access to DNS management for `cops.webmethods.io`
- SSH access to EC2 instance
- Domain: `ibmcertlab.cops.webmethods.io`

## 🚀 Deployment Steps

### Step 1: Launch EC2 Instance

1. **Create EC2 Instance**
   - AMI: Ubuntu Server 22.04 LTS
   - Instance Type: t2.small (recommended) or t2.micro
   - Storage: 20 GB

2. **Configure Security Group**
   
   | Type  | Protocol | Port | Source    | Description |
   |-------|----------|------|-----------|-------------|
   | SSH   | TCP      | 22   | Your IP   | SSH access  |
   | HTTP  | TCP      | 80   | 0.0.0.0/0 | HTTP        |
   | HTTPS | TCP      | 443  | 0.0.0.0/0 | HTTPS       |

3. **Note EC2 Public IP**
   - Example: `54.123.45.67`
   - You'll need this for DNS configuration

### Step 2: Configure DNS

**IMPORTANT: Do this BEFORE running the deployment script!**

1. **Access DNS Management**
   - Go to your DNS provider for `cops.webmethods.io`
   - Navigate to DNS records management

2. **Add A Record**
   ```
   Type: A
   Name: ibmcertlab
   Value: <Your EC2 Public IP>
   TTL: 3600 (or default)
   ```

3. **Verify DNS Propagation**
   ```bash
   # Wait 5-10 minutes, then test:
   nslookup ibmcertlab.cops.webmethods.io
   
   # Should return your EC2 IP address
   ```

### Step 3: Upload Files to EC2

**Option A: Using Git (Recommended)**
```bash
# SSH into EC2
ssh -i "your-key.pem" ubuntu@<your-ec2-ip>

# Clone repository
cd /home/ubuntu
git clone https://github.com/your-repo/certmaster.git
cd certmaster
```

**Option B: Using SCP**
```bash
# From your local machine
scp -i "your-key.pem" -r /path/to/certmaster ubuntu@<your-ec2-ip>:/home/ubuntu/
```

### Step 4: Run Deployment Script

```bash
# Make script executable
chmod +x deploy-with-domain.sh

# Run deployment
./deploy-with-domain.sh
```

The script will:
- ✅ Install Node.js, Nginx, PM2, Certbot
- ✅ Create production environment file
- ✅ Install dependencies and build frontend
- ✅ Configure Nginx for your domain
- ✅ Start backend with PM2
- ✅ Configure firewall
- ✅ Display DNS configuration instructions

### Step 5: Obtain SSL Certificate

**After DNS is configured and propagated:**

```bash
# Run Certbot to get SSL certificate
sudo certbot --nginx -d ibmcertlab.cops.webmethods.io

# Follow the prompts:
# 1. Enter your email address
# 2. Agree to terms of service
# 3. Choose whether to redirect HTTP to HTTPS (recommended: Yes)
```

Certbot will:
- Obtain SSL certificate from Let's Encrypt
- Automatically configure Nginx for HTTPS
- Set up auto-renewal (certificates renew every 90 days)

### Step 6: Verify Deployment

1. **Test HTTPS Access**
   ```
   https://ibmcertlab.cops.webmethods.io
   ```

2. **Test Health Check**
   ```
   https://ibmcertlab.cops.webmethods.io/health
   ```

3. **Verify SSL Certificate**
   - Click the padlock icon in browser
   - Check certificate details
   - Should show "Let's Encrypt" as issuer

## 🔧 Configuration Files

### 1. `.env.production`
```bash
PORT=3001
NODE_ENV=production
VITE_API_URL=https://ibmcertlab.cops.webmethods.io
```

### 2. `nginx-domain.conf`
- Configured for `ibmcertlab.cops.webmethods.io`
- HTTP to HTTPS redirect
- SSL/TLS configuration
- Reverse proxy to backend
- Security headers

### 3. `deploy-with-domain.sh`
- Automated deployment script
- Installs all dependencies
- Configures domain and SSL

## 🌐 Architecture

```
Internet
   ↓
DNS (ibmcertlab.cops.webmethods.io)
   ↓
AWS Security Group (Firewall)
   ↓
EC2 Instance
   ↓
Nginx (Ports 80/443)
   ├─ HTTP → HTTPS Redirect
   └─ HTTPS (SSL/TLS)
       ↓
       ├─→ Static Files (/dist)
       └─→ API Proxy → Node.js (Port 3001)
```

## 📊 Management Commands

### Backend (PM2)
```bash
pm2 status                      # Check status
pm2 logs certmaster-backend     # View logs
pm2 restart certmaster-backend  # Restart
pm2 stop certmaster-backend     # Stop
pm2 monit                       # Monitoring dashboard
```

### Nginx
```bash
sudo systemctl status nginx     # Check status
sudo systemctl restart nginx    # Restart
sudo nginx -t                   # Test configuration
sudo tail -f /var/log/nginx/error.log    # Error logs
sudo tail -f /var/log/nginx/access.log   # Access logs
```

### SSL Certificate
```bash
sudo certbot certificates       # View certificates
sudo certbot renew --dry-run    # Test renewal
sudo certbot renew              # Manual renewal
```

## 🔄 Update Application

```bash
cd /home/ubuntu/certmaster

# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Rebuild frontend
npm run build

# Restart backend
pm2 restart certmaster-backend

# Restart nginx (if config changed)
sudo systemctl restart nginx
```

## 🆘 Troubleshooting

### Issue: DNS not resolving

**Check DNS configuration:**
```bash
nslookup ibmcertlab.cops.webmethods.io
dig ibmcertlab.cops.webmethods.io
```

**Solution:**
- Verify A record points to correct EC2 IP
- Wait 5-10 minutes for propagation
- Clear local DNS cache

### Issue: Cannot obtain SSL certificate

**Error: "Domain not pointing to this server"**

**Solution:**
1. Verify DNS is working: `nslookup ibmcertlab.cops.webmethods.io`
2. Ensure port 80 is open in Security Group
3. Check nginx is running: `sudo systemctl status nginx`
4. Try again after DNS propagates

### Issue: 502 Bad Gateway

**Backend not running:**
```bash
pm2 status
pm2 restart certmaster-backend
pm2 logs certmaster-backend
```

### Issue: SSL certificate expired

**Auto-renewal failed:**
```bash
# Test renewal
sudo certbot renew --dry-run

# Force renewal
sudo certbot renew --force-renewal

# Restart nginx
sudo systemctl restart nginx
```

## 🔐 Security Best Practices

### 1. SSL/TLS Configuration
- ✅ TLS 1.2 and 1.3 only
- ✅ Strong cipher suites
- ✅ HSTS enabled
- ✅ Auto-renewal configured

### 2. Firewall Rules
```bash
sudo ufw status
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

### 3. Keep System Updated
```bash
sudo apt-get update
sudo apt-get upgrade -y
```

### 4. Monitor Logs
```bash
# Backend logs
pm2 logs certmaster-backend

# Nginx logs
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u nginx -f
```

## 📈 Performance Optimization

### 1. Enable HTTP/2
Already configured in `nginx-domain.conf`:
```nginx
listen 443 ssl http2;
```

### 2. Gzip Compression
Already enabled for:
- Text files
- JavaScript
- CSS
- JSON

### 3. Static Asset Caching
Configured with 1-year cache for static files

### 4. PM2 Cluster Mode (Optional)
For high traffic, use cluster mode:
```bash
pm2 delete certmaster-backend
pm2 start server.js -i max --name certmaster-backend
pm2 save
```

## 💰 Cost Estimate

### AWS Costs (us-east-1)
- **EC2 t2.small**: ~$17/month
- **Data Transfer**: First 100 GB free, then $0.09/GB
- **EBS Storage**: $0.10/GB-month (20 GB = $2/month)

**Total**: ~$20/month

### SSL Certificate
- **Let's Encrypt**: FREE
- Auto-renewal: FREE

## ✅ Deployment Checklist

- [ ] EC2 instance launched with correct security group
- [ ] DNS A record configured for `ibmcertlab.cops.webmethods.io`
- [ ] DNS propagation verified (5-10 minutes)
- [ ] Files uploaded to `/home/ubuntu/certmaster`
- [ ] Deployment script executed: `./deploy-with-domain.sh`
- [ ] SSL certificate obtained: `sudo certbot --nginx -d ibmcertlab.cops.webmethods.io`
- [ ] HTTPS access verified: `https://ibmcertlab.cops.webmethods.io`
- [ ] Health check working: `https://ibmcertlab.cops.webmethods.io/health`
- [ ] All features tested (Cert Lab, Key Matcher, Domain Intel, Commands)
- [ ] SSL certificate auto-renewal verified: `sudo certbot renew --dry-run`

## 🎉 Success!

Your CertMaster application is now:
- ✅ Deployed to EC2
- ✅ Accessible at `https://ibmcertlab.cops.webmethods.io`
- ✅ Secured with SSL/TLS
- ✅ Auto-renewing certificates
- ✅ Production-ready

## 📞 Support

For issues:
1. Check logs: `pm2 logs certmaster-backend`
2. Check nginx: `sudo tail -f /var/log/nginx/error.log`
3. Verify DNS: `nslookup ibmcertlab.cops.webmethods.io`
4. Check SSL: `sudo certbot certificates`

---

**Deployed with ❤️ by IBM Bob**