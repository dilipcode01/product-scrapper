"use client"

import { useState } from "react"
import { Plus, Trash2, Play, AlertCircle } from "lucide-react"
import api from "../services/api"

const Scraper = () => {
  const [urls, setUrls] = useState([{ url: "", site: "walmart" }])
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState("")

  const addUrl = () => {
    setUrls([...urls, { url: "", site: "walmart" }])
  }

  const removeUrl = (index) => {
    if (urls.length > 1) {
      setUrls(urls.filter((_, i) => i !== index))
    }
  }

  const updateUrl = (index, field, value) => {
    const newUrls = [...urls]
    newUrls[index][field] = value
    setUrls(newUrls)
  }

  const validateUrls = () => {
    const errors = []
    urls.forEach((urlData, index) => {
      if (!urlData.url.trim()) {
        errors.push(`URL ${index + 1} is required`)
      } else {
        try {
          new URL(urlData.url)
        } catch {
          errors.push(`URL ${index + 1} is not valid`)
        }
      }
    })
    return errors
  }

  const handleScrape = async () => {
    const validationErrors = validateUrls()
    if (validationErrors.length > 0) {
      setError(validationErrors.join(", "))
      return
    }

    setLoading(true)
    setError("")
    setResults(null)

    try {
      if (urls.length === 1) {
        // Single URL scraping
        const response = await api.post("/scraper/scrape", urls[0])
        setResults({
          type: "single",
          data: response.data,
        })
      } else {
        // Bulk scraping
        const response = await api.post("/scraper/bulk-scrape", { urls })
        setResults({
          type: "bulk",
          data: response.data,
        })
      }
    } catch (error) {
      console.error("Scraping error:", error)
      setError(error.response?.data?.message || "Scraping failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Web Scraper</h1>
        <p className="mt-1 text-sm text-gray-500">
          Scrape product data from e-commerce websites and generate 3D assets
        </p>
      </div>

      {/* URL Input Form */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Product URLs</h2>
          <button onClick={addUrl} className="btn-outline" disabled={loading}>
            <Plus className="h-4 w-4 mr-2" />
            Add URL
          </button>
        </div>

        <div className="space-y-4">
          {urls.map((urlData, index) => (
            <div key={index} className="flex gap-4 items-start">
              <div className="flex-1">
                <input
                  type="url"
                  placeholder="https://www.walmart.com/ip/..."
                  className="input"
                  value={urlData.url}
                  onChange={(e) => updateUrl(index, "url", e.target.value)}
                  disabled={loading}
                />
              </div>

              <select
                className="input w-32"
                value={urlData.site}
                onChange={(e) => updateUrl(index, "site", e.target.value)}
                disabled={loading}
              >
                <option value="walmart">Walmart</option>
                <option value="amazon">Amazon</option>
                <option value="target">Target</option>
              </select>

              {urls.length > 1 && (
                <button onClick={() => removeUrl(index)} className="btn-outline p-2" disabled={loading}>
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6">
          <button onClick={handleScrape} disabled={loading || urls.some((u) => !u.url.trim())} className="btn-primary">
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Scraping...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Scraping
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {results && (
        <div className="card p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Scraping Results</h2>

          {results.type === "single" ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <h3 className="font-medium text-green-800">{results.data.product.name}</h3>
                <p className="text-sm text-green-600 mt-1">
                  Category: {results.data.product.category} • Site: {results.data.product.sourceSite} • Status:{" "}
                  {results.data.product.status}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{results.data.successful}</div>
                  <div className="text-sm text-gray-500">Successful</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{results.data.failed}</div>
                  <div className="text-sm text-gray-500">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{results.data.results.length}</div>
                  <div className="text-sm text-gray-500">Total</div>
                </div>
              </div>

              <div className="space-y-2">
                {results.data.results.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-md border ${
                      result.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                    }`}
                  >
                    {result.success ? (
                      <div>
                        <h4 className="font-medium text-green-800">{result.product.name}</h4>
                        <p className="text-sm text-green-600">
                          {result.product.category} • {result.product.sourceSite}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <h4 className="font-medium text-red-800">Failed</h4>
                        <p className="text-sm text-red-600">{result.error}</p>
                        <p className="text-xs text-red-500 mt-1">{result.url}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="card p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Instructions</h2>
        <div className="prose prose-sm text-gray-600">
          <ul>
            <li>Enter valid product URLs from Walmart, Amazon, or Target</li>
            <li>Select the correct source site for each URL</li>
            <li>The scraper will extract product information and generate 3D assets</li>
            <li>Processing includes creating GLB models and render images</li>
            <li>You can track progress in the Jobs section</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Scraper
