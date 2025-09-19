#!/bin/bash

echo "🚀 Setting up iDoze for production access..."

# Stop current containers
echo "📦 Stopping current containers..."
sudo docker compose down

# Open HTTP port in firewall (port 80)
echo "🔥 Configuring firewall for HTTP access..."
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --reload

# Add iptables rule for port 80
sudo iptables -I INPUT 1 -p tcp --dport 80 -j ACCEPT

# Start production setup with nginx reverse proxy
echo "🌐 Starting production containers with nginx reverse proxy..."
sudo docker compose -f docker-compose.prod.yml up -d --build

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
echo "✅ Checking service status..."
sudo docker compose -f docker-compose.prod.yml ps

# Test local connectivity
echo "🧪 Testing local connectivity..."
curl -s -o /dev/null -w "%{http_code}" http://localhost/health

echo ""
echo "🎉 Production setup complete!"
echo ""
echo "📱 Access your app at: http://140.238.156.90"
echo "🔐 Login credentials:"
echo "   Admin: admin@tecumseh-jujutsu.com / password123"
echo "   Coach: coach@tecumseh-jujutsu.com / password123"
echo ""
echo "📊 Check logs with: sudo docker compose -f docker-compose.prod.yml logs -f"
echo ""

# Show which ports are open
echo "🔍 Open ports:"
sudo netstat -tlnp | grep -E ':(80|443|3000|5432)'