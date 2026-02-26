import mongoose from 'mongoose';
import { ADDRESS_LABELS } from '../config/constants.js';

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    label: {
      type: String,
      enum: Object.values(ADDRESS_LABELS),
      required: true,
    },
    addressLine1: {
      type: String,
      required: [true, 'Address line 1 is required'],
      maxlength: [200, 'Address cannot exceed 200 characters'],
    },
    addressLine2: {
      type: String,
      maxlength: [200, 'Address cannot exceed 200 characters'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      maxlength: [100, 'City cannot exceed 100 characters'],
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      maxlength: [100, 'State cannot exceed 100 characters'],
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      match: [/^\d{6}$/, 'Invalid pincode format'],
    },
    country: {
      type: String,
      default: 'India',
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        validate: {
          validator: function (val) {
            return val.length === 2 &&
                   val[0] >= -180 && val[0] <= 180 &&
                   val[1] >= -90 && val[1] <= 90;
          },
          message: 'Invalid coordinates [longitude, latitude]',
        },
      },
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    landmark: String,
  },
  {
    timestamps: true,
  }
);

// 2dsphere index for geospatial queries
addressSchema.index({ location: '2dsphere' });
addressSchema.index({ user: 1, isDefault: 1 });
addressSchema.index({ user: 1, createdAt: -1 });

// Pre-save middleware to ensure only one default address per user
addressSchema.pre('save', async function (next) {
  if (this.isDefault) {
    await this.constructor.updateMany(
      { user: this.user, _id: { $ne: this._id }, isDefault: true },
      { isDefault: false }
    );
  }
  next();
});

// Virtual for backward compatibility
addressSchema.virtual('coordinates').get(function () {
  if (this.location && this.location.coordinates) {
    return {
      longitude: this.location.coordinates[0],
      latitude: this.location.coordinates[1],
    };
  }
  return null;
});

// Methods
addressSchema.methods.toGeoJSON = function () {
  return this.location;
};

// Static methods
addressSchema.statics.findUserAddresses = function (userId) {
  return this.find({ user: userId }).sort({ isDefault: -1, createdAt: -1 });
};

addressSchema.statics.findDefaultAddress = function (userId) {
  return this.findOne({ user: userId, isDefault: true });
};

const Address = mongoose.model('Address', addressSchema);

export default Address;
