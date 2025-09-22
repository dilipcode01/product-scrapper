const puppeteer = require("puppeteer")
const cheerio = require("cheerio")
const axios = require("axios")
const { v4: uuidv4 } = require("uuid")
const Product = require("../models/Product")
const AssetProcessor = require("./AssetProcessor")

class ScrapingService {
  constructor() {
    this.progressMap = new Map()
  }

  async scrapeProduct(url, site) {
    const uid = uuidv4()
    this.updateProgress(uid, "Starting scraping process", 10)

    try {
      let productData

      switch (site) {
        case "walmart":
          productData = await this.scrapeWalmart(url)
          break
        case "amazon":
          productData = await this.scrapeAmazon(url)
          break
        case "target":
          productData = await this.scrapeTarget(url)
          break
        default:
          throw new Error("Unsupported site")
      }

      this.updateProgress(uid, "Product data scraped", 30)

      // Create product entry
      const product = new Product({
        uid,
        ...productData,
        sourceUrl: url,
        sourceSite: site,
        status: "processing",
      })

      await product.save()
      this.updateProgress(uid, "Product saved to database", 50)

      // Process 3D assets
      await AssetProcessor.processAssets(product)
      this.updateProgress(uid, "Assets processed", 90)

      // Update product status
      product.status = "completed"
      await product.save()

      this.updateProgress(uid, "Completed", 100)

      return product
    } catch (error) {
      this.updateProgress(uid, `Error: ${error.message}`, 0)
      throw error
    }
  }

  async scrapeWalmart(url) {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })

    try {
      const page = await browser.newPage()
      await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")

      await page.goto(url, { waitUntil: "networkidle2" })

      const productData = await page.evaluate(() => {
        const getTextContent = (selector) => {
          const element = document.querySelector(selector)
          return element ? element.textContent.trim() : ""
        }

        const name =
          getTextContent('h1[data-automation-id="product-title"]') || getTextContent("h1") || "Unknown Product"

        const description =
          getTextContent('[data-automation-id="product-highlights"]') ||
          getTextContent(".about-desc") ||
          getTextContent(".product-description") ||
          "No description available"

        const priceText =
          getTextContent('[data-automation-id="product-price"]') ||
          getTextContent(".price-current") ||
          getTextContent(".price")

        const price = priceText ? Number.parseFloat(priceText.replace(/[^0-9.]/g, "")) : 0

        // Try to extract category from breadcrumbs
        const breadcrumbs = Array.from(document.querySelectorAll(".breadcrumb a, .breadcrumb-list a"))
          .map((a) => a.textContent.trim())
          .filter((text) => text && text !== "Home")

        const category = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1] : "General"

        return {
          name,
          description,
          price,
          category: category.toLowerCase(),
        }
      })

      return this.enrichProductData(productData)
    } finally {
      await browser.close()
    }
  }

  async scrapeAmazon(url) {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })

    try {
      const page = await browser.newPage()
      await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")

      await page.goto(url, { waitUntil: "networkidle2" })

      const productData = await page.evaluate(() => {
        const getTextContent = (selector) => {
          const element = document.querySelector(selector)
          return element ? element.textContent.trim() : ""
        }

        const name = getTextContent("#productTitle") || getTextContent("h1.a-size-large") || "Unknown Product"

        const description =
          getTextContent("#feature-bullets ul") ||
          getTextContent("#productDescription") ||
          getTextContent(".a-unordered-list.a-vertical") ||
          "No description available"

        const priceText =
          getTextContent(".a-price-whole") || getTextContent(".a-offscreen") || getTextContent(".a-price")

        const price = priceText ? Number.parseFloat(priceText.replace(/[^0-9.]/g, "")) : 0

        // Extract category from breadcrumbs
        const breadcrumbs = Array.from(document.querySelectorAll("#wayfinding-breadcrumbs_feature_div a"))
          .map((a) => a.textContent.trim())
          .filter((text) => text)

        const category = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1] : "General"

        return {
          name,
          description,
          price,
          category: category.toLowerCase(),
        }
      })

      return this.enrichProductData(productData)
    } finally {
      await browser.close()
    }
  }

  async scrapeTarget(url) {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })

    try {
      const page = await browser.newPage()
      await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")

      await page.goto(url, { waitUntil: "networkidle2" })

      const productData = await page.evaluate(() => {
        const getTextContent = (selector) => {
          const element = document.querySelector(selector)
          return element ? element.textContent.trim() : ""
        }

        const name = getTextContent('h1[data-test="product-title"]') || getTextContent("h1") || "Unknown Product"

        const description =
          getTextContent('[data-test="item-details-description"]') ||
          getTextContent(".ProductDetails__productHighlights") ||
          "No description available"

        const priceText =
          getTextContent('[data-test="product-price"]') || getTextContent(".h-text-red") || getTextContent(".price")

        const price = priceText ? Number.parseFloat(priceText.replace(/[^0-9.]/g, "")) : 0

        // Extract category from breadcrumbs
        const breadcrumbs = Array.from(document.querySelectorAll('[data-test="breadcrumb"] a'))
          .map((a) => a.textContent.trim())
          .filter((text) => text)

        const category = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1] : "General"

        return {
          name,
          description,
          price,
          category: category.toLowerCase(),
        }
      })

      return this.enrichProductData(productData)
    } finally {
      await browser.close()
    }
  }

  enrichProductData(productData) {
    // Generate realistic dimensions based on category
    const dimensions = this.generateDimensions(productData.category)

    return {
      ...productData,
      dimensions,
      assetMetadata: {
        boundingBox: {
          x: dimensions.width / 100,
          y: dimensions.height / 100,
          z: dimensions.depth / 100,
        },
      },
      annotations: {
        materials: this.inferMaterials(productData.category, productData.description),
        composition: this.generateComposition(),
        mass: this.estimateMass(dimensions, productData.category),
        receptacle: this.isReceptacle(productData.category),
        frontView: 0,
        onCeiling: false,
        onWall: this.canBeOnWall(productData.category),
        onFloor: this.canBeOnFloor(productData.category),
        onObject: this.canBeOnObject(productData.category),
        pose_z_rot_angle: 0.0,
        scale: 1.0,
        z_axis_scale: true,
      },
    }
  }

  generateDimensions(category) {
    const dimensionMap = {
      furniture: { width: 80, height: 150, depth: 40 },
      electronics: { width: 30, height: 20, depth: 15 },
      clothing: { width: 40, height: 60, depth: 2 },
      books: { width: 15, height: 23, depth: 3 },
      toys: { width: 25, height: 25, depth: 25 },
      kitchen: { width: 20, height: 15, depth: 20 },
      default: { width: 30, height: 30, depth: 30 },
    }

    const dims = dimensionMap[category] || dimensionMap["default"]
    return {
      ...dims,
      volume: (dims.width * dims.height * dims.depth) / 1000,
    }
  }

  inferMaterials(category, description) {
    const materialMap = {
      furniture: ["wood", "metal", "fabric"],
      electronics: ["plastic", "metal", "glass"],
      clothing: ["cotton", "polyester", "fabric"],
      books: ["paper", "cardboard", "ink"],
      toys: ["plastic", "rubber", "fabric"],
      kitchen: ["stainless steel", "plastic", "glass"],
    }

    return materialMap[category] || ["plastic", "metal", "other"]
  }

  generateComposition() {
    return [0.6, 0.3, 0.1] // Primary, secondary, tertiary material ratios
  }

  estimateMass(dimensions, category) {
    const densityMap = {
      furniture: 0.5,
      electronics: 0.8,
      clothing: 0.1,
      books: 0.3,
      toys: 0.2,
      kitchen: 0.6,
    }

    const density = densityMap[category] || 0.4
    return Math.round(dimensions.volume * density)
  }

  isReceptacle(category) {
    return ["furniture", "kitchen", "storage"].some((cat) => category.includes(cat))
  }

  canBeOnWall(category) {
    return ["furniture", "electronics", "decor"].some((cat) => category.includes(cat))
  }

  canBeOnFloor(category) {
    return !["small electronics", "jewelry"].some((cat) => category.includes(cat))
  }

  canBeOnObject(category) {
    return ["electronics", "books", "small items"].some((cat) => category.includes(cat))
  }

  updateProgress(uid, message, percentage) {
    this.progressMap.set(uid, { message, percentage, timestamp: Date.now() })
  }

  getProgress(uid) {
    return this.progressMap.get(uid) || { message: "Unknown", percentage: 0 }
  }
}

module.exports = new ScrapingService()
