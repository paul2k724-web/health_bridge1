import mongoose from 'mongoose';
import { PROVIDER_STATUS } from '../config/constants.js';

const providerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    providerType: {
      type: String,
      enum: ['healthcare', 'home_service', 'both'],
      default: 'both',
    },
    specialization: {
      type: String,
      maxlength: [100, 'Specialization cannot exceed 100 characters'],
    },
    licenseNumber: {
      type: String,
      sparse: true,
      trim: true,
    },
    experience: {
      type: Number,
      default: 0,
      min: [0, 'Experience cannot be negative'],
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
    },
    profilePhoto: {
      url: String,
      publicId: String,
    },
    documents: {
      license: {
        url: String,
        publicId: String,
        verifiedAt: Date,
        status: {
          type: String,
          enum: ['pending', 'verified', 'rejected'],
          default: 'pending',
        },
      },
      idProof: {
        url: String,
        publicId: String,
        verifiedAt: Date,
        status: {
          type: String,
          enum: ['pending', 'verified', 'rejected'],
          default: 'pending',
        },
      },
      qualification: {
        url: String,
        publicId: String,
        verifiedAt: Date,
        status: {
          type: String,
          enum: ['pending', 'verified', 'rejected'],
          default: 'pending',
        },
      },
      workSamples: [
        {
          url: String,
          publicId: String,
        },
      ],
    },
    serviceCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ServiceCategory',
      },
    ],
    status: {
      type: String,
      enum: Object.values(PROVIDER_STATUS),
      default: PROVIDER_STATUS.PENDING,
    },
    rejectionReason: String,
    approvedAt: Date,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isAvailable: {
      type: Boolean,
      default: false,
    },
    availabilityRadius: {
      type: Number,
      default: 10,
      min: [1, 'Minimum radius is 1 km'],
      max: [100, 'Maximum radius is 100 km'],
    },
    baseLocation: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
        default: undefined,
      },
      address: String,
    },
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
        default: undefined,
      },
    },
    lastLocationUpdate: Date,
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    earnings: {
      total: {
        type: Number,
        default: 0,
      },
      pending: {
        type: Number,
        default: 0,
      },
      paid: {
        type: Number,
        default: 0,
      },
    },
    totalJobs: {
      type: Number,
      default: 0,
    },
    completedJobs: {
      type: Number,
      default: 0,
    },
    cancelledJobs: {
      type: Number,
      default: 0,
    },
    acceptedJobs: {
      type: Number,
      default: 0,
    },
    rejectedJobs: {
      type: Number,
      default: 0,
    },
    acceptanceRate: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    averageResponseTime: {
      type: Number,
      default: 0,
    },
    availabilitySchedule: [
      {
        day: {
          type: String,
          enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        },
        startTime: String,
        endTime: String,
        isAvailable: {
          type: Boolean,
          default: true,
        },
      },
    ],
    bankDetails: {
      accountNumber: String,
      ifscCode: String,
      accountHolderName: String,
      upiId: String,
      isVerified: {
        type: Boolean,
        default: false,
      },
    },
    commissionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 50,
    },
    commissionWaiverUntil: {
      type: Date,
      default: () => new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000),
    },
    agreementAccepted: {
      type: Boolean,
      default: false,
    },
    agreementAcceptedAt: Date,
    onboardingCompletedAt: Date,
    onboardingStep: {
      type: Number,
      default: 1,
      min: 1,
      max: 4,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

providerProfileSchema.index({ user: 1 }, { unique: true });
providerProfileSchema.index({ licenseNumber: 1 }, { unique: true, sparse: true });
providerProfileSchema.index({ status: 1 });
providerProfileSchema.index({ currentLocation: '2dsphere' }, { sparse: true });
providerProfileSchema.index({ baseLocation: '2dsphere' }, { sparse: true });
providerProfileSchema.index({ isAvailable: 1, status: 1 });
providerProfileSchema.index({ serviceCategories: 1 });
providerProfileSchema.index({ createdAt: -1 });
providerProfileSchema.index({ 'baseLocation.coordinates': '2dsphere' }, { sparse: true });

providerProfileSchema.virtual('completionRate').get(function () {
  if (this.totalJobs === 0) return 0;
  return ((this.completedJobs / this.totalJobs) * 100).toFixed(1);
});

providerProfileSchema.virtual('isCommissionWaived').get(function () {
  return this.commissionWaiverUntil && new Date() < this.commissionWaiverUntil;
});

providerProfileSchema.virtual('effectiveCommissionRate').get(function () {
  if (this.isCommissionWaived) return 0;
  return this.commissionRate;
});

providerProfileSchema.methods.updateLocation = async function (longitude, latitude) {
  this.currentLocation = {
    type: 'Point',
    coordinates: [longitude, latitude],
  };
  this.lastLocationUpdate = new Date();
  return await this.save();
};

providerProfileSchema.methods.setBaseLocation = async function (longitude, latitude, address) {
  this.baseLocation = {
    type: 'Point',
    coordinates: [longitude, latitude],
    address,
  };
  return await this.save();
};

providerProfileSchema.methods.incrementJob = async function (completed = false, cancelled = false) {
  this.totalJobs += 1;
  if (completed) this.completedJobs += 1;
  if (cancelled) this.cancelledJobs += 1;
  return await this.save();
};

providerProfileSchema.methods.addEarnings = async function (amount) {
  this.earnings.total += amount;
  this.earnings.pending += amount;
  return await this.save();
};

providerProfileSchema.methods.updateAcceptanceRate = async function (accepted = true) {
  if (accepted) {
    this.acceptedJobs += 1;
  } else {
    this.rejectedJobs += 1;
  }
  const total = this.acceptedJobs + this.rejectedJobs;
  if (total > 0) {
    this.acceptanceRate = Math.round((this.acceptedJobs / total) * 100);
  }
  return await this.save();
};

providerProfileSchema.statics.findApproved = function () {
  return this.find({ status: PROVIDER_STATUS.APPROVED, isDeleted: false });
};

providerProfileSchema.statics.findPending = function () {
  return this.find({ status: PROVIDER_STATUS.PENDING, isDeleted: false });
};

providerProfileSchema.statics.findWithinRadius = function (longitude, latitude, radiusKm, serviceId = null) {
  const query = {
    status: PROVIDER_STATUS.APPROVED,
    isAvailable: true,
    isDeleted: false,
    baseLocation: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        $maxDistance: radiusKm * 1000,
      },
    },
  };

  if (serviceId) {
    query.serviceCategories = serviceId;
  }

  return this.find(query)
    .populate('user', 'name phone avatar')
    .populate('serviceCategories', 'name');
};

providerProfileSchema.statics.findAvailableForService = async function (serviceId, longitude, latitude, radiusKm = 15) {
  const pipeline = [
    {
      $match: {
        status: PROVIDER_STATUS.APPROVED,
        isAvailable: true,
        isDeleted: false,
        serviceCategories: new mongoose.Types.ObjectId(serviceId),
        baseLocation: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            $maxDistance: radiusKm * 1000,
          },
        },
      },
    },
    {
      $addFields: {
        distance: {
          $divide: [
            {
              $function: {
                body: function (coords1, coords2) {
                  const R = 6371;
                  const dLat = (coords2[1] - coords1[1]) * Math.PI / 180;
                  const dLon = (coords2[0] - coords1[0]) * Math.PI / 180;
                  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(coords1[1] * Math.PI / 180) * Math.cos(coords2[1] * Math.PI / 180) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
                  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                  return R * c;
                },
                args: ['$baseLocation.coordinates', [longitude, latitude]],
                lang: 'js',
              },
            },
            1,
          ],
        },
        score: {
          $add: [
            { $multiply: ['$rating', 20] },
            { $multiply: ['$acceptanceRate', 0.3] },
          ],
        },
      },
    },
    { $sort: { score: -1, distance: 1 } },
    { $limit: 10 },
  ];

  return this.aggregate(pipeline);
};

const ProviderProfile = mongoose.model('ProviderProfile', providerProfileSchema);

export default ProviderProfile;
