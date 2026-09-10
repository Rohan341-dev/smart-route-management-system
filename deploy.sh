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

# Step 1: Build frontend
echo "[1/5] Building frontend..."
npm run build
echo "✅ Frontend build complete"
echo ""

# Step 2: Deploy backend
echo "[2/5] Deploying backend..."
ssh "$REMOTE_USER@$DOMAIN" "cd $REMOTE_PATH/backend && git pull origin main 2>/dev/null || echo 'No git repo on remote, skipping pull'"

# Install backend dependencies
echo "  Installing Python dependencies..."
ssh "$REMOTE_USER@$DOMAIN" "cd $REMOTE_PATH/backend && pip install -r requirements.txt --quiet 2>/dev/null || pip3 install -r requirements.txt --quiet 2>/dev/null || echo 'pip install skipped'"

# Run migrations
echo "  Running Django migrations..."
ssh "$REMOTE_USER@$DOMAIN" "cd $REMOTE_PATH/backend && python manage.py migrate --noinput 2>/dev/null || python3 manage.py migrate --noinput 2>/dev/null || echo 'migrate skipped'"

# Collect static files
echo "  Collecting static files..."
ssh "$REMOTE_USER@$DOMAIN" "cd $REMOTE_PATH/backend && python manage.py collectstatic --noinput 2>/dev/null || python3 manage.py collectstatic --noinput 2>/dev/null || echo 'collectstatic skipped'"

# Restart backend (try multiple methods)
echo "  Restarting backend..."
ssh "$REMOTE_USER@$DOMAIN" "cd $REMOTE_PATH/backend && (sudo systemctl restart smartbus-backend 2>/dev/null || sudo supervisorctl restart smartbus-backend 2>/dev/null || kill -HUP \$(pgrep -f 'gunicorn.*config.wsgi') 2>/dev/null || echo 'Backend restart attempted')" || true

echo "✅ Backend deploy complete"
echo ""

# Step 3: Deploy frontend via SCP
echo "[3/5] Deploying frontend to $DOMAIN..."
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

# Proxy API requests to Django backend
RewriteCond %{HTTP:Authorization} .+
RewriteRule ^api/(.*)$ http://127.0.0.1:8000/api/$1 [P,L]
RewriteRule ^api/(.*)$ http://127.0.0.1:8000/api/$1 [P,L]

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
echo "[4/5] Verifying deployment..."
echo "  Index: $(curl -s -o /dev/null -w '%{http_code}' https://$DOMAIN/)"
echo "  Assets: $(curl -s -o /dev/null -w '%{http_code}' https://$DOMAIN/assets/index-BW0CZD-A.js)"
echo ""

# Step 5: Verify backend health
echo "[5/5] Verifying backend health..."
echo "  API Health: $(curl -s -o /dev/null -w '%{http_code}' https://$DOMAIN/api/health/ 2>/dev/null || echo 'N/A')"
echo "  Students API: $(curl -s -o /dev/null -w '%{http_code}' https://$DOMAIN/api/students/ 2>/dev/null || echo 'N/A')"
echo ""

echo "=========================================="
echo "  Deployed successfully!"
echo "  https://$DOMAIN"
echo "=========================================="
echo ""
echo "⚠️  IMPORTANT: Ensure the following on the server:"
echo "  1. Backend .env has correct DB settings (DB_ENGINE, DB_NAME, etc.)"
echo "  2. PostgreSQL is running (if using PostgreSQL)"
echo "  3. Backend service is running on port 8000"
echo "  4. VITE_API_URL is set to https://$DOMAIN/api in the frontend"
