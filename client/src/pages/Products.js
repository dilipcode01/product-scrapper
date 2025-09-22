"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Search, Filter, Package, Eye, Download, RefreshCw } from "lucide-react"
import api from "../services/api"

const Products = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({
    category: "",
    status: "",
    sourceSite: "",
  })
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  })

  useEffect(() => {
    fetchProducts()
  }, [filters, pagination.currentPage])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: 12,
        ...filters,
      })

      if (searchTerm) {
        params.append("search", searchTerm)
      }

      const response = await api.get(`/products?${params}`)
      setProducts(response.data.products)
      setPagination({
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages,
        totalItems: response.data.total,
      })
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPagination((prev) => ({ ...prev, currentPage: 1 }))
    fetchProducts()
  }

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPagination((prev) => ({ ...prev, currentPage: 1 }))
  }

  const handlePageChange = (page) => {
    setPagination((prev) => ({ ...prev, currentPage: page }))
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your scraped products and 3D assets</p>
        </div>
        <button onClick={fetchProducts} className="btn-primary" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card p-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                className="input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <select
            className="input"
            value={filters.category}
            onChange={(e) => handleFilterChange("category", e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="furniture">Furniture</option>
            <option value="electronics">Electronics</option>
            <option value="clothing">Clothing</option>
            <option value="books">Books</option>
            <option value="toys">Toys</option>
            <option value="kitchen">Kitchen</option>
          </select>

          <select
            className="input"
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
          >
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </select>

          <select
            className="input"
            value={filters.sourceSite}
            onChange={(e) => handleFilterChange("sourceSite", e.target.value)}
          >
            <option value="">All Sites</option>
            <option value="walmart">Walmart</option>
            <option value="amazon">Amazon</option>
            <option value="target">Target</option>
          </select>

          <button type="submit" className="btn-primary">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </button>
        </form>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product._id} className="card overflow-hidden">
                <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                  {product.assets?.renders?.front ? (
                    <img
                      src={`/api/assets/${product.uid}/render_front.png`}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 flex items-center justify-center">
                      <Package className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}
                    >
                      {product.status}
                    </span>
                    <span className="text-xs text-gray-500 uppercase">{product.sourceSite}</span>
                  </div>

                  <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">{product.name}</h3>

                  <p className="text-xs text-gray-500 mb-2">{product.category}</p>

                  {product.dimensions && (
                    <p className="text-xs text-gray-400 mb-3">
                      {product.dimensions.width}×{product.dimensions.height}×{product.dimensions.depth}cm
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <Link to={`/products/${product._id}`} className="btn-outline text-xs px-3 py-1">
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Link>

                    {product.assets?.glbModel && (
                      <a
                        href={`/api/assets/${product.uid}/model.glb`}
                        download
                        className="btn-secondary text-xs px-3 py-1"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        GLB
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {(pagination.currentPage - 1) * 12 + 1} to{" "}
                {Math.min(pagination.currentPage * 12, pagination.totalItems)} of {pagination.totalItems} results
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="btn-outline disabled:opacity-50"
                >
                  Previous
                </button>

                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const page = i + 1
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 text-sm rounded-md ${
                        page === pagination.currentPage ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  )
                })}

                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="btn-outline disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Products
