"use client"

import { useState, useEffect } from "react"
import { RefreshCw, Clock, CheckCircle, XCircle, Eye, Calendar } from "lucide-react"
import api from "../services/api"

const Jobs = () => {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  })

  useEffect(() => {
    fetchJobs()
  }, [pagination.currentPage])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/database/jobs?page=${pagination.currentPage}&limit=10`)
      setJobs(response.data.jobs)
      setPagination(response.data.pagination)
    } catch (error) {
      console.error("Error fetching jobs:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "processing":
        return <Clock className="h-5 w-5 text-yellow-500" />
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
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
      case "partial":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handlePageChange = (page) => {
    setPagination((prev) => ({ ...prev, currentPage: page }))
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scraping Jobs</h1>
          <p className="mt-1 text-sm text-gray-500">Monitor and manage your scraping operations</p>
        </div>
        <button onClick={fetchJobs} className="btn-primary" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Jobs List */}
      <div className="card">
        {jobs.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs found</h3>
            <p className="mt-1 text-sm text-gray-500">Start scraping some products to see jobs here.</p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    URLs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {jobs.map((job) => (
                  <tr key={job._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(job.status)}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{job.jobId.substring(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              {job.progress?.completed || 0} / {job.progress?.total || 0}
                            </span>
                            <span className="text-gray-600">
                              {job.progress?.total > 0
                                ? Math.round(((job.progress?.completed || 0) / job.progress.total) * 100)
                                : 0}
                              %
                            </span>
                          </div>
                          <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${
                                  job.progress?.total > 0
                                    ? ((job.progress?.completed || 0) / job.progress.total) * 100
                                    : 0
                                }%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{job.urls?.length || 0} URLs</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(job.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {(pagination.currentPage - 1) * 10 + 1} to{" "}
            {Math.min(pagination.currentPage * 10, pagination.totalItems)} of {pagination.totalItems} results
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

      {/* Job Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Jobs</p>
              <p className="text-lg font-semibold text-gray-900">{pagination.totalItems}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-lg font-semibold text-gray-900">
                {jobs.filter((job) => job.status === "completed").length}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Processing</p>
              <p className="text-lg font-semibold text-gray-900">
                {jobs.filter((job) => job.status === "processing").length}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Failed</p>
              <p className="text-lg font-semibold text-gray-900">
                {jobs.filter((job) => job.status === "failed").length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Jobs
