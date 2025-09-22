const Product = require("../models/Product")
const ScrapingJob = require("../models/ScrapingJob")
const mongoose = require("mongoose")

class DatabaseService {
  // Product operations
  async createProduct(productData) {
    try {
      const product = new Product(productData)
      return await product.save()
    } catch (error) {
      console.error("Error creating product:", error)
      throw error
    }
  }

  async getProducts(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 10, sortBy = "scrapedAt", sortOrder = -1 } = pagination
      const { category, status, sourceSite, search } = filters

      const query = {}

      if (category) query.category = new RegExp(category, "i")
      if (status) query.status = status
      if (sourceSite) query.sourceSite = sourceSite
      if (search) {
        query.$or = [{ name: new RegExp(search, "i") }, { description: new RegExp(search, "i") }]
      }

      const products = await Product.find(query)
        .sort({ [sortBy]: sortOrder })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean()

      const total = await Product.countDocuments(query)

      return {
        products,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
      }
    } catch (error) {
      console.error("Error fetching products:", error)
      throw error
    }
  }

  async getProductById(id) {
    try {
      return await Product.findById(id)
    } catch (error) {
      console.error("Error fetching product by ID:", error)
      throw error
    }
  }

  async updateProduct(id, updateData) {
    try {
      return await Product.findByIdAndUpdate(id, updateData, { new: true })
    } catch (error) {
      console.error("Error updating product:", error)
      throw error
    }
  }

  async deleteProduct(id) {
    try {
      return await Product.findByIdAndDelete(id)
    } catch (error) {
      console.error("Error deleting product:", error)
      throw error
    }
  }

  async getProductStats() {
    try {
      const stats = await Product.aggregate([
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            completedProducts: {
              $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
            },
            processingProducts: {
              $sum: { $cond: [{ $eq: ["$status", "processing"] }, 1, 0] },
            },
            failedProducts: {
              $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
            },
          },
        },
      ])

      const categoryStats = await Product.aggregate([
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ])

      const siteStats = await Product.aggregate([
        {
          $group: {
            _id: "$sourceSite",
            count: { $sum: 1 },
          },
        },
      ])

      return {
        overview: stats[0] || {
          totalProducts: 0,
          completedProducts: 0,
          processingProducts: 0,
          failedProducts: 0,
        },
        byCategory: categoryStats,
        bySite: siteStats,
      }
    } catch (error) {
      console.error("Error fetching product stats:", error)
      throw error
    }
  }

  // Scraping job operations
  async createScrapingJob(jobData) {
    try {
      const job = new ScrapingJob(jobData)
      return await job.save()
    } catch (error) {
      console.error("Error creating scraping job:", error)
      throw error
    }
  }

  async getScrapingJobs(pagination = {}) {
    try {
      const { page = 1, limit = 10 } = pagination

      const jobs = await ScrapingJob.find()
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate("urls.productId", "name category status")
        .lean()

      const total = await ScrapingJob.countDocuments()

      return {
        jobs,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
      }
    } catch (error) {
      console.error("Error fetching scraping jobs:", error)
      throw error
    }
  }

  async getScrapingJobById(id) {
    try {
      return await ScrapingJob.findById(id).populate("urls.productId")
    } catch (error) {
      console.error("Error fetching scraping job by ID:", error)
      throw error
    }
  }

  async updateScrapingJob(id, updateData) {
    try {
      return await ScrapingJob.findByIdAndUpdate(id, updateData, { new: true })
    } catch (error) {
      console.error("Error updating scraping job:", error)
      throw error
    }
  }

  // Bulk operations
  async bulkUpdateProducts(filter, updateData) {
    try {
      return await Product.updateMany(filter, updateData)
    } catch (error) {
      console.error("Error bulk updating products:", error)
      throw error
    }
  }

  async bulkDeleteProducts(filter) {
    try {
      return await Product.deleteMany(filter)
    } catch (error) {
      console.error("Error bulk deleting products:", error)
      throw error
    }
  }

  // Search and filtering
  async searchProducts(searchTerm, filters = {}) {
    try {
      const query = {
        $or: [
          { name: new RegExp(searchTerm, "i") },
          { description: new RegExp(searchTerm, "i") },
          { category: new RegExp(searchTerm, "i") },
        ],
      }

      if (filters.category) query.category = filters.category
      if (filters.status) query.status = filters.status
      if (filters.sourceSite) query.sourceSite = filters.sourceSite

      return await Product.find(query).sort({ scrapedAt: -1 }).limit(50).lean()
    } catch (error) {
      console.error("Error searching products:", error)
      throw error
    }
  }

  // Data validation and cleanup
  async validateProductData(productData) {
    const errors = []

    if (!productData.name || productData.name.trim().length === 0) {
      errors.push("Product name is required")
    }

    if (!productData.category || productData.category.trim().length === 0) {
      errors.push("Product category is required")
    }

    if (!productData.sourceUrl || !this.isValidUrl(productData.sourceUrl)) {
      errors.push("Valid source URL is required")
    }

    if (!productData.sourceSite || !["walmart", "amazon", "target"].includes(productData.sourceSite)) {
      errors.push("Valid source site is required")
    }

    if (productData.dimensions) {
      const { width, height, depth } = productData.dimensions
      if (width <= 0 || height <= 0 || depth <= 0) {
        errors.push("Product dimensions must be positive numbers")
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  isValidUrl(string) {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  // Database maintenance
  async cleanupOrphanedAssets() {
    try {
      const fs = require("fs").promises
      const path = require("path")

      const assetsDir = path.join(__dirname, "../assets")
      const products = await Product.find({}, "uid").lean()
      const validUids = new Set(products.map((p) => p.uid))

      const assetDirs = await fs.readdir(assetsDir)
      let cleanedCount = 0

      for (const dir of assetDirs) {
        if (!validUids.has(dir)) {
          const dirPath = path.join(assetsDir, dir)
          await fs.rmdir(dirPath, { recursive: true })
          cleanedCount++
        }
      }

      return { cleanedDirectories: cleanedCount }
    } catch (error) {
      console.error("Error cleaning up orphaned assets:", error)
      throw error
    }
  }

  async getDbHealth() {
    try {
      const dbState = mongoose.connection.readyState
      const states = {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting",
      }

      const collections = await mongoose.connection.db.listCollections().toArray()

      return {
        status: states[dbState],
        collections: collections.map((c) => ({
          name: c.name,
          type: c.type,
        })),
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name,
      }
    } catch (error) {
      console.error("Error checking database health:", error)
      throw error
    }
  }
}

module.exports = new DatabaseService()
