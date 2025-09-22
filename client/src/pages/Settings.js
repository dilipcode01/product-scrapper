"use client"

import { useState, useEffect } from "react"
import { Save, Database, HardDrive, Trash2, RefreshCw, AlertCircle, CheckCircle } from "lucide-react"
import api from "../services/api"

const Settings = () => {
  const [storageStats, setStorageStats] = useState(null)
  const [dbHealth, setDbHealth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cleanupLoading, setCleanupLoading] = useState(false)
  const [settings, setSettings] = useState({
    useBlender: true,
    renderViews: ["front", "side", "top"],
    optimizeAssets: true,
    maxFileSize: 50,
    autoCleanup: false,
    cleanupInterval: 24,
  })

  useEffect(() => {
    fetchSystemInfo()
  }, [])

  const fetchSystemInfo = async () => {
    try {
      setLoading(true)
      const [storageResponse, healthResponse] = await Promise.all([
        api.get("/files/stats"),
        api.get("/database/health"),
      ])

      setStorageStats(storageResponse.data)
      setDbHealth(healthResponse.data)
    } catch (error) {
      console.error("Error fetching system info:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCleanupTemp = async () => {
    try {
      setCleanupLoading(true)
      const response = await api.post("/files/cleanup/temp", {
        olderThanHours: settings.cleanupInterval,
      })

      alert(`Cleaned up ${response.data.cleanedFiles} temporary files`)
      await fetchSystemInfo()
    } catch (error) {
      console.error("Cleanup error:", error)
      alert("Cleanup failed")
    } finally {
      setCleanupLoading(false)
    }
  }

  const handleCleanupOrphaned = async () => {
    try {
      setCleanupLoading(true)
      const response = await api.post("/files/cleanup/orphaned")

      alert(`Cleaned up ${response.data.cleanedDirectories} orphaned asset directories`)
      await fetchSystemInfo()
    } catch (error) {
      console.error("Cleanup error:", error)
      alert("Cleanup failed")
    } finally {
      setCleanupLoading(false)
    }
  }

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSaveSettings = async () => {
    try {
      // In a real app, you'd save these to a backend endpoint
      localStorage.setItem("scraperSettings", JSON.stringify(settings))
      alert("Settings saved successfully")
    } catch (error) {
      console.error("Save settings error:", error)
      alert("Failed to save settings")
    }
  }

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage application settings and system maintenance</p>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Database Health */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Database Health</h2>
            <Database className="h-5 w-5 text-gray-400" />
          </div>

          {dbHealth && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <div className="flex items-center">
                  {dbHealth.status === "connected" ? (
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      dbHealth.status === "connected" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {dbHealth.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Host</span>
                <span className="text-sm text-gray-900">
                  {dbHealth.host}:{dbHealth.port}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Database</span>
                <span className="text-sm text-gray-900">{dbHealth.name}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Collections</span>
                <span className="text-sm text-gray-900">{dbHealth.collections?.length || 0}</span>
              </div>
            </div>
          )}
        </div>

        {/* Storage Stats */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Storage Usage</h2>
            <HardDrive className="h-5 w-5 text-gray-400" />
          </div>

          {storageStats && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Products</span>
                <span className="text-sm font-medium text-gray-900">{storageStats.totalProducts}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Size</span>
                <span className="text-sm font-medium text-gray-900">{formatBytes(storageStats.totalSize)}</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">GLB Models</span>
                  <span className="text-xs text-gray-700">
                    {storageStats.assetTypes.glb.count} files ({formatBytes(storageStats.assetTypes.glb.size)})
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Images</span>
                  <span className="text-xs text-gray-700">
                    {storageStats.assetTypes.images.count} files ({formatBytes(storageStats.assetTypes.images.size)})
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">JSON Files</span>
                  <span className="text-xs text-gray-700">
                    {storageStats.assetTypes.json.count} files ({formatBytes(storageStats.assetTypes.json.size)})
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Application Settings */}
      <div className="card p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Application Settings</h2>

        <div className="space-y-6">
          {/* 3D Rendering */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">3D Asset Generation</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.useBlender}
                  onChange={(e) => handleSettingChange("useBlender", e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Use Blender for high-quality renders</span>
              </label>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Render Views</label>
                <div className="flex space-x-4">
                  {["front", "side", "top", "perspective"].map((view) => (
                    <label key={view} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.renderViews.includes(view)}
                        onChange={(e) => {
                          const newViews = e.target.checked
                            ? [...settings.renderViews, view]
                            : settings.renderViews.filter((v) => v !== view)
                          handleSettingChange("renderViews", newViews)
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-1 text-sm text-gray-700 capitalize">{view}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* File Management */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">File Management</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.optimizeAssets}
                  onChange={(e) => handleSettingChange("optimizeAssets", e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Automatically optimize assets</span>
              </label>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Max File Size (MB)</label>
                <input
                  type="number"
                  value={settings.maxFileSize}
                  onChange={(e) => handleSettingChange("maxFileSize", Number.parseInt(e.target.value))}
                  className="input w-24"
                  min="1"
                  max="100"
                />
              </div>
            </div>
          </div>

          {/* Cleanup Settings */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Automatic Cleanup</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.autoCleanup}
                  onChange={(e) => handleSettingChange("autoCleanup", e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Enable automatic cleanup</span>
              </label>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Cleanup Interval (hours)</label>
                <input
                  type="number"
                  value={settings.cleanupInterval}
                  onChange={(e) => handleSettingChange("cleanupInterval", Number.parseInt(e.target.value))}
                  className="input w-24"
                  min="1"
                  max="168"
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button onClick={handleSaveSettings} className="btn-primary">
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </button>
          </div>
        </div>
      </div>

      {/* Maintenance */}
      <div className="card p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">System Maintenance</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Cleanup Operations</h3>
            <p className="text-sm text-gray-500">
              Remove temporary files and orphaned assets to free up storage space.
            </p>

            <div className="flex space-x-3">
              <button onClick={handleCleanupTemp} disabled={cleanupLoading} className="btn-secondary">
                <Trash2 className="h-4 w-4 mr-2" />
                Cleanup Temp Files
              </button>

              <button onClick={handleCleanupOrphaned} disabled={cleanupLoading} className="btn-secondary">
                <Trash2 className="h-4 w-4 mr-2" />
                Cleanup Orphaned Assets
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">System Refresh</h3>
            <p className="text-sm text-gray-500">Refresh system information and check for updates.</p>

            <button onClick={fetchSystemInfo} disabled={loading} className="btn-outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh System Info
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
