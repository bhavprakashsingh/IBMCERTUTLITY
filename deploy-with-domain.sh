#!/bin/bash

# CertMaster EC2 Deployment Script with Custom Domain
# Domain: ibmcertlab.cops.webmethods.io

set -e  # Exit on error

echo "🚀 Starting CertMaster Deployment with Custom Domain..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/home/ubuntu/certmaster"
NGINX_CONF="/etc/nginx/sites-available/certmaster"
NGINX_ENABLED="/etc/nginx/sites-enabled/certmaster"
DOMAIN="ibmcertlab.cops.webmethods.io"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    print_error "Please do not run as root. Run as ubuntu user."
    exit 1
fi

# Update system packages
print_status "Updating system packages..."
sudo apt-get update

# Install Node.js if not installed
if ! command -v node &> /dev/null; then
    print_status "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    print_status "Node.js already installed: $(node --version)"
fi

# Install nginx if not installed
if ! command -v nginx &> /dev/null; then
    print_status "Installing nginx..."
    sudo apt-get install -y nginx
else
    print_status "Nginx already installed"
fi

# Install PM2 globally if not installed
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2..."
    sudo npm install -g pm2
else
    print_status "PM2 already installed"
fi

# Install Certbot for SSL certificates
if ! command -v certbot &> /dev/null; then
    print_status "Installing Certbot for SSL certificates..."
    sudo apt-get install -y certbot python3-certbot-nginx
else
    print_status "Certbot already installed"
fi

# Create app directory if it doesn't exist
if [ ! -d "$APP_DIR" ]; then
    print_status "Creating application directory..."
    mkdir -p "$APP_DIR"
fi

# Navigate to app directory
cd "$APP_DIR"

# Create production environment file
print_status "Creating production environment file..."
cat > .env.production << EOF
PORT=3001
NODE_ENV=production
VITE_API_URL=https://${DOMAIN}
EOF

# Install dependencies
print_status "Installing Node.js dependencies..."
npm install --production

# Build frontend with production environment
print_status "Building frontend for production..."
npm run build

# Create logs directory
mkdir -p logs

# Setup nginx configuration for domain
print_status "Configuring nginx for domain: ${DOMAIN}..."
sudo cp nginx-domain.conf "$NGINX_CONF"

# Enable nginx site
if [ ! -L "$NGINX_ENABLED" ]; then
    sudo ln -s "$NGINX_CONF" "$NGINX_ENABLED"
fi

# Remove default nginx site if exists
if [ -L "/etc/nginx/sites-enabled/default" ]; then
    sudo rm /etc/nginx/sites-enabled/default
fi

# Test nginx configuration
print_status "Testing nginx configuration..."
sudo nginx -t

# Restart nginx
print_status "Restarting nginx..."
sudo systemctl restart nginx
sudo systemctl enable nginx

# Start backend with PM2
print_status "Starting backend with PM2..."
pm2 delete certmaster-backend 2>/dev/null || true
pm2 start server.js --name certmaster-backend
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu

# Configure firewall
print_status "Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Display DNS configuration instructions
echo ""
echo "=========================================="
echo -e "${GREEN}✓ Initial Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo -e "${BLUE}📋 IMPORTANT: DNS Configuration Required${NC}"
echo ""
echo "Before obtaining SSL certificate, you MUST configure DNS:"
echo ""
echo "1. Go to your DNS provider (cops.webmethods.io DNS management)"
echo "2. Add an A record:"
echo "   - Type: A"
echo "   - Name: ibmcertlab"
echo "   - Value: $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo "   - TTL: 3600 (or default)"
echo ""
echo "3. Wait 5-10 minutes for DNS propagation"
echo "4. Verify DNS is working:"
echo "   nslookup ${DOMAIN}"
echo ""
echo -e "${YELLOW}⚠️  Once DNS is configured, run the SSL setup:${NC}"
echo "   sudo certbot --nginx -d ${DOMAIN}"
echo ""
echo "=========================================="
echo ""
echo "📊 Current Status:"
echo "  - Backend running: pm2 status"
echo "  - Nginx running: sudo systemctl status nginx"
echo "  - Domain: ${DOMAIN}"
echo "  - EC2 IP: $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo ""
echo "📝 Useful Commands:"
echo "  - View backend logs: pm2 logs certmaster-backend"
echo "  - Restart backend: pm2 restart certmaster-backend"
echo "  - Check nginx: sudo systemctl status nginx"
echo "  - View nginx logs: sudo tail -f /var/log/nginx/error.log"
echo ""

# Made with Bob
