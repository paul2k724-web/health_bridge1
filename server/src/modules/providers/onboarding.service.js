import ProviderProfile from '../../models/ProviderProfile.model.js';
import User from '../../models/User.model.js';
import ServiceCategory from '../../models/ServiceCategory.model.js';
import AuditLog from '../../models/AuditLog.model.js';
import {
  NotFoundError,
  ConflictError,
  ValidationError,
  ForbiddenError,
} from '../../shared/errors/index.js';
import { PROVIDER_STATUS, USER_ROLES } from '../../config/constants.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../../shared/utils/cloudinary.js';

class OnboardingService {
  async getOnboardingStatus(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.role !== USER_ROLES.PROVIDER) {
      throw new ForbiddenError('Only providers can access onboarding');
    }

    let profile = await ProviderProfile.findOne({ user: userId })
      .populate('serviceCategories', 'name category basePrice');

    if (!profile) {
      profile = await ProviderProfile.create({
        user: userId,
        status: PROVIDER_STATUS.PENDING,
        onboardingStep: 1,
      });
    }

    return {
      currentStep: profile.onboardingStep,
      status: user.onboardingStatus,
      profileStatus: profile.status,
      profile: {
        providerType: profile.providerType,
        specialization: profile.specialization,
        experience: profile.experience,
        bio: profile.bio,
        serviceCategories: profile.serviceCategories,
        availabilityRadius: profile.availabilityRadius,
        baseLocation: profile.baseLocation,
        documents: profile.documents,
        bankDetails: profile.bankDetails,
        agreementAccepted: profile.agreementAccepted,
      },
      isComplete: profile.onboardingStep >= 4 && profile.agreementAccepted,
    };
  }

  async saveStep1(userId, data) {
    const { providerType, specialization, experience, bio } = data;

    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    let profile = await ProviderProfile.findOne({ user: userId });
    if (!profile) {
      profile = new ProviderProfile({ user: userId });
    }

    profile.providerType = providerType || 'both';
    profile.specialization = specialization;
    profile.experience = experience || 0;
    profile.bio = bio;

    if (profile.onboardingStep < 2) {
      profile.onboardingStep = 2;
    }

    await profile.save();

    user.onboardingStatus = 'in_progress';
    user.onboardingStep = 2;
    await user.save();

    return {
      message: 'Profile details saved',
      nextStep: 2,
      profile: await this.getProfileData(profile),
    };
  }

  async saveStep2(userId, serviceCategoryIds) {
    if (!Array.isArray(serviceCategoryIds) || serviceCategoryIds.length === 0) {
      throw new ValidationError('At least one service must be selected');
    }

    const services = await ServiceCategory.find({
      _id: { $in: serviceCategoryIds },
      isActive: true,
      isDeleted: false,
    });

    if (services.length !== serviceCategoryIds.length) {
      throw new ValidationError('Some selected services are invalid or inactive');
    }

    const profile = await ProviderProfile.findOne({ user: userId });
    if (!profile) {
      throw new NotFoundError('Provider profile not found');
    }

    profile.serviceCategories = serviceCategoryIds;

    if (profile.onboardingStep < 3) {
      profile.onboardingStep = 3;
    }

    await profile.save();

    const user = await User.findById(userId);
    user.onboardingStep = 3;
    await user.save();

    return {
      message: 'Services selected successfully',
      nextStep: 3,
      selectedServices: services.map(s => ({ _id: s._id, name: s.name })),
    };
  }

  async saveStep3(userId, files) {
    const profile = await ProviderProfile.findOne({ user: userId });
    if (!profile) {
      throw new NotFoundError('Provider profile not found');
    }

    if (!profile.documents) {
      profile.documents = {};
    }

    if (files.license) {
      if (profile.documents.license?.publicId) {
        await deleteFromCloudinary(profile.documents.license.publicId);
      }
      const result = await uploadToCloudinary(files.license[0].path, 'provider-documents/licenses');
      profile.documents.license = {
        url: result.secure_url,
        publicId: result.public_id,
        status: 'pending',
      };
    }

    if (files.idProof) {
      if (profile.documents.idProof?.publicId) {
        await deleteFromCloudinary(profile.documents.idProof.publicId);
      }
      const result = await uploadToCloudinary(files.idProof[0].path, 'provider-documents/id-proofs');
      profile.documents.idProof = {
        url: result.secure_url,
        publicId: result.public_id,
        status: 'pending',
      };
    }

    if (files.qualification) {
      if (profile.documents.qualification?.publicId) {
        await deleteFromCloudinary(profile.documents.qualification.publicId);
      }
      const result = await uploadToCloudinary(files.qualification[0].path, 'provider-documents/qualifications');
      profile.documents.qualification = {
        url: result.secure_url,
        publicId: result.public_id,
        status: 'pending',
      };
    }

    if (profile.onboardingStep < 4) {
      profile.onboardingStep = 4;
    }

    await profile.save();

    const user = await User.findById(userId);
    user.onboardingStep = 4;
    await user.save();

    return {
      message: 'Documents uploaded successfully',
      nextStep: 4,
      documents: profile.documents,
    };
  }

  async saveStep4(userId, data) {
    const { longitude, latitude, address, radius } = data;

    if (!longitude || !latitude) {
      throw new ValidationError('Location coordinates are required');
    }

    const profile = await ProviderProfile.findOne({ user: userId });
    if (!profile) {
      throw new NotFoundError('Provider profile not found');
    }

    profile.baseLocation = {
      type: 'Point',
      coordinates: [longitude, latitude],
      address: address || '',
    };
    profile.availabilityRadius = radius || 10;
    profile.currentLocation = {
      type: 'Point',
      coordinates: [longitude, latitude],
    };
    profile.lastLocationUpdate = new Date();

    await profile.save();

    return {
      message: 'Location saved successfully',
      location: profile.baseLocation,
      radius: profile.availabilityRadius,
    };
  }

  async submitForApproval(userId) {
    const profile = await ProviderProfile.findOne({ user: userId })
      .populate('serviceCategories');

    if (!profile) {
      throw new NotFoundError('Provider profile not found');
    }

    if (!profile.specialization && profile.providerType === 'healthcare') {
      throw new ValidationError('Please complete your profile details');
    }

    if (!profile.serviceCategories || profile.serviceCategories.length === 0) {
      throw new ValidationError('Please select at least one service');
    }

    if (!profile.baseLocation?.coordinates) {
      throw new ValidationError('Please set your service location');
    }

    const hasDocuments = profile.documents?.license?.url || profile.documents?.idProof?.url;
    if (!hasDocuments) {
      throw new ValidationError('Please upload at least one document for verification');
    }

    if (!profile.agreementAccepted) {
      throw new ValidationError('Please accept the terms and conditions');
    }

    profile.status = PROVIDER_STATUS.PENDING;
    profile.onboardingCompletedAt = new Date();
    await profile.save();

    const user = await User.findById(userId);
    user.onboardingStatus = 'submitted';
    await user.save();

    await AuditLog.create({
      action: 'PROVIDER_SUBMITTED_FOR_APPROVAL',
      actor: { userId, role: USER_ROLES.PROVIDER },
      target: { type: 'ProviderProfile', id: profile._id },
      metadata: {
        providerType: profile.providerType,
        servicesCount: profile.serviceCategories.length,
      },
    });

    return {
      message: 'Application submitted successfully. You will be notified once approved.',
      status: 'submitted',
    };
  }

  async acceptAgreement(userId) {
    const profile = await ProviderProfile.findOne({ user: userId });
    if (!profile) {
      throw new NotFoundError('Provider profile not found');
    }

    profile.agreementAccepted = true;
    profile.agreementAcceptedAt = new Date();
    await profile.save();

    return {
      message: 'Terms and conditions accepted',
      agreementAccepted: true,
    };
  }

  async saveBankDetails(userId, data) {
    const { accountNumber, ifscCode, accountHolderName, upiId } = data;

    const profile = await ProviderProfile.findOne({ user: userId });
    if (!profile) {
      throw new NotFoundError('Provider profile not found');
    }

    profile.bankDetails = {
      accountNumber,
      ifscCode,
      accountHolderName,
      upiId,
      isVerified: false,
    };

    await profile.save();

    return {
      message: 'Bank details saved successfully',
    };
  }

  async getProfileData(profile) {
    return {
      id: profile._id,
      providerType: profile.providerType,
      specialization: profile.specialization,
      experience: profile.experience,
      bio: profile.bio,
      profilePhoto: profile.profilePhoto,
      serviceCategories: profile.serviceCategories,
      availabilityRadius: profile.availabilityRadius,
      baseLocation: profile.baseLocation,
      documents: profile.documents,
      bankDetails: profile.bankDetails ? {
        accountHolderName: profile.bankDetails.accountHolderName,
        upiId: profile.bankDetails.upiId,
        isVerified: profile.bankDetails.isVerified,
      } : null,
      agreementAccepted: profile.agreementAccepted,
      status: profile.status,
      rating: profile.rating,
      totalReviews: profile.totalReviews,
      completionRate: profile.completionRate,
      acceptanceRate: profile.acceptanceRate,
    };
  }
}

export default new OnboardingService();
