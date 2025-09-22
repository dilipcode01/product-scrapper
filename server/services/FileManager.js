const fs = require("fs").promises
const path = require("path")
const { createReadStream, createWriteStream } = require("fs")
const archiver = require("archiver")
const multer = require("multer")

class FileManager {
  constructor() {
    this.assetsDir = path.join(__dirname, "../assets")
    this.uploadsDir = path.join(__dirname, "../uploads")
    this.tempDir = path.join(__dirname, "../temp")
    this.initializeDirectories()
  }

  async initializeDirectories() {
    const dirs = [this.assetsDir, this.uploadsDir, this.tempDir]
    for (const dir of dirs) {
      try {
        await fs.access(dir)
      } catch {
        await fs.mkdir(dir, { recursive: true })
      }
    }
  }

  // Product asset management
  async createProductDirectory(productUid) {
    const productDir = path.join(this.assetsDir, productUid)
    try {
      await fs.mkdir(productDir, { recursive: true })
      return productDir
    } catch (error) {
      console.error("Error creating product directory:", error)
      throw error
    }
  }

  async deleteProductDirectory(productUid) {
    const productDir = path.join(this.assetsDir, productUid)
    try {
      await fs.rmdir(productDir, { recursive: true })
      return true
    } catch (error) {
      console.error("Error deleting product directory:", error)
      return false
    }
  }

  async getProductAssets(productUid) {
    const productDir = path.join(this.assetsDir, productUid)
    try {
      const files = await fs.readdir(productDir)
      const assets = {}

      for (const file of files) {
        const filePath = path.join(productDir, file)
        const stats = await fs.stat(filePath)

        assets[file] = {
          name: file,
          size: stats.size,
          modified: stats.mtime,
          path: filePath,
          url: `/api/assets/${productUid}/${file}`,
        }
      }

      return assets
    } catch (error) {
      console.error("Error getting product assets:", error)
      return {}
    }
  }

  async copyAsset(sourcePath, productUid, filename) {
    const productDir = await this.createProductDirectory(productUid)
    const destPath = path.join(productDir, filename)

    try {
      await fs.copyFile(sourcePath, destPath)
      return destPath
    } catch (error) {
      console.error("Error copying asset:", error)
      throw error
    }
  }

  async moveAsset(sourcePath, productUid, filename) {
    const productDir = await this.createProductDirectory(productUid)
    const destPath = path.join(productDir, filename)

    try {
      await fs.rename(sourcePath, destPath)
      return destPath
    } catch (error) {
      console.error("Error moving asset:", error)
      throw error
    }
  }

  // Archive creation
  async createProductArchive(productUid) {
    const productDir = path.join(this.assetsDir, productUid)
    const archivePath = path.join(this.tempDir, `${productUid}.zip`)

    return new Promise((resolve, reject) => {
      const output = createWriteStream(archivePath)
      const archive = archiver("zip", { zlib: { level: 9 } })

      output.on("close", () => {
        resolve(archivePath)
      })

      archive.on("error", (err) => {
        reject(err)
      })

      archive.pipe(output)
      archive.directory(productDir, false)
      archive.finalize()
    })
  }

  async createBulkArchive(productUids, archiveName = "products") {
    const archivePath = path.join(this.tempDir, `${archiveName}_${Date.now()}.zip`)

    return new Promise((resolve, reject) => {
      const output = createWriteStream(archivePath)
      const archive = archiver("zip", { zlib: { level: 9 } })

      output.on("close", () => {
        resolve(archivePath)
      })

      archive.on("error", (err) => {
        reject(err)
      })

      archive.pipe(output)

      for (const uid of productUids) {
        const productDir = path.join(this.assetsDir, uid)
        archive.directory(productDir, uid)
      }

      archive.finalize()
    })
  }

  // File validation
  validateGLBFile(filePath) {
    return new Promise(async (resolve, reject) => {
      try {
        const buffer = await fs.readFile(filePath)

        // Check GLB magic number
        const magic = buffer.readUInt32LE(0)
        if (magic !== 0x46546c67) {
          // 'glTF'
          return resolve({ valid: false, error: "Invalid GLB file format" })
        }

        // Check version
        const version = buffer.readUInt32LE(4)
        if (version !== 2) {
          return resolve({ valid: false, error: "Unsupported GLB version" })
        }

        const fileSize = buffer.readUInt32LE(8)
        if (fileSize !== buffer.length) {
          return resolve({ valid: false, error: "File size mismatch" })
        }

        resolve({ valid: true })
      } catch (error) {
        reject(error)
      }
    })
  }

  validateImageFile(filePath) {
    return new Promise(async (resolve, reject) => {
      try {
        const sharp = require("sharp")
        const metadata = await sharp(filePath).metadata()

        const supportedFormats = ["jpeg", "png", "webp"]
        if (!supportedFormats.includes(metadata.format)) {
          return resolve({ valid: false, error: "Unsupported image format" })
        }

        if (metadata.width < 100 || metadata.height < 100) {
          return resolve({ valid: false, error: "Image too small (minimum 100x100)" })
        }

        resolve({
          valid: true,
          metadata: {
            width: metadata.width,
            height: metadata.height,
            format: metadata.format,
            size: metadata.size,
          },
        })
      } catch (error) {
        resolve({ valid: false, error: "Invalid image file" })
      }
    })
  }

  // Storage optimization
  async optimizeImage(inputPath, outputPath, options = {}) {
    try {
      const sharp = require("sharp")
      const { width = 800, height = 600, quality = 80, format = "png" } = options

      await sharp(inputPath)
        .resize(width, height, { fit: "inside", withoutEnlargement: true })
        .toFormat(format, { quality })
        .toFile(outputPath)

      return outputPath
    } catch (error) {
      console.error("Error optimizing image:", error)
      throw error
    }
  }

  async compressGLB(inputPath, outputPath) {
    try {
      // For now, just copy the file
      // In production, you might use gltf-pipeline for compression
      await fs.copyFile(inputPath, outputPath)
      return outputPath
    } catch (error) {
      console.error("Error compressing GLB:", error)
      throw error
    }
  }

  // Storage statistics
  async getStorageStats() {
    try {
      const stats = {
        totalProducts: 0,
        totalSize: 0,
        assetTypes: {
          glb: { count: 0, size: 0 },
          images: { count: 0, size: 0 },
          json: { count: 0, size: 0 },
        },
      }

      const productDirs = await fs.readdir(this.assetsDir)

      for (const dir of productDirs) {
        const productDir = path.join(this.assetsDir, dir)
        const dirStats = await fs.stat(productDir)

        if (dirStats.isDirectory()) {
          stats.totalProducts++

          const files = await fs.readdir(productDir)
          for (const file of files) {
            const filePath = path.join(productDir, file)
            const fileStats = await fs.stat(filePath)
            const ext = path.extname(file).toLowerCase()

            stats.totalSize += fileStats.size

            if (ext === ".glb") {
              stats.assetTypes.glb.count++
              stats.assetTypes.glb.size += fileStats.size
            } else if ([".png", ".jpg", ".jpeg"].includes(ext)) {
              stats.assetTypes.images.count++
              stats.assetTypes.images.size += fileStats.size
            } else if (ext === ".json") {
              stats.assetTypes.json.count++
              stats.assetTypes.json.size += fileStats.size
            }
          }
        }
      }

      return stats
    } catch (error) {
      console.error("Error getting storage stats:", error)
      throw error
    }
  }

  // Cleanup utilities
  async cleanupTempFiles(olderThanHours = 24) {
    try {
      const files = await fs.readdir(this.tempDir)
      const cutoffTime = Date.now() - olderThanHours * 60 * 60 * 1000
      let cleanedCount = 0

      for (const file of files) {
        const filePath = path.join(this.tempDir, file)
        const stats = await fs.stat(filePath)

        if (stats.mtime.getTime() < cutoffTime) {
          await fs.unlink(filePath)
          cleanedCount++
        }
      }

      return { cleanedFiles: cleanedCount }
    } catch (error) {
      console.error("Error cleaning temp files:", error)
      throw error
    }
  }

  async cleanupOrphanedAssets(validProductUids) {
    try {
      const productDirs = await fs.readdir(this.assetsDir)
      const validUids = new Set(validProductUids)
      let cleanedCount = 0

      for (const dir of productDirs) {
        if (!validUids.has(dir)) {
          const dirPath = path.join(this.assetsDir, dir)
          await fs.rmdir(dirPath, { recursive: true })
          cleanedCount++
        }
      }

      return { cleanedDirectories: cleanedCount }
    } catch (error) {
      console.error("Error cleaning orphaned assets:", error)
      throw error
    }
  }

  // Multer configuration for file uploads
  getMulterConfig() {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, this.uploadsDir)
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
        cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname))
      },
    })

    const fileFilter = (req, file, cb) => {
      const allowedTypes = [
        "model/gltf-binary",
        "application/octet-stream", // GLB files might be detected as this
        "image/png",
        "image/jpeg",
        "image/jpg",
        "application/json",
      ]

      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true)
      } else {
        cb(new Error("Invalid file type"), false)
      }
    }

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
      },
    })
  }
}

module.exports = new FileManager()
