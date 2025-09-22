const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const path = require("path")
require("dotenv").config()

const app = express()

// Middleware
app.use(cors())
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ extended: true, limit: "50mb" }))

// Serve static files (for GLB models and renders)
app.use("/assets", express.static(path.join(__dirname, "assets")))

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/ecommerce_scraper", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB connection error:", err))

// Routes
app.use("/api/products", require("./routes/products"))
app.use("/api/scraper", require("./routes/scraper"))
app.use("/api/assets", require("./routes/assets"))
app.use("/api/database", require("./routes/database"))
app.use("/api/files", require("./routes/files"))

// Serve React app in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/build")))

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/build", "index.html"))
  })
}

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
