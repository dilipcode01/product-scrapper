const fs = require("fs").promises
const path = require("path")

class GLBGenerator {
  constructor() {
    this.gltfVersion = "2.0"
  }

  async generateGLB(product, outputPath) {
    try {
      const gltfData = this.createGLTFStructure(product)
      const binaryData = this.createBinaryData(product)

      const glbBuffer = this.createGLBFile(gltfData, binaryData)
      await fs.writeFile(outputPath, glbBuffer)

      return outputPath
    } catch (error) {
      console.error("GLB generation error:", error)
      throw error
    }
  }

  createGLTFStructure(product) {
    const { width, height, depth } = product.dimensions
    const scale = 0.01 // Convert cm to meters

    return {
      asset: {
        version: this.gltfVersion,
        generator: "E-commerce Scraper GLB Generator",
      },
      scene: 0,
      scenes: [
        {
          nodes: [0],
          name: product.name,
        },
      ],
      nodes: [
        {
          mesh: 0,
          name: product.name,
          scale: [scale, scale, scale],
        },
      ],
      meshes: [
        {
          primitives: [
            {
              attributes: {
                POSITION: 0,
                NORMAL: 1,
                TEXCOORD_0: 2,
              },
              indices: 3,
              material: 0,
            },
          ],
          name: `${product.name}_mesh`,
        },
      ],
      materials: [this.createMaterial(product)],
      accessors: [
        // Position accessor
        {
          bufferView: 0,
          componentType: 5126, // FLOAT
          count: 24, // 6 faces * 4 vertices
          type: "VEC3",
          max: [width / 2, height, depth / 2],
          min: [-width / 2, 0, -depth / 2],
        },
        // Normal accessor
        {
          bufferView: 1,
          componentType: 5126, // FLOAT
          count: 24,
          type: "VEC3",
        },
        // Texture coordinate accessor
        {
          bufferView: 2,
          componentType: 5126, // FLOAT
          count: 24,
          type: "VEC2",
        },
        // Indices accessor
        {
          bufferView: 3,
          componentType: 5123, // UNSIGNED_SHORT
          count: 36, // 6 faces * 2 triangles * 3 vertices
          type: "SCALAR",
        },
      ],
      bufferViews: [
        // Positions
        {
          buffer: 0,
          byteOffset: 0,
          byteLength: 288, // 24 vertices * 3 components * 4 bytes
          target: 34962, // ARRAY_BUFFER
        },
        // Normals
        {
          buffer: 0,
          byteOffset: 288,
          byteLength: 288,
          target: 34962, // ARRAY_BUFFER
        },
        // Texture coordinates
        {
          buffer: 0,
          byteOffset: 576,
          byteLength: 192, // 24 vertices * 2 components * 4 bytes
          target: 34962, // ARRAY_BUFFER
        },
        // Indices
        {
          buffer: 0,
          byteOffset: 768,
          byteLength: 72, // 36 indices * 2 bytes
          target: 34963, // ELEMENT_ARRAY_BUFFER
        },
      ],
      buffers: [
        {
          byteLength: 840, // Total buffer size
        },
      ],
    }
  }

  createMaterial(product) {
    const materials = product.annotations.materials || ["plastic"]
    const primaryMaterial = materials[0]

    const materialProperties = {
      wood: {
        baseColorFactor: [0.6, 0.4, 0.2, 1.0],
        metallicFactor: 0.0,
        roughnessFactor: 0.8,
      },
      metal: {
        baseColorFactor: [0.7, 0.7, 0.7, 1.0],
        metallicFactor: 1.0,
        roughnessFactor: 0.2,
      },
      plastic: {
        baseColorFactor: [0.8, 0.8, 0.8, 1.0],
        metallicFactor: 0.0,
        roughnessFactor: 0.4,
      },
      fabric: {
        baseColorFactor: [0.5, 0.5, 0.7, 1.0],
        metallicFactor: 0.0,
        roughnessFactor: 0.9,
      },
      glass: {
        baseColorFactor: [0.9, 0.9, 0.9, 0.8],
        metallicFactor: 0.0,
        roughnessFactor: 0.1,
      },
    }

    const props = materialProperties[primaryMaterial] || materialProperties.plastic

    return {
      name: `${product.category}_material`,
      pbrMetallicRoughness: {
        baseColorFactor: props.baseColorFactor,
        metallicFactor: props.metallicFactor,
        roughnessFactor: props.roughnessFactor,
      },
      doubleSided: true,
    }
  }

  createBinaryData(product) {
    const { width, height, depth } = product.dimensions
    const w = width / 2
    const h = height
    const d = depth / 2

    // Create box vertices (24 vertices for proper normals and UVs)
    const positions = new Float32Array([
      // Front face
      -w,
      0,
      d,
      w,
      0,
      d,
      w,
      h,
      d,
      -w,
      h,
      d,
      // Back face
      w,
      0,
      -d,
      -w,
      0,
      -d,
      -w,
      h,
      -d,
      w,
      h,
      -d,
      // Top face
      -w,
      h,
      d,
      w,
      h,
      d,
      w,
      h,
      -d,
      -w,
      h,
      -d,
      // Bottom face
      -w,
      0,
      -d,
      w,
      0,
      -d,
      w,
      0,
      d,
      -w,
      0,
      d,
      // Right face
      w,
      0,
      d,
      w,
      0,
      -d,
      w,
      h,
      -d,
      w,
      h,
      d,
      // Left face
      -w,
      0,
      -d,
      -w,
      0,
      d,
      -w,
      h,
      d,
      -w,
      h,
      -d,
    ])

    // Normals for each face
    const normals = new Float32Array([
      // Front face
      0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
      // Back face
      0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
      // Top face
      0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
      // Bottom face
      0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
      // Right face
      1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
      // Left face
      -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
    ])

    // Texture coordinates
    const texCoords = new Float32Array([
      // Front face
      0, 0, 1, 0, 1, 1, 0, 1,
      // Back face
      0, 0, 1, 0, 1, 1, 0, 1,
      // Top face
      0, 0, 1, 0, 1, 1, 0, 1,
      // Bottom face
      0, 0, 1, 0, 1, 1, 0, 1,
      // Right face
      0, 0, 1, 0, 1, 1, 0, 1,
      // Left face
      0, 0, 1, 0, 1, 1, 0, 1,
    ])

    // Indices for triangles
    const indices = new Uint16Array([
      0,
      1,
      2,
      0,
      2,
      3, // Front face
      4,
      5,
      6,
      4,
      6,
      7, // Back face
      8,
      9,
      10,
      8,
      10,
      11, // Top face
      12,
      13,
      14,
      12,
      14,
      15, // Bottom face
      16,
      17,
      18,
      16,
      18,
      19, // Right face
      20,
      21,
      22,
      20,
      22,
      23, // Left face
    ])

    // Combine all data into single buffer
    const totalSize = positions.byteLength + normals.byteLength + texCoords.byteLength + indices.byteLength
    const buffer = new ArrayBuffer(totalSize)
    const view = new Uint8Array(buffer)

    let offset = 0
    view.set(new Uint8Array(positions.buffer), offset)
    offset += positions.byteLength

    view.set(new Uint8Array(normals.buffer), offset)
    offset += normals.byteLength

    view.set(new Uint8Array(texCoords.buffer), offset)
    offset += texCoords.byteLength

    view.set(new Uint8Array(indices.buffer), offset)

    return buffer
  }

  createGLBFile(gltfData, binaryData) {
    const gltfJson = JSON.stringify(gltfData)
    const gltfBuffer = Buffer.from(gltfJson)

    // Pad JSON to 4-byte boundary
    const jsonPadding = (4 - (gltfBuffer.length % 4)) % 4
    const paddedJsonBuffer = Buffer.concat([gltfBuffer, Buffer.alloc(jsonPadding, 0x20)])

    // Pad binary data to 4-byte boundary
    const binaryPadding = (4 - (binaryData.byteLength % 4)) % 4
    const paddedBinaryBuffer = Buffer.concat([Buffer.from(binaryData), Buffer.alloc(binaryPadding, 0)])

    // GLB header
    const header = Buffer.alloc(12)
    header.writeUInt32LE(0x46546c67, 0) // 'glTF' magic
    header.writeUInt32LE(2, 4) // version
    header.writeUInt32LE(12 + 8 + paddedJsonBuffer.length + 8 + paddedBinaryBuffer.length, 8) // total length

    // JSON chunk header
    const jsonChunkHeader = Buffer.alloc(8)
    jsonChunkHeader.writeUInt32LE(paddedJsonBuffer.length, 0) // chunk length
    jsonChunkHeader.writeUInt32LE(0x4e4f534a, 4) // 'JSON' type

    // Binary chunk header
    const binaryChunkHeader = Buffer.alloc(8)
    binaryChunkHeader.writeUInt32LE(paddedBinaryBuffer.length, 0) // chunk length
    binaryChunkHeader.writeUInt32LE(0x004e4942, 4) // 'BIN\0' type

    return Buffer.concat([header, jsonChunkHeader, paddedJsonBuffer, binaryChunkHeader, paddedBinaryBuffer])
  }
}

module.exports = new GLBGenerator()
