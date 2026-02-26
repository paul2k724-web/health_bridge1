import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    providerProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProviderProfile',
      required: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceCategory',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      maxlength: [1000, 'Review cannot exceed 1000 characters'],
    },
    aspects: {
      punctuality: { type: Number, min: 1, max: 5 },
      professionalism: { type: Number, min: 1, max: 5 },
      quality: { type: Number, min: 1, max: 5 },
      communication: { type: Number, min: 1, max: 5 },
      value: { type: Number, min: 1, max: 5 },
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    providerReply: {
      text: String,
      repliedAt: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

reviewSchema.index({ booking: 1 }, { unique: true });
reviewSchema.index({ provider: 1, createdAt: -1 });
reviewSchema.index({ providerProfile: 1 });
reviewSchema.index({ service: 1 });
reviewSchema.index({ rating: 1 });

reviewSchema.post('save', async function () {
  try {
    const ProviderProfile = mongoose.model('ProviderProfile');
    const profile = await ProviderProfile.findById(this.providerProfile);
    
    if (profile) {
      const Review = mongoose.model('Review');
      const stats = await Review.aggregate([
        { $match: { providerProfile: profile._id, isDeleted: false } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 },
          },
        },
      ]);
      
      if (stats.length > 0) {
        profile.rating = Math.round(stats[0].averageRating * 10) / 10;
        profile.totalReviews = stats[0].totalReviews;
        await profile.save();
      }
    }
  } catch (error) {
    console.error('Error updating provider rating:', error);
  }
});

reviewSchema.statics.findByProvider = function (providerProfileId, options = {}) {
  const query = {
    providerProfile: providerProfileId,
    isPublic: true,
    isDeleted: false,
  };
  
  return this.find(query)
    .populate('customer', 'name avatar')
    .populate('service', 'name')
    .sort({ createdAt: -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 10);
};

reviewSchema.statics.getProviderStats = async function (providerProfileId) {
  const stats = await this.aggregate([
    { $match: { providerProfile: providerProfileId, isDeleted: false } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating',
        },
        aspectAverages: {
          punctuality: { $avg: '$aspects.punctuality' },
          professionalism: { $avg: '$aspects.professionalism' },
          quality: { $avg: '$aspects.quality' },
          communication: { $avg: '$aspects.communication' },
          value: { $avg: '$aspects.value' },
        },
      },
    },
  ]);
  
  if (stats.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  }
  
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  stats[0].ratingDistribution.forEach(r => {
    distribution[r] = (distribution[r] || 0) + 1;
  });
  
  return {
    averageRating: Math.round(stats[0].averageRating * 10) / 10,
    totalReviews: stats[0].totalReviews,
    distribution,
    aspectAverages: stats[0].aspectAverages,
  };
};

const Review = mongoose.model('Review', reviewSchema);

export default Review;
