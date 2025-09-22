const mongoose = require("mongoose")

const ProductSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  sourceUrl: {
    type: String,
    required: true,
  },
  sourceSite: {
    type: String,
    enum: ["walmart", "amazon", "target"],
    required: true,
  },
  price: {
    type: Number,
  },
  dimensions: {
    width: Number,
    height: Number,
    depth: Number,
    volume: Number,
  },
  assetMetadata: {
    boundingBox: {
      x: Number,
      y: Number,
      z: Number,
    },
  },
  annotations: {
    materials: [String],
    composition: [Number],
    mass: Number,
    receptacle: Boolean,
    frontView: Number,
    onCeiling: Boolean,
    onWall: Boolean,
    onFloor: Boolean,
    onObject: Boolean,
    pose_z_rot_angle: Number,
    scale: Number,
    z_axis_scale: Boolean,
  },
  assets: {
    glbModel: String,
    dataJson: String,
    renders: {
      front: String,
      side: String,
      top: String,
    },
  },
  scrapedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["scraped", "processing", "completed", "failed"],
    default: "scraped",
  },
})

module.exports = mongoose.model("Product", ProductSchema)
