# API Documentation

Complete API reference for the E-commerce 3D Scraper application.

## Base URL

- Development: `http://localhost:5000/api`
- Production: `https://your-domain.com/api`

## Authentication

Currently, the API does not require authentication. In production, consider implementing JWT tokens or API keys.

## Response Format

All API responses follow this format:

\`\`\`json
{
  "success": true,
  "data": {...},
  "message": "Success message",
  "error": null
}
\`\`\`

Error responses:
\`\`\`json
{
  "success": false,
  "data": null,
  "message": "Error message",
  "error": "Detailed error information"
}
\`\`\`

## Products API

### List Products

**GET** `/products`

Query Parameters:
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `category` (string): Filter by category
- `status` (string): Filter by status (scraped, processing, completed, failed)
- `sourceSite` (string): Filter by source site (walmart, amazon, target)
- `search` (string): Search in name and description

Example:
\`\`\`bash
GET /api/products?page=1&limit=20&category=electronics&status=completed
\`\`\`

Response:
\`\`\`json
{
  "products": [...],
  "currentPage": 1,
  "totalPages": 5,
  "total": 100
}
\`\`\`

### Get Single Product

**GET** `/products/:id`

Parameters:
- `id` (string): Product ID

Response:
\`\`\`json
{
  "_id": "product_id",
  "uid": "unique_identifier",
  "name": "Product Name",
  "category": "electronics",
  "description": "Product description",
  "sourceUrl": "https://...",
  "sourceSite": "walmart",
  "price": 99.99,
  "dimensions": {
    "width": 30,
    "height": 20,
    "depth": 15,
    "volume": 9
  },
  "assets": {
    "glbModel": "/path/to/model.glb",
    "dataJson": "/path/to/data.json",
    "renders": {
      "front": "/path/to/render_front.png",
      "side": "/path/to/render_side.png",
      "top": "/path/to/render_top.png"
    }
  },
  "status": "completed",
  "scrapedAt": "2023-01-01T00:00:00.000Z"
}
\`\`\`

### Update Product

**PUT** `/products/:id`

Request Body:
\`\`\`json
{
  "name": "Updated Product Name",
  "category": "new_category",
  "description": "Updated description"
}
\`\`\`

### Delete Product

**DELETE** `/products/:id`

Response:
\`\`\`json
{
  "message": "Product deleted successfully"
}
\`\`\`

## Scraper API

### Scrape Single URL

**POST** `/scraper/scrape`

Request Body:
\`\`\`json
{
  "url": "https://www.walmart.com/ip/product-id",
  "site": "walmart"
}
\`\`\`

Response:
\`\`\`json
{
  "message": "Scraping completed successfully",
  "product": {
    "_id": "product_id",
    "name": "Scraped Product",
    "status": "processing"
  }
}
\`\`\`

### Bulk Scrape

**POST** `/scraper/bulk-scrape`

Request Body:
\`\`\`json
{
  "urls": [
    {
      "url": "https://www.walmart.com/ip/product-1",
      "site": "walmart"
    },
    {
      "url": "https://www.amazon.com/dp/product-2",
      "site": "amazon"
    }
  ]
}
\`\`\`

Response:
\`\`\`json
{
  "message": "Bulk scraping completed",
  "results": [
    {
      "success": true,
      "product": {...}
    },
    {
      "success": false,
      "error": "Scraping failed",
      "url": "https://..."
    }
  ],
  "successful": 1,
  "failed": 1
}
\`\`\`

### Get Scraping Status

**GET** `/scraper/status/:productId`

Response:
\`\`\`json
{
  "status": "processing",
  "progress": {
    "message": "Generating 3D assets",
    "percentage": 75,
    "timestamp": 1640995200000
  }
}
\`\`\`

## Assets API

### Serve Asset File

**GET** `/assets/:productId/:filename`

Parameters:
- `productId` (string): Product UID
- `filename` (string): Asset filename (model.glb, data.json, render_front.png, etc.)

Returns the file with appropriate content-type headers.

### Regenerate Assets

**POST** `/assets/regenerate/:productId`

Regenerates all 3D assets for a product.

Response:
\`\`\`json
{
  "message": "Assets regenerated successfully",
  "assets": {
    "glbModel": "/path/to/model.glb",
    "renders": {...}
  },
  "method": "blender"
}
\`\`\`

### Get Asset Metadata

**GET** `/assets/metadata/:productId`

Response:
\`\`\`json
{
  "productId": "product_id",
  "uid": "product_uid",
  "assets": {
    "model.glb": {
      "exists": true,
      "size": 1024000,
      "modified": "2023-01-01T00:00:00.000Z",
      "url": "/api/assets/uid/model.glb"
    },
    "data.json": {...},
    "render_front.png": {...}
  },
  "assetMetadata": {...},
  "annotations": {...}
}
\`\`\`

## Files API

### Get Storage Statistics

**GET** `/files/stats`

Response:
\`\`\`json
{
  "totalProducts": 100,
  "totalSize": 1073741824,
  "assetTypes": {
    "glb": {
      "count": 100,
      "size": 536870912
    },
    "images": {
      "count": 300,
      "size": 268435456
    },
    "json": {
      "count": 100,
      "size": 1048576
    }
  }
}
\`\`\`

### Download Product Archive

**GET** `/files/download/product/:productId`

Downloads a ZIP archive containing all assets for a product.

### Bulk Download

**POST** `/files/download/bulk`

Request Body:
\`\`\`json
{
  "productIds": ["id1", "id2", "id3"],
  "archiveName": "my_products"
}
\`\`\`

Downloads a ZIP archive containing assets for multiple products.

### Upload Files

**POST** `/files/upload/:productId`

Multipart form upload. Accepts files with field name `files`.

Supported file types:
- GLB models (model/gltf-binary)
- Images (image/png, image/jpeg)
- JSON files (application/json)

Response:
\`\`\`json
{
  "message": "Files uploaded successfully",
  "files": [
    {
      "originalName": "model.glb",
      "size": 1024000,
      "path": "/path/to/file",
      "url": "/api/assets/uid/model.glb"
    }
  ]
}
\`\`\`

### Optimize Assets

**POST** `/files/optimize/:productId`

Optimizes images and compresses 3D models for a product.

Response:
\`\`\`json
{
  "message": "Assets optimized successfully",
  "optimizedAssets": ["render_front.png", "render_side.png"]
}
\`\`\`

## Database API

### Get Database Statistics

**GET** `/database/stats`

Response:
\`\`\`json
{
  "overview": {
    "totalProducts": 100,
    "completedProducts": 80,
    "processingProducts": 15,
    "failedProducts": 5
  },
  "byCategory": [
    {
      "_id": "electronics",
      "count": 30
    },
    {
      "_id": "furniture",
      "count": 25
    }
  ],
  "bySite": [
    {
      "_id": "walmart",
      "count": 40
    },
    {
      "_id": "amazon",
      "count": 35
    }
  ]
}
\`\`\`

### Search Products

**GET** `/database/search`

Query Parameters:
- `q` (string): Search term (required)
- `category` (string): Filter by category
- `status` (string): Filter by status
- `sourceSite` (string): Filter by source site

Response:
\`\`\`json
{
  "searchTerm": "laptop",
  "results": [...],
  "count": 15
}
\`\`\`

### Bulk Update Products

**POST** `/database/bulk/update`

Request Body:
\`\`\`json
{
  "filter": {
    "category": "electronics"
  },
  "updateData": {
    "status": "completed"
  }
}
\`\`\`

Response:
\`\`\`json
{
  "message": "Bulk update completed",
  "modifiedCount": 25,
  "matchedCount": 30
}
\`\`\`

### Bulk Delete Products

**POST** `/database/bulk/delete`

Request Body:
\`\`\`json
{
  "filter": {
    "status": "failed"
  }
}
\`\`\`

Response:
\`\`\`json
{
  "message": "Bulk delete completed",
  "deletedCount": 5
}
\`\`\`

### Database Health Check

**GET** `/database/health`

Response:
\`\`\`json
{
  "status": "connected",
  "collections": [
    {
      "name": "products",
      "type": "collection"
    },
    {
      "name": "scrapingjobs",
      "type": "collection"
    }
  ],
  "host": "localhost",
  "port": 27017,
  "name": "ecommerce_scraper"
}
\`\`\`

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Unprocessable Entity |
| 429 | Too Many Requests |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

## Rate Limiting

Currently not implemented. Consider adding rate limiting for production:

\`\`\`javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
\`\`\`

## CORS Configuration

The API accepts requests from all origins in development. For production, configure specific origins:

\`\`\`javascript
app.use(cors({
  origin: ['https://your-frontend-domain.com'],
  credentials: true
}));
\`\`\`

## Example Usage

### JavaScript/Node.js

\`\`\`javascript
const axios = require('axios');

// Scrape a product
const scrapeProduct = async () => {
  try {
    const response = await axios.post('http://localhost:5000/api/scraper/scrape', {
      url: 'https://www.walmart.com/ip/product-id',
      site: 'walmart'
    });
    console.log('Product scraped:', response.data.product);
  } catch (error) {
    console.error('Scraping failed:', error.response.data);
  }
};

// Get products
const getProducts = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/products?limit=10');
    console.log('Products:', response.data.products);
  } catch (error) {
    console.error('Failed to get products:', error.response.data);
  }
};
\`\`\`

### Python

\`\`\`python
import requests

# Scrape a product
def scrape_product():
    url = 'http://localhost:5000/api/scraper/scrape'
    data = {
        'url': 'https://www.walmart.com/ip/product-id',
        'site': 'walmart'
    }
    
    response = requests.post(url, json=data)
    if response.status_code == 200:
        print('Product scraped:', response.json()['product'])
    else:
        print('Scraping failed:', response.json())

# Get products
def get_products():
    url = 'http://localhost:5000/api/products'
    params = {'limit': 10}
    
    response = requests.get(url, params=params)
    if response.status_code == 200:
        print('Products:', response.json()['products'])
    else:
        print('Failed to get products:', response.json())
\`\`\`

### cURL

\`\`\`bash
# Scrape a product
curl -X POST http://localhost:5000/api/scraper/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.walmart.com/ip/product-id",
    "site": "walmart"
  }'

# Get products
curl "http://localhost:5000/api/products?limit=10"

# Download product archive
curl -O "http://localhost:5000/api/files/download/product/product-id"
