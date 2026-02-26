import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      index: true,
    },
    actor: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      role: String,
      ip: String,
      userAgent: String,
    },
    target: {
      type: {
        type: String,
        enum: ['User', 'Booking', 'ProviderProfile', 'ServiceCategory', 'Address', 'Payment', 'System'],
      },
      id: mongoose.Schema.Types.ObjectId,
    },
    changes: {
      before: mongoose.Schema.Types.Mixed,
      after: mongoose.Schema.Types.Mixed,
    },
    metadata: mongoose.Schema.Types.Mixed,
    reason: String,
    status: {
      type: String,
      enum: ['success', 'failed', 'pending'],
      default: 'success',
    },
    errorMessage: String,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ 'actor.userId': 1 });
auditLogSchema.index({ 'target.type': 1, 'target.id': 1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ status: 1 });

// Static methods
auditLogSchema.statics.log = async function (data) {
  return await this.create(data);
};

auditLogSchema.statics.logUserAction = async function (action, userId, userRole, target, changes = null, metadata = null) {
  return await this.create({
    action,
    actor: {
      userId,
      role: userRole,
    },
    target,
    changes,
    metadata,
  });
};

auditLogSchema.statics.logAdminAction = async function (action, adminId, target, changes = null, reason = null) {
  return await this.create({
    action,
    actor: {
      userId: adminId,
      role: 'admin',
    },
    target,
    changes,
    reason,
  });
};

auditLogSchema.statics.logStatusChange = async function (
  targetType,
  targetId,
  previousStatus,
  newStatus,
  changedBy,
  changedByRole,
  reason = null
) {
  return await this.create({
    action: `${targetType.toUpperCase()}_STATUS_CHANGE`,
    actor: {
      userId: changedBy,
      role: changedByRole,
    },
    target: {
      type: targetType,
      id: targetId,
    },
    changes: {
      before: { status: previousStatus },
      after: { status: newStatus },
    },
    reason,
  });
};

auditLogSchema.statics.findByUser = function (userId, options = {}) {
  return this.find({ 'actor.userId': userId })
    .sort({ createdAt: -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 50);
};

auditLogSchema.statics.findByTarget = function (targetType, targetId, options = {}) {
  return this.find({
    'target.type': targetType,
    'target.id': targetId,
  })
    .sort({ createdAt: -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 50);
};

auditLogSchema.statics.findByAction = function (action, options = {}) {
  return this.find({ action })
    .sort({ createdAt: -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 50);
};

auditLogSchema.statics.findByDateRange = function (startDate, endDate, options = {}) {
  const query = {};
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 50);
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
