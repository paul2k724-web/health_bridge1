import onboardingService from './onboarding.service.js';
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
} from '../../shared/errors/index.js';
import { USER_ROLES } from '../../config/constants.js';
import { uploadBufferToCloudinary, deleteFromCloudinary } from '../../shared/utils/cloudinary.js';

class OnboardingController {
  async getStatus(req, res, next) {
    try {
      const status = await onboardingService.getOnboardingStatus(req.user.id);
      res.json(status);
    } catch (error) {
      next(error);
    }
  }

  async saveStep1(req, res, next) {
    try {
      const result = await onboardingService.saveStep1(req.user.id, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async saveStep2(req, res, next) {
    try {
      const { serviceIds } = req.body;
      const result = await onboardingService.saveStep2(req.user.id, serviceIds);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async saveStep3(req, res, next) {
    try {
      const files = req.files;
      
      if (!files || Object.keys(files).length === 0) {
        throw new ValidationError('No files uploaded');
      }

      const result = await onboardingService.saveStep3(req.user.id, files);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async uploadDocument(req, res, next) {
    try {
      const { documentType } = req.params;
      const file = req.file;

      if (!file) {
        throw new ValidationError('No file uploaded');
      }

      const validTypes = ['license', 'idProof', 'qualification', 'profilePhoto'];
      if (!validTypes.includes(documentType)) {
        throw new ValidationError('Invalid document type');
      }

      const folder = `provider-documents/${documentType}s`;
      const result = await uploadBufferToCloudinary(file.buffer, folder);

      res.json({
        message: 'Document uploaded successfully',
        document: {
          url: result.secure_url,
          publicId: result.public_id,
          type: documentType,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async saveStep4(req, res, next) {
    try {
      const result = await onboardingService.saveStep4(req.user.id, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async acceptAgreement(req, res, next) {
    try {
      const result = await onboardingService.acceptAgreement(req.user.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async saveBankDetails(req, res, next) {
    try {
      const result = await onboardingService.saveBankDetails(req.user.id, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async submitForApproval(req, res, next) {
    try {
      const result = await onboardingService.submitForApproval(req.user.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteDocument(req, res, next) {
    try {
      const { documentType } = req.params;
      
      const ProviderProfile = (await import('../../models/ProviderProfile.model.js')).default;
      const profile = await ProviderProfile.findOne({ user: req.user.id });

      if (!profile) {
        throw new NotFoundError('Provider profile not found');
      }

      const document = profile.documents?.[documentType];
      if (document?.publicId) {
        await deleteFromCloudinary(document.publicId);
        profile.documents[documentType] = {
          url: null,
          publicId: null,
          status: 'pending',
        };
        await profile.save();
      }

      res.json({ message: 'Document deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export default new OnboardingController();
