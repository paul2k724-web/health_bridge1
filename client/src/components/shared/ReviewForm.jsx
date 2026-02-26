import { useState } from 'react'
import { FiStar, FiX, FiCheck } from 'react-icons/fi'
import { Button } from '../ui'
import toast from 'react-hot-toast'

const RATING_LABELS = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
}

const ASPECT_LABELS = {
  punctuality: 'Punctuality',
  professionalism: 'Professionalism',
  quality: 'Quality of Service',
  communication: 'Communication',
  value: 'Value for Money',
}

const ReviewForm = ({ isOpen, onClose, booking, onSubmit, existingReview = null }) => {
  const [rating, setRating] = useState(existingReview?.rating || 0)
  const [hoverRating, setHoverRating] = useState(0)
  const [review, setReview] = useState(existingReview?.review || '')
  const [aspects, setAspects] = useState(existingReview?.aspects || {
    punctuality: 0,
    professionalism: 0,
    quality: 0,
    communication: 0,
    value: 0,
  })
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleAspectChange = (aspect, value) => {
    setAspects(prev => ({ ...prev, [aspect]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    setLoading(true)
    try {
      await onSubmit({
        rating,
        review: review.trim() || undefined,
        aspects: Object.values(aspects).some(v => v > 0) ? aspects : undefined,
      })
      toast.success('Review submitted successfully!')
      onClose()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review')
    } finally {
      setLoading(false)
    }
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const displayRating = hoverRating || rating

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg transform transition-all animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
            {existingReview ? 'Your Review' : 'Rate Your Experience'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <FiX className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Service Info */}
        {booking && (
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400">Service</p>
            <p className="font-medium text-slate-800 dark:text-white">
              {booking.service?.name}
            </p>
            {booking.provider && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                by {booking.provider.name}
              </p>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Overall Rating */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Overall Rating *
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <FiStar
                    className={`w-8 h-8 transition-colors ${
                      star <= displayRating
                        ? 'text-yellow-400 fill-current'
                        : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                </button>
              ))}
              {displayRating > 0 && (
                <span className="ml-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                  {RATING_LABELS[displayRating]}
                </span>
              )}
            </div>
          </div>

          {/* Aspect Ratings */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Rate Specific Aspects (Optional)
            </label>
            <div className="space-y-3">
              {Object.entries(ASPECT_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleAspectChange(key, star)}
                        className="p-0.5"
                      >
                        <FiStar
                          className={`w-4 h-4 transition-colors ${
                            star <= aspects[key]
                              ? 'text-yellow-400 fill-current'
                              : 'text-slate-300 dark:text-slate-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Review Text */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Write a Review (Optional)
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your experience with this service..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
              maxLength={1000}
            />
            <p className="text-xs text-slate-400 mt-1 text-right">
              {review.length}/1000
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              disabled={rating === 0}
              className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
              icon={FiCheck}
              iconPosition="left"
            >
              Submit Review
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ReviewForm
