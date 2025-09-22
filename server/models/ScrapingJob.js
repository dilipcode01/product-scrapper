const mongoose = require("mongoose")

const ScrapingJobSchema = new mongoose.Schema({
  jobId: {
    type: String,
    required: true,
    unique: true,
  },
  urls: [
    {
      url: String,
      site: {
        type: String,
        enum: ["walmart", "amazon", "target"],
      },
      status: {
        type: String,
        enum: ["pending", "processing", "completed", "failed"],
        default: "pending",
      },
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
      error: String,
    },
  ],
  status: {
    type: String,
    enum: ["pending", "processing", "completed", "failed", "partial"],
    default: "pending",
  },
  progress: {
    total: Number,
    completed: Number,
    failed: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: Date,
  createdBy: String, // For future user management
  settings: {
    generateAssets: {
      type: Boolean,
      default: true,
    },
    useBlender: {
      type: Boolean,
      default: true,
    },
    renderViews: {
      type: [String],
      default: ["front", "side", "top"],
    },
  },
})

module.exports = mongoose.model("ScrapingJob", ScrapingJobSchema)
