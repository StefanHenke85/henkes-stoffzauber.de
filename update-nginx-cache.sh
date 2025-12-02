#!/bin/bash

# Nginx Cache Optimization Script

echo "🔧 Updating Nginx Cache Configuration..."

# Backup current config
ssh root@81.7.11.191 "cp /etc/nginx/sites-available/henkes-stoffzauber.de /etc/nginx/sites-available/henkes-stoffzauber.de.backup-$(date +%Y%m%d)"

# Update nginx config with improved caching
ssh root@81.7.11.191 "cat > /etc/nginx/sites-available/henkes-stoffzauber.de << 'EOFNGINX'
# HTTP → HTTPS Redirect
server {
    listen 80;
    server_name henkes-stoffzauber.de www.henkes-stoffzauber.de;

    # Redirect all HTTP to HTTPS
    return 301 https://\$host\$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name henkes-stoffzauber.de www.henkes-stoffzauber.de;

    # SSL Certificate (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/henkes-stoffzauber.de/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/henkes-stoffzauber.de/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/henkes-stoffzauber.de/chain.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;

    # Static uploads served directly (must come before /api)
    location /api/uploads {
        alias /var/www/henkes-stoffzauber.de/api/uploads;
        expires 1y;
        add_header Cache-Control \"public, immutable\";

        # Security: only allow image files
        location ~* \.(jpg|jpeg|png|gif|webp|svg)$ {
            try_files \$uri =404;
        }
    }

    # API Requests
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Bilder aus API-Upload-Ordner
    location /uploads/ {
        alias /var/www/henkes-stoffzauber.de/api/uploads/;
        expires 1y;
        add_header Cache-Control \"public, immutable\";
    }

    # Rechnungen (nur für interne Nutzung)
    location /invoices/ {
        alias /var/www/henkes-stoffzauber.de/api/invoices/;
        internal;
    }

    # Health Check
    location /health {
        proxy_pass http://localhost:3001;
        access_log off;
    }

    # Frontend (React SPA)
    location / {
        root /var/www/henkes-stoffzauber.de/web/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;

        # HTML - no cache (always fresh)
        location = /index.html {
            add_header Cache-Control \"no-cache, must-revalidate\";
            add_header X-Content-Type-Options \"nosniff\" always;
        }

        # Cache für statische Assets (JS, CSS, Fonts)
        location ~* \.(js|css|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control \"public, immutable\";
        }

        # Bilder
        location ~* \.(jpg|jpeg|png|gif|ico|webp|svg)$ {
            expires 1y;
            add_header Cache-Control \"public, immutable\";
        }

        # PWA Assets - no cache for dynamic updates
        location ~* (manifest\.json|sw\.js)$ {
            add_header Cache-Control \"no-cache, must-revalidate\";
        }
    }
}
EOFNGINX
"

# Test nginx config
echo "✅ Testing nginx configuration..."
ssh root@81.7.11.191 "nginx -t"

if [ $? -eq 0 ]; then
    echo "✅ Configuration valid. Reloading nginx..."
    ssh root@81.7.11.191 "systemctl reload nginx"
    echo "✅ Nginx cache headers updated successfully!"
else
    echo "❌ Nginx configuration error. Restoring backup..."
    ssh root@81.7.11.191 "cp /etc/nginx/sites-available/henkes-stoffzauber.de.backup-$(date +%Y%m%d) /etc/nginx/sites-available/henkes-stoffzauber.de"
fi
