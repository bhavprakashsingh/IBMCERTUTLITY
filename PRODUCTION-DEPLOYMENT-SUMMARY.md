# CertMaster - Production Deployment Summary

## 🎯 Overview

Your CertMaster application has been configured for production deployment on AWS EC2. All necessary files and configurations have been created to make your app accessible over the internet.

## 📦 What Was Created

### 1. Configuration Files
- **`.env.example`** - Environment variables template
- **`config.ts`** - Centralized API endpoint configuration
- **`vite.config.ts`** - Updated to support environment variables

### 2. Deployment Files
- **`deploy.sh`** - Automated deployment script
- **`nginx.conf`** - Nginx reverse proxy configuration
- **`ecosystem.config.js`** - PM2 process manager configuration
- **`certmaster-backend.service`** - Systemd service file (alternative to PM2)

### 3. Documentation
- **`EC2-DEPLOYMENT-GUIDE.md`** - Complete step-by-step deployment guide

## 🚀 Quick Start Deployment

### Step 1: Launch EC2 Instance
1. Go to AWS EC2 Console
2. Launch Ubuntu 22.04 LTS instance (t2.micro or t2.small)
3. Configure Security Group:
   - Port 22 (SSH) - Your IP
   - Port 80 (HTTP) - 0.0.0.0/0
   - Port 443 (HTTPS) - 0.0.0.0/0

### Step 2: Upload Files to EC2
```bash
# Option A: Using Git
ssh -i "your-key.pem" ubuntu@your-ec2-ip
cd /home/ubuntu
git clone https://github.com/your-repo/certmaster.git
cd certmaster

# Option B: Using SCP
scp -i "your-key.pem" -r /path/to/certmaster ubuntu@your-ec2-ip:/home/ubuntu/
```

### Step 3: Run Deployment Script
```bash
cd /home/ubuntu/certmaster
chmod +x deploy.sh
./deploy.sh
```

The script will automatically:
- ✅ Install Node.js, Nginx, and PM2
- ✅ Install dependencies
- ✅ Build the frontend
- ✅ Configure Nginx
- ✅ Start the backend
- ✅ Configure firewall

### Step 4: Access Your Application
Open browser: `http://your-ec2-public-ip`

## 🔧 Architecture

```
Internet → AWS Security Group → EC2 Instance
                                    ↓
                                  Nginx (Port 80)
                                    ↓
                    ┌───────────────┴───────────────┐
                    ↓                               ↓
            Static Files                    Node.js Backend
         (Frontend - /dist)                  (Port 3001)
```

## 🌐 How It Works

### Frontend (React + Vite)
- Built into static files in `/dist` folder
- Served directly by Nginx
- Uses environment variable `VITE_API_URL` to connect to backend

### Backend (Node.js + Express)
- Runs on port 3001
- Managed by PM2 process manager
- Auto-restarts on failure
- Proxied through Nginx

### Nginx Configuration
- Serves frontend static files
- Proxies `/api/*` requests to backend
- Handles `/health` endpoint
- Enables gzip compression
- Sets security headers

## 📝 Environment Variables

### For Development (Local)
Create `.env` file:
```bash
VITE_API_URL=http://localhost:3001
```

### For Production (EC2)
The deployment script automatically configures:
```bash
VITE_API_URL=http://your-ec2-public-ip:3001
```

Or for custom domain:
```bash
VITE_API_URL=https://api.yourdomain.com
```

## 🔐 Optional: Add SSL Certificate

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get SSL certificate (requires domain name)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## 📊 Management Commands

### Backend (PM2)
```bash
pm2 logs certmaster-backend    # View logs
pm2 restart certmaster-backend # Restart
pm2 stop certmaster-backend    # Stop
pm2 status                      # Check status
```

### Nginx
```bash
sudo systemctl status nginx     # Check status
sudo systemctl restart nginx    # Restart
sudo nginx -t                   # Test config
```

### View Logs
```bash
# Backend logs
pm2 logs certmaster-backend

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

## 🔄 Update Application

```bash
cd /home/ubuntu/certmaster
git pull origin main
npm install
npm run build
pm2 restart certmaster-backend
sudo systemctl restart nginx
```

## 💰 Cost Estimate

### AWS EC2 (us-east-1)
- **t2.micro**: ~$8.50/month (Free tier: 750 hours/month for 12 months)
- **t2.small**: ~$17/month
- **Data Transfer**: First 100 GB/month free
- **Storage**: $0.10/GB-month (20 GB = $2/month)

**Total**: $10-20/month (after free tier)

## 🆘 Troubleshooting

### Cannot access application
1. Check Security Group allows port 80
2. Check Nginx: `sudo systemctl status nginx`
3. Check backend: `pm2 status`

### 502 Bad Gateway
1. Backend not running: `pm2 restart certmaster-backend`
2. Check logs: `pm2 logs certmaster-backend`

### Application slow
1. Check resources: `htop`, `free -h`
2. Consider upgrading instance type

## 📚 Additional Resources

- **Full Guide**: See `EC2-DEPLOYMENT-GUIDE.md`
- **Nginx Config**: See `nginx.conf`
- **PM2 Config**: See `ecosystem.config.js`
- **Deployment Script**: See `deploy.sh`

## ✅ Checklist

Before going live:
- [ ] EC2 instance launched with correct security group
- [ ] Files uploaded to `/home/ubuntu/certmaster`
- [ ] Deployment script executed successfully
- [ ] Application accessible at `http://your-ec2-ip`
- [ ] Health check working: `http://your-ec2-ip/health`
- [ ] All features tested (Cert Lab, Key Matcher, Domain Intel, Commands)
- [ ] (Optional) Domain name configured
- [ ] (Optional) SSL certificate installed
- [ ] Monitoring set up (CloudWatch, PM2 monitoring)

## 🎉 Success!

Your CertMaster application is now production-ready and can be accessed over the internet!

**Next Steps:**
1. Test all features thoroughly
2. Set up monitoring and alerts
3. Configure automated backups
4. Consider adding a custom domain
5. Install SSL certificate for HTTPS

---

**Need Help?** Refer to `EC2-DEPLOYMENT-GUIDE.md` for detailed instructions and troubleshooting.