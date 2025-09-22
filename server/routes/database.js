const express = require("express")
const router = express.Router()
const DatabaseService = require("../services/DatabaseService")

// Get database statistics
router.get("/stats", async (req, res) => {
  try {
    const stats = await DatabaseService.getProductStats()
    res.json(stats)
  } catch (error) {
    console.error("Database stats error:", error)
    res.status(500).json({ message: "Failed to fetch database statistics" })
  }
})

// Search products
router.get("/search", async (req, res) => {
  try {
    const { q: searchTerm, category, status, sourceSite } = req.query

    if (!searchTerm) {
      return res.status(400).json({ message: "Search term is required" })
    }

    const filters = { category, status, sourceSite }
    const results = await DatabaseService.searchProducts(searchTerm, filters)

    res.json({
      searchTerm,
      results,
      count: results.length,
    })
  } catch (error) {
    console.error("Search error:", error)
    res.status(500).json({ message: "Search failed" })
  }
})

// Bulk operations
router.post("/bulk/update", async (req, res) => {
  try {
    const { filter, updateData } = req.body

    if (!filter || !updateData) {
      return res.status(400).json({ message: "Filter and update data are required" })
    }

    const result = await DatabaseService.bulkUpdateProducts(filter, updateData)

    res.json({
      message: "Bulk update completed",
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount,
    })
  } catch (error) {
    console.error("Bulk update error:", error)
    res.status(500).json({ message: "Bulk update failed" })
  }
})

router.post("/bulk/delete", async (req, res) => {
  try {
    const { filter } = req.body

    if (!filter) {
      return res.status(400).json({ message: "Filter is required" })
    }

    const result = await DatabaseService.bulkDeleteProducts(filter)

    res.json({
      message: "Bulk delete completed",
      deletedCount: result.deletedCount,
    })
  } catch (error) {
    console.error("Bulk delete error:", error)
    res.status(500).json({ message: "Bulk delete failed" })
  }
})

// Database maintenance
router.post("/cleanup/assets", async (req, res) => {
  try {
    const result = await DatabaseService.cleanupOrphanedAssets()
    res.json({
      message: "Asset cleanup completed",
      ...result,
    })
  } catch (error) {
    console.error("Asset cleanup error:", error)
    res.status(500).json({ message: "Asset cleanup failed" })
  }
})

// Database health check
router.get("/health", async (req, res) => {
  try {
    const health = await DatabaseService.getDbHealth()
    res.json(health)
  } catch (error) {
    console.error("Database health check error:", error)
    res.status(500).json({ message: "Database health check failed" })
  }
})

// Scraping jobs management
router.get("/jobs", async (req, res) => {
  try {
    const { page, limit } = req.query
    const jobs = await DatabaseService.getScrapingJobs({ page, limit })
    res.json(jobs)
  } catch (error) {
    console.error("Jobs fetch error:", error)
    res.status(500).json({ message: "Failed to fetch scraping jobs" })
  }
})

router.get("/jobs/:id", async (req, res) => {
  try {
    const job = await DatabaseService.getScrapingJobById(req.params.id)
    if (!job) {
      return res.status(404).json({ message: "Job not found" })
    }
    res.json(job)
  } catch (error) {
    console.error("Job fetch error:", error)
    res.status(500).json({ message: "Failed to fetch scraping job" })
  }
})

module.exports = router
