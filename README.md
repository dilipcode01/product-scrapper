# E-commerce 3D Scraper

A full-stack MERN application that scrapes product data from e-commerce websites (Walmart, Amazon, Target) and generates 3D assets including GLB models and Blender renders.

## Features

- **Web Scraping**: Extract product data from major e-commerce sites
- **3D Asset Generation**: Create GLB models and render images
- **Database Management**: Store and organize product data with MongoDB
- **File Management**: Handle 3D assets, images, and data files
- **Dashboard Interface**: React-based admin panel for managing products
- **Bulk Operations**: Process multiple products simultaneously
- **Asset Optimization**: Compress and optimize 3D models and images

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Puppeteer** for web scraping
- **Sharp** for image processing
- **Three.js** for 3D model generation
- **Blender** integration (optional)

### Frontend
- **React** with React Router
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **React Three Fiber** for 3D model viewing
- **Lucide React** for icons

## Project Structure

\`\`\`
ecommerce-3d-scraper/
├── server/
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API endpoints
│   ├── services/         # Business logic
│   ├── blender_scripts/  # Blender automation scripts
│   ├── assets/           # Generated 3D assets
│   └── server.js         # Express server
├── client/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   └── services/     # API services
│   └── public/
├── package.json
└── README.md
\`\`\`

## Installation

### Prerequisites

- Node.js (v20 or higher)
- MongoDB (v4.4 or higher)
- Git
- Blender (optional, for high-quality renders)

### Setup Instructions

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd product-scrapper
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   # Install server dependencies
   npm install  or npm install --legacy-peer-deps
   
   # Install client dependencies
   cd client
   npm install
   cd ..
   \`\`\`

3. **Environment Configuration**
   
   Create a `.env` file in the root directory:
   \`\`\`env
   MONGODB_URI=mongodb://localhost:27017/ecommerce_scraper
   NODE_ENV=development
   PORT=5000
   
   # Optional: Blender path for high-quality rendering
   BLENDER_PATH=/usr/bin/blender

4. **Start the application**
   # run separately
   npm run dev:server  # Backend only
   npm run dev:client  # Frontend only
   \`\`\`

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Usage

### Web Scraping

1. Navigate to the **Scraper** page
2. Enter product URLs from supported sites:
   - Walmart: `https://www.walmart.com/ip/...`
   - Amazon: `https://www.amazon.com/dp/...`
   - Target: `https://www.target.com/p/...`
3. Select the correct source site
4. Click "Start Scraping"

### Managing Products

1. View all products in the **Products** page
2. Use filters to find specific products
3. Click on a product to view details and 3D assets
4. Download individual or bulk assets

### 3D Assets

Each product generates:
- `model.glb` - 3D model file
- `data.json` - Product metadata and annotations
- `render_front.png` - Front view render
- `render_side.png` - Side view render  
- `render_top.png` - Top view render

## API Documentation

### Products API

- `GET /api/products` - List products with pagination
- `GET /api/products/:id` - Get single product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Scraper API

- `POST /api/scraper/scrape` - Scrape single URL
- `POST /api/scraper/bulk-scrape` - Scrape multiple URLs
- `GET /api/scraper/status/:productId` - Get scraping status

### Assets API

- `GET /api/assets/:productId/:filename` - Serve asset files
- `POST /api/assets/regenerate/:productId` - Regenerate assets
- `GET /api/assets/metadata/:productId` - Get asset metadata

### Files API

- `GET /api/files/stats` - Storage statistics
- `GET /api/files/download/product/:productId` - Download product archive
- `POST /api/files/download/bulk` - Bulk download
- `POST /api/files/upload/:productId` - Upload files

### Blender Integration

For high-quality 3D renders, install Blender and set the path:

\`\`\`bash
# Install Blender
# macOS
brew install --cask blender

# Ubuntu
sudo apt install blender

# Set environment variable
export BLENDER_PATH=/usr/bin/blender
\`\`\`

### Proxy Configuration

For scraping behind a corporate firewall:

\`\`\`env
HTTP_PROXY=http://proxy.company.com:8080
HTTPS_PROXY=https://proxy.company.com:8080
\`\`\`

### Performance Tuning

- Increase MongoDB connection pool size
- Configure Puppeteer with resource limits
- Use Redis for caching (optional)
- Enable gzip compression

## Troubleshooting

### Common Issues

1. **Scraping fails with timeout**
   - Increase Puppeteer timeout in `ScrapingService.js`
   - Check network connectivity
   - Verify proxy settings

2. **3D assets not generating**
   - Check file permissions in assets directory
   - Verify Sharp and Three.js installation
   - Check Blender path if using Blender

3. **MongoDB connection errors**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify database permissions

4. **Frontend build fails**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Verify Tailwind CSS configuration
