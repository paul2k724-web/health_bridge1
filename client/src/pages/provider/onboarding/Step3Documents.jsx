import { useState } from 'react'
import { FiFileText, FiUpload, FiX, FiCheck, FiArrowRight, FiArrowLeft, FiAlertCircle } from 'react-icons/fi'
import { Button } from '../../../components/ui'
import api from '../../../store/api'
import toast from 'react-hot-toast'

const documentTypes = [
  {
    id: 'license',
    name: 'Professional License',
    description: 'Medical license, trade license, or professional certification',
    required: true,
    forTypes: ['healthcare', 'both'],
  },
  {
    id: 'idProof',
    name: 'ID Proof',
    description: 'Aadhar card, PAN card, or passport',
    required: true,
    forTypes: ['healthcare', 'home_service', 'both'],
  },
  {
    id: 'qualification',
    name: 'Qualification Certificates',
    description: 'Degree certificates, diplomas, or training certificates',
    required: false,
    forTypes: ['healthcare', 'both'],
  },
]

const Step3Documents = ({ data, updateData, onNext, onBack }) => {
  const [loading, setLoading] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(null)
  const [documents, setDocuments] = useState(data.documents || {})

  const handleFileSelect = async (docType, file) => {
    if (!file) return

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image (JPG, PNG) or PDF file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    setUploadingDoc(docType)
    try {
      const formData = new FormData()
      formData.append('document', file)

      const response = await api.post(`/provider/onboarding/upload-document/${docType}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setDocuments(prev => ({
        ...prev,
        [docType]: response.data.document,
      }))

      toast.success('Document uploaded successfully!')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload document')
    } finally {
      setUploadingDoc(null)
    }
  }

  const handleRemove = async (docType) => {
    try {
      await api.delete(`/provider/onboarding/document/${docType}`)
      setDocuments(prev => {
        const newDocs = { ...prev }
        delete newDocs[docType]
        return newDocs
      })
      toast.success('Document removed')
    } catch (error) {
      toast.error('Failed to remove document')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const hasRequiredDocs = documentTypes
      .filter(dt => dt.required && dt.forTypes.includes(data.providerType || 'both'))
      .every(dt => documents[dt.id]?.url)

    if (!hasRequiredDocs) {
      toast.error('Please upload all required documents')
      return
    }

    setLoading(true)
    try {
      updateData({ documents })
      toast.success('Documents saved!')
      onNext()
    } catch (error) {
      toast.error('Failed to save documents')
    } finally {
      setLoading(false)
    }
  }

  const visibleDocTypes = documentTypes.filter(dt => 
    dt.forTypes.includes(data.providerType || 'both')
  )

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 animate-fade-up">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/30">
          <FiFileText className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          Upload your documents
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          We need to verify your credentials before you can start accepting bookings
        </p>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
        <div className="flex gap-3">
          <FiAlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Document Requirements
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
              All documents must be clear, legible, and in JPG, PNG, or PDF format. 
              Maximum file size is 10MB.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        {visibleDocTypes.map((docType) => {
          const doc = documents[docType.id]
          const isUploading = uploadingDoc === docType.id

          return (
            <div
              key={docType.id}
              className={`p-4 rounded-xl border-2 transition-all ${
                doc?.url
                  ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-slate-800 dark:text-white">
                      {docType.name}
                    </h4>
                    {docType.required && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {docType.description}
                  </p>
                </div>

                {doc?.url ? (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                      <FiCheck className="w-4 h-4 text-white" />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(docType.id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className={`cursor-pointer ${
                    isUploading ? 'opacity-50 pointer-events-none' : ''
                  }`}>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      className="hidden"
                      onChange={(e) => handleFileSelect(docType.id, e.target.files[0])}
                      disabled={isUploading}
                    />
                    <div className={`px-4 py-2 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-teal-500 dark:hover:border-teal-500 transition-colors ${
                      isUploading ? 'animate-pulse' : ''
                    }`}>
                      {isUploading ? (
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          Uploading...
                        </span>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                          <FiUpload className="w-4 h-4" />
                          Upload
                        </div>
                      )}
                    </div>
                  </label>
                )}
              </div>

              {doc?.url && (
                <div className="mt-3 p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <FiFileText className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-600 dark:text-slate-300 truncate">
                      Document uploaded
                    </span>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-teal-600 dark:text-teal-400 hover:underline ml-auto"
                    >
                      View
                    </a>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-4">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={onBack}
          icon={FiArrowLeft}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg shadow-teal-500/30"
          icon={FiArrowRight}
          iconPosition="right"
        >
          Continue
        </Button>
      </form>
    </div>
  )
}

export default Step3Documents
