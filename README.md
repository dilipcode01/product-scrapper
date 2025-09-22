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
   cd ecommerce-3d-scraper
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
   
   # Optional: Proxy settings for scraping
   # HTTP_PROXY=http://proxy:port
   # HTTPS_PROXY=https://proxy:port
   \`\`\`

4. **Database Setup**
   
   Make sure MongoDB is running:
   \`\`\`bash
   # On macOS with Homebrew
   brew services start mongodb-community
   
   # On Ubuntu
   sudo systemctl start mongod
   
   # On Windows
   net start MongoDB
   \`\`\`

5. **Start the application**
   \`\`\`bash
   # Development mode (runs both server and client)
   npm run dev
   
   # Or run separately
   npm run server  # Backend only
   npm run client  # Frontend only
   \`\`\`

6. **Access the application**
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

## Data Structure

### Product Schema

\`\`\`javascript
{
  uid: String,              // Unique identifier
  name: String,             // Product name
  category: String,         // Product category
  description: String,      // Product description
  sourceUrl: String,        // Original product URL
  sourceSite: String,       // Source website
  price: Number,            // Product price
  dimensions: {             // Physical dimensions
    width: Number,
    height: Number,
    depth: Number,
    volume: Number
  },
  assetMetadata: {          // 3D asset metadata
    boundingBox: {
      x: Number,
      y: Number,
      z: Number
    }
  },
  annotations: {            // Product annotations
    materials: [String],
    composition: [Number],
    mass: Number,
    receptacle: Boolean,
    // ... additional properties
  },
  assets: {                 // Asset file paths
    glbModel: String,
    dataJson: String,
    renders: {
      front: String,
      side: String,
      top: String
    }
  }
}
\`\`\`

### Data.json Format

\`\`\`json
{
  "assetMetadata": {
    "boundingBox": {
      "x": 0.819823682308197,
      "y": 0.33995914459228516,
      "z": 1.5000001192092896
    }
  },
  "annotations": {
    "description": "Product description",
    "category": "furniture",
    "width": 80,
    "depth": 30,
    "height": 150,
    "volume": 360,
    "materials": ["wood", "metal"],
    "composition": [0.7, 0.3],
    "mass": 50,
    "receptacle": true,
    "frontView": 0,
    "onCeiling": false,
    "onWall": true,
    "onFloor": true,
    "onObject": false,
    "uid": "unique-identifier",
    "pose_z_rot_angle": 0.0,
    "scale": 1.0,
    "z_axis_scale": true
  }
}
\`\`\`

## Advanced Configuration

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

### Debug Mode

Enable debug logging:

\`\`\`env
DEBUG=scraper:*
NODE_ENV=development
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the API documentation

## Roadmap

- [ ] Support for additional e-commerce sites
- [ ] Real-time scraping progress updates
- [ ] Advanced 3D model customization
- [ ] Machine learning for better categorization
- [ ] Cloud storage integration
- [ ] User authentication and roles
