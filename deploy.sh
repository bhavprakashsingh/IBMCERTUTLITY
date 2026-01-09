#!/bin/bash

# CertMaster EC2 Deployment Script
# This script automates the deployment process on EC2

set -e  # Exit on error

echo "🚀 Starting CertMaster Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/home/ubuntu/certmaster"
NGINX_CONF="/etc/nginx/sites-available/certmaster"
NGINX_ENABLED="/etc/nginx/sites-enabled/certmaster"

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

# Create app directory if it doesn't exist
if [ ! -d "$APP_DIR" ]; then
    print_status "Creating application directory..."
    mkdir -p "$APP_DIR"
fi

# Navigate to app directory
cd "$APP_DIR"

# Install dependencies
print_status "Installing Node.js dependencies..."
npm install --production

# Build frontend
print_status "Building frontend..."
npm run build

# Create logs directory
mkdir -p logs

# Setup nginx configuration
print_status "Configuring nginx..."
sudo cp nginx.conf "$NGINX_CONF"

# Get EC2 public IP
EC2_PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
print_status "EC2 Public IP: $EC2_PUBLIC_IP"

# Update nginx config with actual IP
sudo sed -i "s/your-ec2-public-ip-or-domain/$EC2_PUBLIC_IP/g" "$NGINX_CONF"

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

# Display status
echo ""
echo "=========================================="
echo -e "${GREEN}✓ Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo "🌐 Application URL: http://$EC2_PUBLIC_IP"
echo "🔍 Health Check: http://$EC2_PUBLIC_IP/health"
echo ""
echo "📊 Useful Commands:"
echo "  - View backend logs: pm2 logs certmaster-backend"
echo "  - Restart backend: pm2 restart certmaster-backend"
echo "  - Check nginx status: sudo systemctl status nginx"
echo "  - View nginx logs: sudo tail -f /var/log/nginx/error.log"
echo ""
echo "⚠️  Important: Update your EC2 Security Group to allow:"
echo "  - Port 80 (HTTP) from 0.0.0.0/0"
echo "  - Port 443 (HTTPS) from 0.0.0.0/0"
echo "  - Port 22 (SSH) from your IP"
echo ""

# Made with Bob
