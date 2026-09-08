#!/bin/bash
set -e

DOMAIN="sms.codenestnep.com"
REMOTE_USER="codenest"
REMOTE_PATH="/home/codenest/public_html/sms"
LOCAL_DIST="./dist"

echo "=========================================="
echo "  Smart Route Management System Deploy"
echo "  Target: $DOMAIN"
echo "=========================================="
echo ""

# Step 1: Build
echo "[1/3] Building frontend..."
npm run build
echo "✅ Build complete"
echo ""

# Step 2: Copy .htaccess to dist
cp -f .htaccess "$LOCAL_DIST/.htaccess" 2>/dev/null || true

# Step 3: Deploy via SCP
echo "[2/3] Deploying to $DOMAIN..."
echo "  Source: $LOCAL_DIST/"
echo "  Target: $REMOTE_USER@$DOMAIN:$REMOTE_PATH/"
echo ""

# Create remote directory if it doesn't exist
ssh "$REMOTE_USER@$DOMAIN" "mkdir -p $REMOTE_PATH" 2>/dev/null || true

# Upload all files
scp -r "$LOCAL_DIST"/* "$REMOTE_USER@$DOMAIN:$REMOTE_PATH/"

echo ""
echo "[3/3] Verifying deployment..."
ssh "$REMOTE_USER@$DOMAIN" "ls -la $REMOTE_PATH/ && echo '---' && du -sh $REMOTE_PATH/"

echo ""
echo "=========================================="
echo "  Deployed successfully!"
echo "  https://$DOMAIN"
echo "=========================================="
