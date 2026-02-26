import providerService from './provider.service.js';
import ProviderProfile from '../../models/ProviderProfile.model.js';
import User from '../../models/User.model.js';
import Review from '../../models/Review.model.js';
import ApiResponse from '../../shared/utils/response.js';
import asyncHandler from '../../shared/middleware/async.middleware.js';
import { NotFoundError, ForbiddenError } from '../../shared/errors/index.js';

const registerProvider = asyncHandler(async (req, res) => {
  const profile = await providerService.registerProvider(req.user._id, req.body);
  return ApiResponse.created(res, { profile }, 'Provider registration submitted. Awaiting approval.');
});

const getProfile = asyncHandler(async (req, res) => {
  const profile = await providerService.getProfile(req.user._id);
  return ApiResponse.success(res, { profile });
});

const updateProfile = asyncHandler(async (req, res) => {
  const profile = await providerService.updateProfile(req.user._id, req.body);
  return ApiResponse.success(res, { profile }, 'Profile updated successfully');
});

const updateLocation = asyncHandler(async (req, res) => {
  const { longitude, latitude } = req.body;
  const result = await providerService.updateLocation(req.user._id, longitude, latitude);
  return ApiResponse.success(res, result, result.message);
});

const updateAvailability = asyncHandler(async (req, res) => {
  const { isAvailable } = req.body;
  
  const profile = await ProviderProfile.findOne({ user: req.user._id });
  if (!profile) {
    throw new NotFoundError('Provider profile not found');
  }

  profile.isAvailable = isAvailable;
  if (isAvailable && req.body.longitude && req.body.latitude) {
    profile.currentLocation = {
      type: 'Point',
      coordinates: [req.body.longitude, req.body.latitude],
    };
    profile.lastLocationUpdate = new Date();
  }
  
  await profile.save();
  
  return ApiResponse.success(res, { 
    isAvailable: profile.isAvailable,
    message: isAvailable ? 'You are now online and visible to customers' : 'You are now offline'
  });
});

const updateSchedule = asyncHandler(async (req, res) => {
  const { schedule } = req.body;
  
  const profile = await ProviderProfile.findOne({ user: req.user._id });
  if (!profile) {
    throw new NotFoundError('Provider profile not found');
  }

  profile.availabilitySchedule = schedule;
  await profile.save();
  
  return ApiResponse.success(res, { schedule: profile.availabilitySchedule }, 'Schedule updated successfully');
});

const getJobs = asyncHandler(async (req, res) => {
  const result = await providerService.getJobs(req.user._id, req.query);
  return ApiResponse.paginated(res, result.jobs, result.pagination);
});

const getAvailableJobs = asyncHandler(async (req, res) => {
  const result = await providerService.getAvailableJobs(req.user._id, req.query);
  return ApiResponse.paginated(res, result.jobs, result.pagination);
});

const acceptJob = asyncHandler(async (req, res) => {
  const booking = await providerService.acceptJob(req.user._id, req.params.jobId);
  return ApiResponse.success(res, { booking }, 'Job accepted successfully');
});

const rejectJob = asyncHandler(async (req, res) => {
  const booking = await providerService.rejectJob(req.user._id, req.params.jobId);
  return ApiResponse.success(res, { booking }, 'Job rejected');
});

const updateJobStatus = asyncHandler(async (req, res) => {
  const booking = await providerService.updateJobStatus(
    req.user._id,
    req.params.jobId,
    req.body.status
  );
  return ApiResponse.success(res, { booking }, `Job status updated to ${req.body.status}`);
});

const acceptRejectJob = asyncHandler(async (req, res) => {
  const { action, reason } = req.body;
  
  if (action === 'accept') {
    const booking = await providerService.acceptJob(req.user._id, req.params.jobId);
    return ApiResponse.success(res, { booking }, 'Job accepted successfully');
  } else {
    const booking = await providerService.rejectJob(req.user._id, req.params.jobId);
    return ApiResponse.success(res, { booking }, 'Job rejected');
  }
});

const getEarnings = asyncHandler(async (req, res) => {
  const result = await providerService.getEarnings(req.user._id);
  return ApiResponse.success(res, result);
});

const getNavigation = asyncHandler(async (req, res) => {
  const result = await providerService.getNavigationUrl(req.user._id, req.params.jobId);
  return ApiResponse.success(res, result);
});

const getWhatsApp = asyncHandler(async (req, res) => {
  const result = await providerService.getWhatsAppUrl(req.user._id, req.params.jobId);
  return ApiResponse.success(res, result);
});

const getPublicProfile = asyncHandler(async (req, res) => {
  const { providerId } = req.params;
  
  const profile = await ProviderProfile.findById(providerId)
    .populate('user', 'name avatar')
    .populate('serviceCategories', 'name category');
  
  if (!profile || profile.status !== 'approved') {
    throw new NotFoundError('Provider not found');
  }

  const reviews = await Review.findByProvider(profile._id, { limit: 10 });
  const reviewStats = await Review.getProviderStats(profile._id);
  
  return ApiResponse.success(res, {
    provider: {
      id: profile._id,
      name: profile.user.name,
      avatar: profile.user.avatar || profile.profilePhoto?.url,
      specialization: profile.specialization,
      providerType: profile.providerType,
      bio: profile.bio,
      experience: profile.experience,
      rating: profile.rating,
      totalReviews: profile.totalReviews,
      completionRate: profile.completionRate,
      acceptanceRate: profile.acceptanceRate,
      services: profile.serviceCategories,
      verified: {
        license: profile.documents?.license?.status === 'verified',
        idProof: profile.documents?.idProof?.status === 'verified',
      },
    },
    reviews,
    reviewStats,
  });
});

const getAllProviders = asyncHandler(async (req, res) => {
  const result = await providerService.getAllProviders(req.query);
  return ApiResponse.paginated(res, result.providers, result.pagination);
});

const getProviderDetails = asyncHandler(async (req, res) => {
  const { providerId } = req.params;
  
  const profile = await ProviderProfile.findById(providerId)
    .populate('user', 'name email phone avatar')
    .populate('serviceCategories', 'name category');
  
  if (!profile) {
    throw new NotFoundError('Provider not found');
  }

  const reviewStats = await Review.getProviderStats(profile._id);
  
  return ApiResponse.success(res, {
    profile,
    reviewStats,
    documents: profile.documents,
    bankDetails: profile.bankDetails ? {
      accountHolderName: profile.bankDetails.accountHolderName,
      isVerified: profile.bankDetails.isVerified,
    } : null,
  });
});

const approveRejectProvider = asyncHandler(async (req, res) => {
  const { action, rejectionReason } = req.body;
  
  let profile;
  if (action === 'approve') {
    profile = await providerService.approveProvider(req.params.providerId, req.user._id);
    return ApiResponse.success(res, { profile }, 'Provider approved successfully');
  } else {
    profile = await providerService.rejectProvider(req.params.providerId, req.user._id, rejectionReason);
    return ApiResponse.success(res, { profile }, 'Provider rejected');
  }
});

export default {
  registerProvider,
  getProfile,
  updateProfile,
  updateLocation,
  updateAvailability,
  updateSchedule,
  getJobs,
  getAvailableJobs,
  acceptJob,
  rejectJob,
  updateJobStatus,
  acceptRejectJob,
  getEarnings,
  getNavigation,
  getWhatsApp,
  getPublicProfile,
  getAllProviders,
  getProviderDetails,
  approveRejectProvider,
};
