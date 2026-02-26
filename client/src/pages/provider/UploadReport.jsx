import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../store/api'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { Button } from '../../components/ui'
import toast from 'react-hot-toast'
import { FiUpload, FiX, FiFileText } from 'react-icons/fi'

const UploadReport = () => {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
      if (!validTypes.includes(selectedFile.type)) {
        toast.error('Please upload a PDF or image file')
        return
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB')
        return
      }
      setFile(selectedFile)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      toast.error('Please select a file')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('report', file)
      formData.append('bookingId', bookingId)

      await api.post('/provider/upload-report', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      await api.patch(`/provider/jobs/${bookingId}/status`, {
        status: 'completed',
      })

      toast.success('Report uploaded and job completed successfully!')
      navigate('/provider/dashboard')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload report')
    } finally {
      setUploading(false)
    }
  }

  return (
    <DashboardLayout title="Upload Report">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/30">
              <FiFileText className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
              Upload Service Report
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Upload the completed service report to mark this job as complete
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Service Report
              </label>
              
              {!file ? (
                <label className="block border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center cursor-pointer hover:border-teal-500 dark:hover:border-teal-500 transition-colors">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <FiUpload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-600 dark:text-slate-300 font-medium">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                    PDF, JPG, JPEG, PNG (Max 10MB)
                  </p>
                </label>
              ) : (
                <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <FiFileText className="w-8 h-8 text-teal-500" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 dark:text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => navigate('/provider/jobs')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={uploading}
                disabled={!file}
                className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg shadow-teal-500/30"
              >
                Upload & Complete
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default UploadReport
