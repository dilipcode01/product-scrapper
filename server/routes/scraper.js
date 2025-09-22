const express = require("express")
const router = express.Router()
const ScrapingService = require("../services/ScrapingService")
const Product = require("../models/Product")

// Start scraping process
router.post("/scrape", async (req, res) => {
  try {
    const { url, site } = req.body

    if (!url || !site) {
      return res.status(400).json({ message: "URL and site are required" })
    }

    if (!["walmart", "amazon", "target"].includes(site)) {
      return res.status(400).json({ message: "Unsupported site" })
    }

    // Start scraping process
    const scrapingResult = await ScrapingService.scrapeProduct(url, site)

    res.json({
      message: "Scraping completed successfully",
      product: scrapingResult,
    })
  } catch (error) {
    console.error("Scraping error:", error)
    res.status(500).json({
      message: "Scraping failed",
      error: error.message,
    })
  }
})

// Bulk scraping
router.post("/bulk-scrape", async (req, res) => {
  try {
    const { urls } = req.body

    if (!urls || !Array.isArray(urls)) {
      return res.status(400).json({ message: "URLs array is required" })
    }

    const results = []

    for (const urlData of urls) {
      try {
        const result = await ScrapingService.scrapeProduct(urlData.url, urlData.site)
        results.push({ success: true, product: result })
      } catch (error) {
        results.push({ success: false, error: error.message, url: urlData.url })
      }
    }

    res.json({
      message: "Bulk scraping completed",
      results,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    })
  } catch (error) {
    console.error("Bulk scraping error:", error)
    res.status(500).json({ message: "Bulk scraping failed", error: error.message })
  }
})

// Get scraping status
router.get("/status/:productId", async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId)
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    res.json({
      status: product.status,
      progress: ScrapingService.getProgress(product.uid),
    })
  } catch (error) {
    console.error("Status check error:", error)
    res.status(500).json({ message: "Status check failed" })
  }
})

module.exports = router
