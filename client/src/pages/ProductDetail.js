"use client"

import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { ArrowLeft, Download, RefreshCw, Eye, Package, Calendar, Globe, Tag } from "lucide-react"
import api from "../services/api"

const ProductDetail = () => {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [assets, setAssets] = useState(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)

  useEffect(() => {
    fetchProductDetails()
  }, [id])

  const fetchProductDetails = async () => {
    try {
      setLoading(true)
      const [productResponse, assetsResponse] = await Promise.all([
        api.get(`/products/${id}`),
        api.get(`/files/assets/${id}`),
      ])

      setProduct(productResponse.data)
      setAssets(assetsResponse.data)
    } catch (error) {
      console.error("Error fetching product details:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerateAssets = async () => {
    try {
      setRegenerating(true)
      await api.post(`/assets/regenerate/${id}`)
      await fetchProductDetails()
    } catch (error) {
      console.error("Error regenerating assets:", error)
    } finally {
      setRegenerating(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "processing":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Product not found</h3>
        <p className="mt-1 text-sm text-gray-500">The product you're looking for doesn't exist.</p>
        <div className="mt-6">
          <Link to="/products" className="btn-primary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/products" className="btn-outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-sm text-gray-500">Product Details</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(product.status)}`}
          >
            {product.status}
          </span>
          <button onClick={handleRegenerateAssets} disabled={regenerating} className="btn-secondary">
            <RefreshCw className={`h-4 w-4 mr-2 ${regenerating ? "animate-spin" : ""}`} />
            Regenerate Assets
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Info */}
          <div className="card p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Product Information</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Category</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  <Tag className="h-4 w-4 mr-1" />
                  {product.category}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Source Site</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  <Globe className="h-4 w-4 mr-1" />
                  {product.sourceSite}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Price</dt>
                <dd className="mt-1 text-sm text-gray-900">{product.price ? `$${product.price.toFixed(2)}` : "N/A"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Scraped At</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(product.scrapedAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>

          {/* Description */}
          <div className="card p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Description</h2>
            <p className="text-sm text-gray-700 leading-relaxed">{product.description}</p>
          </div>

          {/* Dimensions */}
          {product.dimensions && (
            <div className="card p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Dimensions</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{product.dimensions.width}</div>
                  <div className="text-sm text-gray-500">Width (cm)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{product.dimensions.height}</div>
                  <div className="text-sm text-gray-500">Height (cm)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{product.dimensions.depth}</div>
                  <div className="text-sm text-gray-500">Depth (cm)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{product.dimensions.volume}</div>
                  <div className="text-sm text-gray-500">Volume (L)</div>
                </div>
              </div>
            </div>
          )}

          {/* Materials & Annotations */}
          {product.annotations && (
            <div className="card p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Materials & Properties</h2>
              <div className="space-y-4">
                {product.annotations.materials && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Materials</h3>
                    <div className="flex flex-wrap gap-2">
                      {product.annotations.materials.map((material, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {material}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Mass:</span>
                    <span className="ml-1 text-gray-900">{product.annotations.mass || "N/A"} kg</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Receptacle:</span>
                    <span className="ml-1 text-gray-900">{product.annotations.receptacle ? "Yes" : "No"}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">On Floor:</span>
                    <span className="ml-1 text-gray-900">{product.annotations.onFloor ? "Yes" : "No"}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">On Wall:</span>
                    <span className="ml-1 text-gray-900">{product.annotations.onWall ? "Yes" : "No"}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Scale:</span>
                    <span className="ml-1 text-gray-900">{product.annotations.scale || 1.0}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Assets */}
        <div className="space-y-6">
          {/* 3D Model */}
          <div className="card p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">3D Model</h2>
            {assets?.assets?.["model.glb"]?.exists ? (
              <div className="space-y-3">
                <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                  <Package className="h-12 w-12 text-gray-400" />
                </div>
                <div className="text-sm text-gray-600">
                  Size: {(assets.assets["model.glb"].size / 1024 / 1024).toFixed(2)} MB
                </div>
                <a href={assets.assets["model.glb"].url} download className="btn-primary w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download GLB
                </a>
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No 3D model available</p>
              </div>
            )}
          </div>

          {/* Renders */}
          <div className="card p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Renders</h2>
            <div className="space-y-4">
              {["render_front.png", "render_side.png", "render_top.png"].map((renderFile) => {
                const renderName = renderFile.replace("render_", "").replace(".png", "")
                const asset = assets?.assets?.[renderFile]

                return (
                  <div key={renderFile} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {asset?.exists ? (
                        <img
                          src={asset.url || "/placeholder.svg"}
                          alt={`${renderName} view`}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                          <Eye className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900 capitalize">{renderName} View</div>
                        {asset?.exists && (
                          <div className="text-xs text-gray-500">{(asset.size / 1024).toFixed(0)} KB</div>
                        )}
                      </div>
                    </div>
                    {asset?.exists && (
                      <a href={asset.url} download className="btn-outline text-xs px-2 py-1">
                        <Download className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Data JSON */}
          <div className="card p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Data File</h2>
            {assets?.assets?.["data.json"]?.exists ? (
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  Size: {(assets.assets["data.json"].size / 1024).toFixed(1)} KB
                </div>
                <a href={assets.assets["data.json"].url} download className="btn-secondary w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download JSON
                </a>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">No data file available</p>
              </div>
            )}
          </div>

          {/* Source Link */}
          <div className="card p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Source</h2>
            <a href={product.sourceUrl} target="_blank" rel="noopener noreferrer" className="btn-outline w-full">
              <Globe className="h-4 w-4 mr-2" />
              View Original
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail
