#!/bin/bash

# Fix permissions for nginx to access the dist directory

echo "🔧 Fixing permissions for nginx..."

# Make home directory executable for nginx
chmod 755 /home/ubuntu

# Make certmaster directory accessible
chmod 755 /home/ubuntu/certmaster

# Make dist directory and all contents readable by nginx
chmod -R 755 /home/ubuntu/certmaster/dist

# Verify permissions
echo "✓ Permissions set:"
ls -la /home/ubuntu/ | grep certmaster
ls -la /home/ubuntu/certmaster/ | grep dist

echo ""
echo "✓ Testing nginx configuration..."
sudo nginx -t

echo ""
echo "✓ Restarting nginx..."
sudo systemctl restart nginx

echo ""
echo "✅ Done! Try accessing https://ibmcertlab.cops.webmethods.io again"

# Made with Bob
