const express = require("express")
const router = express.Router()
const FileManager = require("../services/FileManager")
const Product = require("../models/Product")

// Get storage statistics
router.get("/stats", async (req, res) => {
  try {
    const stats = await FileManager.getStorageStats()
    res.json(stats)
  } catch (error) {
    console.error("Storage stats error:", error)
    res.status(500).json({ message: "Failed to get storage statistics" })
  }
})

// Download product archive
router.get("/download/product/:productId", async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId)
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    const archivePath = await FileManager.createProductArchive(product.uid)

    res.download(archivePath, `${product.name.replace(/[^a-zA-Z0-9]/g, "_")}.zip`, (err) => {
      if (err) {
        console.error("Download error:", err)
      }
      // Clean up temp file
      require("fs").unlink(archivePath, () => {})
    })
  } catch (error) {
    console.error("Archive creation error:", error)
    res.status(500).json({ message: "Failed to create archive" })
  }
})

// Bulk download
router.post("/download/bulk", async (req, res) => {
  try {
    const { productIds, archiveName } = req.body

    if (!productIds || !Array.isArray(productIds)) {
      return res.status(400).json({ message: "Product IDs array is required" })
    }

    const products = await Product.find({ _id: { $in: productIds } })
    const productUids = products.map((p) => p.uid)

    const archivePath = await FileManager.createBulkArchive(productUids, archiveName)

    res.download(archivePath, `${archiveName || "products"}.zip`, (err) => {
      if (err) {
        console.error("Bulk download error:", err)
      }
      // Clean up temp file
      require("fs").unlink(archivePath, () => {})
    })
  } catch (error) {
    console.error("Bulk archive creation error:", error)
    res.status(500).json({ message: "Failed to create bulk archive" })
  }
})

// Upload files
const upload = FileManager.getMulterConfig()

router.post("/upload/:productId", upload.array("files", 10), async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId)
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    const uploadedFiles = []

    for (const file of req.files) {
      // Validate file based on type
      let validation = { valid: true }

      if (file.mimetype === "model/gltf-binary" || file.originalname.endsWith(".glb")) {
        validation = await FileManager.validateGLBFile(file.path)
      } else if (file.mimetype.startsWith("image/")) {
        validation = await FileManager.validateImageFile(file.path)
      }

      if (!validation.valid) {
        // Clean up invalid file
        require("fs").unlink(file.path, () => {})
        return res.status(400).json({
          message: `Invalid file ${file.originalname}: ${validation.error}`,
        })
      }

      // Move file to product directory
      const finalPath = await FileManager.moveAsset(file.path, product.uid, file.originalname)

      uploadedFiles.push({
        originalName: file.originalname,
        size: file.size,
        path: finalPath,
        url: `/api/assets/${product.uid}/${file.originalname}`,
      })
    }

    res.json({
      message: "Files uploaded successfully",
      files: uploadedFiles,
    })
  } catch (error) {
    console.error("File upload error:", error)
    res.status(500).json({ message: "File upload failed" })
  }
})

// Optimize assets
router.post("/optimize/:productId", async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId)
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    const assets = await FileManager.getProductAssets(product.uid)
    const optimizedAssets = []

    for (const [filename, asset] of Object.entries(assets)) {
      if (filename.match(/\.(png|jpg|jpeg)$/i)) {
        const optimizedPath = asset.path.replace(/\.(png|jpg|jpeg)$/i, "_optimized.png")
        await FileManager.optimizeImage(asset.path, optimizedPath, {
          width: 800,
          height: 600,
          quality: 80,
          format: "png",
        })
        optimizedAssets.push(filename)
      }
    }

    res.json({
      message: "Assets optimized successfully",
      optimizedAssets,
    })
  } catch (error) {
    console.error("Asset optimization error:", error)
    res.status(500).json({ message: "Asset optimization failed" })
  }
})

// Cleanup operations
router.post("/cleanup/temp", async (req, res) => {
  try {
    const { olderThanHours = 24 } = req.body
    const result = await FileManager.cleanupTempFiles(olderThanHours)

    res.json({
      message: "Temp files cleaned up successfully",
      ...result,
    })
  } catch (error) {
    console.error("Temp cleanup error:", error)
    res.status(500).json({ message: "Temp cleanup failed" })
  }
})

router.post("/cleanup/orphaned", async (req, res) => {
  try {
    const products = await Product.find({}, "uid")
    const validUids = products.map((p) => p.uid)

    const result = await FileManager.cleanupOrphanedAssets(validUids)

    res.json({
      message: "Orphaned assets cleaned up successfully",
      ...result,
    })
  } catch (error) {
    console.error("Orphaned cleanup error:", error)
    res.status(500).json({ message: "Orphaned cleanup failed" })
  }
})

// Get product assets info
router.get("/assets/:productId", async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId)
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    const assets = await FileManager.getProductAssets(product.uid)

    res.json({
      productId: product._id,
      uid: product.uid,
      assets,
    })
  } catch (error) {
    console.error("Assets info error:", error)
    res.status(500).json({ message: "Failed to get assets info" })
  }
})

module.exports = router
