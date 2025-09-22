const express = require("express")
const router = express.Router()
const path = require("path")
const fs = require("fs").promises
const BlenderRenderer = require("../services/BlenderRenderer")
const GLBGenerator = require("../services/GLBGenerator")

// Serve asset files
router.get("/:productId/:filename", async (req, res) => {
  try {
    const { productId, filename } = req.params
    const filePath = path.join(__dirname, "../assets", productId, filename)

    // Check if file exists
    await fs.access(filePath)

    // Set appropriate content type
    const ext = path.extname(filename).toLowerCase()
    const contentTypes = {
      ".glb": "model/gltf-binary",
      ".gltf": "model/gltf+json",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".json": "application/json",
    }

    const contentType = contentTypes[ext] || "application/octet-stream"
    res.setHeader("Content-Type", contentType)

    const fileBuffer = await fs.readFile(filePath)
    res.send(fileBuffer)
  } catch (error) {
    console.error("Asset serving error:", error)
    res.status(404).json({ message: "Asset not found" })
  }
})

// Regenerate assets for a product
router.post("/regenerate/:productId", async (req, res) => {
  try {
    const { productId } = req.params
    const Product = require("../models/Product")

    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    const productDir = path.join(__dirname, "../assets", product.uid)

    // Check if Blender is available
    const blenderAvailable = await BlenderRenderer.isBlenderAvailable()

    if (blenderAvailable) {
      // Use Blender for high-quality rendering
      const assets = await BlenderRenderer.renderProduct(product, productDir)

      product.assets = {
        glbModel: assets.glb,
        dataJson: path.join(productDir, "data.json"),
        renders: assets.renders,
      }
    } else {
      // Fallback to programmatic generation
      const AssetProcessor = require("../services/AssetProcessor")
      await AssetProcessor.processAssets(product)
    }

    await product.save()

    res.json({
      message: "Assets regenerated successfully",
      assets: product.assets,
      method: blenderAvailable ? "blender" : "programmatic",
    })
  } catch (error) {
    console.error("Asset regeneration error:", error)
    res.status(500).json({ message: "Asset regeneration failed", error: error.message })
  }
})

// Get asset metadata
router.get("/metadata/:productId", async (req, res) => {
  try {
    const { productId } = req.params
    const Product = require("../models/Product")

    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    const productDir = path.join(__dirname, "../assets", product.uid)
    const assets = {}

    // Check which assets exist
    const assetFiles = ["model.glb", "data.json", "render_front.png", "render_side.png", "render_top.png"]

    for (const file of assetFiles) {
      const filePath = path.join(productDir, file)
      try {
        const stats = await fs.stat(filePath)
        assets[file] = {
          exists: true,
          size: stats.size,
          modified: stats.mtime,
          url: `/api/assets/${product.uid}/${file}`,
        }
      } catch {
        assets[file] = { exists: false }
      }
    }

    res.json({
      productId: product._id,
      uid: product.uid,
      assets,
      assetMetadata: product.assetMetadata,
      annotations: product.annotations,
    })
  } catch (error) {
    console.error("Asset metadata error:", error)
    res.status(500).json({ message: "Failed to get asset metadata" })
  }
})

module.exports = router
