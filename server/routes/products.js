const express = require("express")
const router = express.Router()
const Product = require("../models/Product")

// Get all products
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, category, status } = req.query
    const query = {}

    if (category) query.category = category
    if (status) query.status = status

    const products = await Product.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ scrapedAt: -1 })

    const total = await Product.countDocuments(query)

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    })
  } catch (error) {
    console.error("Error fetching products:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get single product
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }
    res.json(product)
  } catch (error) {
    console.error("Error fetching product:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Update product
router.put("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }
    res.json(product)
  } catch (error) {
    console.error("Error updating product:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Delete product
router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id)
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }
    res.json({ message: "Product deleted successfully" })
  } catch (error) {
    console.error("Error deleting product:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
