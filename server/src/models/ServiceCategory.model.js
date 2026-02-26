import mongoose from 'mongoose';

const serviceCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Service name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Service name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    icon: {
      type: String,
      default: 'FiActivity',
    },
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: [0, 'Price cannot be negative'],
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [15, 'Minimum duration is 15 minutes'],
      comment: 'Duration in minutes',
    },
    discount: {
      percentage: {
        type: Number,
        min: [0, 'Discount cannot be negative'],
        max: [100, 'Discount cannot exceed 100%'],
      },
      validUntil: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    category: {
      type: String,
      enum: ['healthcare', 'home_service', 'both'],
      default: 'both',
    },
    tags: [String],
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
serviceCategorySchema.index({ name: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
serviceCategorySchema.index({ isActive: 1, isDeleted: 1 });
serviceCategorySchema.index({ category: 1 });
serviceCategorySchema.index({ createdAt: -1 });

// Virtual for effective price
serviceCategorySchema.virtual('effectivePrice').get(function () {
  if (this.discount && this.discount.percentage && this.discount.validUntil > new Date()) {
    return this.basePrice * (1 - this.discount.percentage / 100);
  }
  return this.basePrice;
});

// Virtual for discount status
serviceCategorySchema.virtual('hasActiveDiscount').get(function () {
  return (
    this.discount &&
    this.discount.percentage > 0 &&
    (!this.discount.validUntil || this.discount.validUntil > new Date())
  );
});

// Methods
serviceCategorySchema.methods.calculatePrice = function () {
  return this.effectivePrice;
};

// Static methods
serviceCategorySchema.statics.findActive = function () {
  return this.find({ isActive: true, isDeleted: false });
};

serviceCategorySchema.statics.findWithActiveDiscount = function () {
  return this.find({
    isActive: true,
    isDeleted: false,
    'discount.percentage': { $gt: 0 },
    $or: [
      { 'discount.validUntil': { $gt: new Date() } },
      { 'discount.validUntil': { $exists: false } },
    ],
  });
};

// Pre-find middleware to exclude deleted by default
serviceCategorySchema.pre(/^find/, function (next) {
  if (this.getOptions().includeDeleted !== true) {
    this.where({ isDeleted: false });
  }
  next();
});

const ServiceCategory = mongoose.model('ServiceCategory', serviceCategorySchema);

export default ServiceCategory;
