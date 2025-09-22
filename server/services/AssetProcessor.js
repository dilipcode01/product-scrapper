const fs = require("fs").promises
const path = require("path")
const sharp = require("sharp")
const { exec } = require("child_process")
const { promisify } = require("util")

const execAsync = promisify(exec)

class AssetProcessor {
  constructor() {
    this.assetsDir = path.join(__dirname, "../assets")
    this.ensureAssetsDirectory()
  }

  async ensureAssetsDirectory() {
    try {
      await fs.access(this.assetsDir)
    } catch {
      await fs.mkdir(this.assetsDir, { recursive: true })
    }
  }

  async processAssets(product) {
    const productDir = path.join(this.assetsDir, product.uid)
    await fs.mkdir(productDir, { recursive: true })

    try {
      // Generate GLB model (placeholder for now)
      const glbPath = await this.generateGLBModel(product, productDir)

      // Generate data.json
      const dataJsonPath = await this.generateDataJson(product, productDir)

      // Generate renders
      const renders = await this.generateRenders(product, productDir)

      // Update product with asset paths
      product.assets = {
        glbModel: glbPath,
        dataJson: dataJsonPath,
        renders,
      }

      await product.save()

      return product.assets
    } catch (error) {
      console.error("Asset processing error:", error)
      throw error
    }
  }

  async generateGLBModel(product, productDir) {
    const glbPath = path.join(productDir, "model.glb")

    // For now, create a placeholder GLB file
    // In a real implementation, you would use Three.js or Blender to generate actual 3D models
    const placeholderGLB = await this.createPlaceholderGLB(product)
    await fs.writeFile(glbPath, placeholderGLB)

    return glbPath
  }

  async createPlaceholderGLB(product) {
    // This is a minimal GLB file structure
    // In production, you'd generate actual 3D geometry based on product dimensions
    const gltfData = {
      asset: { version: "2.0" },
      scene: 0,
      scenes: [{ nodes: [0] }],
      nodes: [
        {
          mesh: 0,
          name: product.name,
        },
      ],
      meshes: [
        {
          primitives: [
            {
              attributes: { POSITION: 0 },
              indices: 1,
            },
          ],
        },
      ],
      accessors: [
        {
          bufferView: 0,
          componentType: 5126,
          count: 8,
          type: "VEC3",
          max: [product.dimensions.width / 100, product.dimensions.height / 100, product.dimensions.depth / 100],
          min: [0, 0, 0],
        },
        {
          bufferView: 1,
          componentType: 5123,
          count: 36,
          type: "SCALAR",
        },
      ],
      bufferViews: [
        { buffer: 0, byteOffset: 0, byteLength: 96 },
        { buffer: 0, byteOffset: 96, byteLength: 72 },
      ],
      buffers: [{ byteLength: 168 }],
    }

    return Buffer.from(JSON.stringify(gltfData))
  }

  async generateDataJson(product, productDir) {
    const dataJsonPath = path.join(productDir, "data.json")

    const dataJson = {
      assetMetadata: product.assetMetadata,
      annotations: {
        ...product.annotations,
        description: product.description,
        category: product.category,
        width: product.dimensions.width,
        depth: product.dimensions.depth,
        height: product.dimensions.height,
        volume: product.dimensions.volume,
        uid: product.uid,
      },
    }

    await fs.writeFile(dataJsonPath, JSON.stringify(dataJson, null, 2))
    return dataJsonPath
  }

  async generateRenders(product, productDir) {
    const renders = {
      front: path.join(productDir, "render_front.png"),
      side: path.join(productDir, "render_side.png"),
      top: path.join(productDir, "render_top.png"),
    }

    // Generate placeholder renders
    // In production, you'd use Blender or Three.js to create actual renders
    for (const [view, renderPath] of Object.entries(renders)) {
      await this.createPlaceholderRender(product, view, renderPath)
    }

    return renders
  }

  async createPlaceholderRender(product, view, renderPath) {
    const width = 800
    const height = 600

    // Create a simple colored rectangle as placeholder
    const color = this.getColorForCategory(product.category)

    await sharp({
      create: {
        width,
        height,
        channels: 3,
        background: color,
      },
    })
      .png()
      .composite([
        {
          input: Buffer.from(`
        <svg width="${width}" height="${height}">
          <rect width="${width}" height="${height}" fill="${color}" opacity="0.8"/>
          <text x="50%" y="40%" text-anchor="middle" font-family="Arial" font-size="24" fill="white">
            ${product.name}
          </text>
          <text x="50%" y="50%" text-anchor="middle" font-family="Arial" font-size="18" fill="white">
            ${view.toUpperCase()} VIEW
          </text>
          <text x="50%" y="60%" text-anchor="middle" font-family="Arial" font-size="14" fill="white">
            ${product.dimensions.width}×${product.dimensions.height}×${product.dimensions.depth}cm
          </text>
        </svg>
      `),
          top: 0,
          left: 0,
        },
      ])
      .toFile(renderPath)
  }

  getColorForCategory(category) {
    const colorMap = {
      furniture: "#8B4513",
      electronics: "#2F4F4F",
      clothing: "#FF69B4",
      books: "#DAA520",
      toys: "#FF6347",
      kitchen: "#C0C0C0",
    }

    return colorMap[category] || "#696969"
  }
}

module.exports = new AssetProcessor()
