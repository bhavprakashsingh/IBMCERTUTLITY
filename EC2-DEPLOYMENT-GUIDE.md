# CertMaster - EC2 Deployment Guide

This guide will help you deploy the CertMaster SSL/TLS Toolkit on an AWS EC2 instance and make it accessible over the internet.

## Prerequisites

- AWS Account with EC2 access
- Basic knowledge of SSH and Linux commands
- Domain name (optional, but recommended for production)

## Step 1: Launch EC2 Instance

### 1.1 Create EC2 Instance
1. Go to AWS EC2 Console
2. Click "Launch Instance"
3. Configure:
   - **Name**: `certmaster-app`
   - **AMI**: Ubuntu Server 22.04 LTS (Free tier eligible)
   - **Instance Type**: `t2.micro` (minimum) or `t2.small` (recommended)
   - **Key Pair**: Create new or use existing (save the .pem file)
   - **Storage**: 20 GB gp3 (minimum)

### 1.2 Configure Security Group
Create/Edit security group with these inbound rules:

| Type  | Protocol | Port Range | Source    | Description           |
|-------|----------|------------|-----------|-----------------------|
| SSH   | TCP      | 22         | Your IP   | SSH access            |
| HTTP  | TCP      | 80         | 0.0.0.0/0 | Web application       |
| HTTPS | TCP      | 443        | 0.0.0.0/0 | Secure web (optional) |

### 1.3 Launch and Note Details
- Launch the instance
- Note down the **Public IPv4 address** (e.g., 54.123.45.67)
- Wait for instance state to be "Running"

## Step 2: Connect to EC2 Instance

### 2.1 SSH Connection (Windows)
```bash
# Using PowerShell or Command Prompt
ssh -i "your-key.pem" ubuntu@your-ec2-public-ip
```

### 2.2 SSH Connection (Mac/Linux)
```bash
# Set correct permissions for key file
chmod 400 your-key.pem

# Connect to instance
ssh -i "your-key.pem" ubuntu@your-ec2-public-ip
```

## Step 3: Upload Application Files

### Option A: Using Git (Recommended)
```bash
# On EC2 instance
cd /home/ubuntu
git clone https://github.com/your-username/certmaster.git
cd certmaster
```

### Option B: Using SCP (Secure Copy)
```bash
# From your local machine
scp -i "your-key.pem" -r /path/to/certmaster ubuntu@your-ec2-public-ip:/home/ubuntu/
```

### Option C: Using SFTP Client
Use tools like FileZilla, WinSCP, or Cyberduck:
- Host: your-ec2-public-ip
- Username: ubuntu
- Key file: your-key.pem
- Upload entire project folder to `/home/ubuntu/certmaster`

## Step 4: Run Deployment Script

### 4.1 Make Script Executable
```bash
cd /home/ubuntu/certmaster
chmod +x deploy.sh
```

### 4.2 Run Deployment
```bash
./deploy.sh
```

The script will automatically:
- ✅ Install Node.js 20.x
- ✅ Install Nginx web server
- ✅ Install PM2 process manager
- ✅ Install application dependencies
- ✅ Build the frontend
- ✅ Configure Nginx as reverse proxy
- ✅ Start the backend API
- ✅ Configure firewall rules
- ✅ Set up auto-restart on reboot

### 4.3 Verify Deployment
After deployment completes, you'll see:
```
========================================
✓ Deployment Complete!
========================================

🌐 Application URL: http://54.123.45.67
🔍 Health Check: http://54.123.45.67/health
```

## Step 5: Access Your Application

### 5.1 Open in Browser
Navigate to: `http://your-ec2-public-ip`

You should see the CertMaster application running!

### 5.2 Test Health Check
Navigate to: `http://your-ec2-public-ip/health`

Should return:
```json
{
  "status": "ok",
  "message": "Certificate chain fetcher is running"
}
```

## Step 6: Configure Domain (Optional)

### 6.1 Point Domain to EC2
1. Go to your domain registrar (GoDaddy, Namecheap, etc.)
2. Add an A record:
   - **Type**: A
   - **Name**: @ (or subdomain like `certmaster`)
   - **Value**: Your EC2 public IP
   - **TTL**: 3600

### 6.2 Update Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/certmaster
```

Change:
```nginx
server_name your-ec2-public-ip-or-domain;
```

To:
```nginx
server_name yourdomain.com www.yourdomain.com;
```

Restart Nginx:
```bash
sudo systemctl restart nginx
```

### 6.3 Install SSL Certificate (Recommended)
```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow prompts and enter your email
```

Certbot will automatically:
- Obtain SSL certificate from Let's Encrypt
- Configure Nginx for HTTPS
- Set up auto-renewal

## Step 7: Useful Commands

### Backend Management (PM2)
```bash
# View logs
pm2 logs certmaster-backend

# Restart backend
pm2 restart certmaster-backend

# Stop backend
pm2 stop certmaster-backend

# View status
pm2 status

# View monitoring dashboard
pm2 monit
```

### Nginx Management
```bash
# Check status
sudo systemctl status nginx

# Restart nginx
sudo systemctl restart nginx

# View error logs
sudo tail -f /var/log/nginx/error.log

# View access logs
sudo tail -f /var/log/nginx/access.log

# Test configuration
sudo nginx -t
```

### System Management
```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check running processes
htop

# View system logs
sudo journalctl -u certmaster-backend -f
```

## Step 8: Update Application

### 8.1 Pull Latest Changes
```bash
cd /home/ubuntu/certmaster
git pull origin main
```

### 8.2 Rebuild and Restart
```bash
# Install new dependencies
npm install

# Rebuild frontend
npm run build

# Restart backend
pm2 restart certmaster-backend

# Restart nginx
sudo systemctl restart nginx
```

## Troubleshooting

### Issue: Cannot Connect to Application

**Check Security Group:**
```bash
# Verify ports 80 and 443 are open in EC2 Security Group
```

**Check Nginx Status:**
```bash
sudo systemctl status nginx
sudo nginx -t
```

**Check Backend Status:**
```bash
pm2 status
pm2 logs certmaster-backend
```

### Issue: 502 Bad Gateway

**Backend not running:**
```bash
pm2 restart certmaster-backend
pm2 logs certmaster-backend
```

**Check backend port:**
```bash
netstat -tulpn | grep 3001
```

### Issue: Application Slow

**Check resources:**
```bash
htop
df -h
free -h
```

**Consider upgrading instance type:**
- t2.micro → t2.small or t2.medium

### Issue: SSL Certificate Renewal Failed

**Manual renewal:**
```bash
sudo certbot renew --dry-run
sudo certbot renew
```

## Architecture Overview

```
Internet
   ↓
AWS Security Group (Firewall)
   ↓
EC2 Instance (Ubuntu 22.04)
   ↓
Nginx (Port 80/443) ← Reverse Proxy
   ↓
   ├─→ Static Files (Frontend) → /home/ubuntu/certmaster/dist
   └─→ API Requests (/api/*) → Node.js Backend (Port 3001)
```

## Performance Optimization

### 1. Enable Nginx Caching
```nginx
# Add to nginx.conf
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=100m;

location /api/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    # ... rest of config
}
```

### 2. Enable Compression
Already configured in `nginx.conf`:
- Gzip compression for text files
- Static asset caching

### 3. Monitor Performance
```bash
# Install monitoring tools
sudo apt-get install -y htop iotop nethogs

# Monitor in real-time
htop
```

## Security Best Practices

### 1. Keep System Updated
```bash
sudo apt-get update
sudo apt-get upgrade -y
```

### 2. Configure Firewall
```bash
sudo ufw status
sudo ufw enable
```

### 3. Disable Root Login
```bash
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart sshd
```

### 4. Use SSH Keys Only
```bash
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
sudo systemctl restart sshd
```

### 5. Regular Backups
```bash
# Backup application
tar -czf certmaster-backup-$(date +%Y%m%d).tar.gz /home/ubuntu/certmaster

# Backup to S3 (optional)
aws s3 cp certmaster-backup-*.tar.gz s3://your-backup-bucket/
```

## Cost Estimation

### AWS EC2 Costs (us-east-1)
- **t2.micro**: ~$8.50/month (Free tier: 750 hours/month for 12 months)
- **t2.small**: ~$17/month
- **t2.medium**: ~$34/month

### Additional Costs
- **Data Transfer**: First 100 GB/month free, then $0.09/GB
- **EBS Storage**: $0.10/GB-month (20 GB = $2/month)
- **Elastic IP**: Free if attached to running instance

**Total Estimated Cost**: $10-40/month depending on instance type

## Support

For issues or questions:
1. Check application logs: `pm2 logs certmaster-backend`
2. Check nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Review this guide's troubleshooting section
4. Check EC2 instance metrics in AWS Console

## Next Steps

- ✅ Set up domain name and SSL certificate
- ✅ Configure automated backups
- ✅ Set up CloudWatch monitoring
- ✅ Configure auto-scaling (for high traffic)
- ✅ Set up CI/CD pipeline for automated deployments

---

**Congratulations!** Your CertMaster application is now running on EC2 and accessible over the internet! 🎉