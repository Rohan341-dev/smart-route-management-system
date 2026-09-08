#!/bin/bash
set -e

DOMAIN="sms.codenestnep.com"
REMOTE_USER="codenest"
REMOTE_PATH="/home/codenest/sms.codenestnep.com"
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

# Step 2: Deploy via SCP
echo "[2/3] Deploying to $DOMAIN..."
echo "  Source: $LOCAL_DIST/"
echo "  Target: $REMOTE_USER@$DOMAIN:$REMOTE_PATH/"
echo ""

# Create remote directory if it doesn't exist
ssh "$REMOTE_USER@$DOMAIN" "mkdir -p $REMOTE_PATH/assets $REMOTE_PATH/models"

# Upload files
scp dist/index.html dist/vite.svg "$REMOTE_USER@$DOMAIN:$REMOTE_PATH/"
scp dist/assets/* "$REMOTE_USER@$DOMAIN:$REMOTE_PATH/assets/"
scp dist/models/* "$REMOTE_USER@$DOMAIN:$REMOTE_PATH/models/"

# Upload .htaccess
cat << HTACCESS | ssh "$REMOTE_USER@$DOMAIN" "cat > $REMOTE_PATH/.htaccess"
RewriteEngine On

# SPA routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]

# Cache static assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>
HTACCESS

echo ""
echo "[3/3] Verifying deployment..."
echo "  Index: $(curl -s -o /dev/null -w '%{http_code}' https://$DOMAIN/)"
echo "  Assets: $(curl -s -o /dev/null -w '%{http_code}' https://$DOMAIN/assets/index-BW0CZD-A.js)"
echo ""
echo "=========================================="
echo "  Deployed successfully!"
echo "  https://$DOMAIN"
echo "=========================================="
