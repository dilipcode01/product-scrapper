# Setup Guide

This guide will walk you through setting up the E-commerce 3D Scraper application step by step.

## System Requirements

- **Operating System**: Windows 10+, macOS 10.15+, or Ubuntu 18.04+
- **Node.js**: Version 16.0.0 or higher
- **MongoDB**: Version 4.4 or higher
- **RAM**: Minimum 4GB, recommended 8GB+
- **Storage**: At least 2GB free space for assets
- **Network**: Internet connection for scraping

## Step-by-Step Installation

### 1. Install Prerequisites

#### Node.js
Download and install from [nodejs.org](https://nodejs.org/)

Verify installation:
\`\`\`bash
node --version
npm --version
\`\`\`

#### MongoDB

**Option A: MongoDB Community Server (Local)**
1. Download from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Follow installation instructions for your OS
3. Start MongoDB service

**Option B: MongoDB Atlas (Cloud)**
1. Create account at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Get connection string

#### Git
Download from [git-scm.com](https://git-scm.com/)

### 2. Clone and Setup Project

\`\`\`bash
# Clone repository
git clone <your-repository-url>
cd ecommerce-3d-scraper

# Install all dependencies
npm run install-all
\`\`\`

### 3. Environment Configuration

Create `.env` file in root directory:

\`\`\`env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/ecommerce_scraper
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/ecommerce_scraper

# Server Configuration
NODE_ENV=development
PORT=5000

# Optional: Blender Path (for high-quality renders)
BLENDER_PATH=/usr/bin/blender
# Windows: BLENDER_PATH=C:\Program Files\Blender Foundation\Blender 3.6\blender.exe
# macOS: BLENDER_PATH=/Applications/Blender.app/Contents/MacOS/Blender

# Optional: Proxy Settings (if behind corporate firewall)
# HTTP_PROXY=http://proxy.company.com:8080
# HTTPS_PROXY=https://proxy.company.com:8080
\`\`\`

### 4. Database Setup

#### Local MongoDB
\`\`\`bash
# Start MongoDB (varies by OS)
# macOS with Homebrew:
brew services start mongodb-community

# Ubuntu:
sudo systemctl start mongod

# Windows:
net start MongoDB
\`\`\`

#### MongoDB Atlas
1. Whitelist your IP address
2. Create database user
3. Update connection string in `.env`

### 5. Optional: Blender Installation

For high-quality 3D renders:

**macOS:**
\`\`\`bash
brew install --cask blender
\`\`\`

**Ubuntu:**
\`\`\`bash
sudo apt update
sudo apt install blender
\`\`\`

**Windows:**
Download from [blender.org](https://www.blender.org/download/)

### 6. Start the Application

\`\`\`bash
# Development mode (both server and client)
npm run dev
\`\`\`

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Verification

### 1. Check Backend
Visit http://localhost:5000/api/database/health

Should return:
\`\`\`json
{
  "status": "connected",
  "collections": [...],
  "host": "localhost",
  "port": 27017,
  "name": "ecommerce_scraper"
}
\`\`\`

### 2. Check Frontend
Visit http://localhost:3000

You should see the dashboard with navigation menu.

### 3. Test Scraping
1. Go to Scraper page
2. Enter a test URL (e.g., Walmart product)
3. Click "Start Scraping"
4. Check if product appears in Products page

## Production Deployment

### Environment Variables
\`\`\`env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ecommerce_scraper
PORT=5000
\`\`\`

### Build and Start
\`\`\`bash
npm run build
npm start
\`\`\`

### Using PM2 (Recommended)
\`\`\`bash
npm install -g pm2
pm2 start server/server.js --name "ecommerce-scraper"
pm2 startup
pm2 save
\`\`\`

## Troubleshooting

### Common Issues

**1. MongoDB Connection Failed**
\`\`\`
Error: connect ECONNREFUSED 127.0.0.1:27017
\`\`\`
Solution: Ensure MongoDB is running and connection string is correct.

**2. Puppeteer Installation Issues**
\`\`\`
Error: Failed to launch the browser process
\`\`\`
Solution:
\`\`\`bash
# Install dependencies
sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
\`\`\`

**3. Sharp Installation Issues**
\`\`\`bash
npm rebuild sharp
\`\`\`

**4. Port Already in Use**
\`\`\`
Error: listen EADDRINUSE :::5000
\`\`\`
Solution: Change PORT in `.env` or kill process using port 5000.

### Performance Optimization

**1. Increase Memory Limit**
\`\`\`bash
export NODE_OPTIONS="--max-old-space-size=4096"
\`\`\`

**2. Configure Puppeteer**
Add to `.env`:
\`\`\`env
PUPPETEER_ARGS=--no-sandbox,--disable-setuid-sandbox,--disable-dev-shm-usage
\`\`\`

**3. Database Indexing**
The application automatically creates necessary indexes, but for large datasets:
\`\`\`javascript
// In MongoDB shell
db.products.createIndex({ "name": "text", "description": "text" })
db.products.createIndex({ "category": 1, "sourceSite": 1 })
\`\`\`

## Development Tips

### 1. Debug Mode
\`\`\`bash
DEBUG=scraper:* npm run dev
\`\`\`

### 2. Database GUI
Install MongoDB Compass for visual database management.

### 3. API Testing
Use Postman or curl to test API endpoints:
\`\`\`bash
curl http://localhost:5000/api/products
\`\`\`

### 4. Log Files
Check logs in:
- Server logs: Console output
- MongoDB logs: `/var/log/mongodb/mongod.log` (Linux)
- Puppeteer logs: Enable with `DEBUG=puppeteer:*`

## Next Steps

1. Test scraping with different product URLs
2. Explore the dashboard features
3. Check generated 3D assets
4. Configure Blender for better renders
5. Set up production deployment

For additional help, refer to the main README.md or create an issue on GitHub.
