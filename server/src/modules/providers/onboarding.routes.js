import { Router } from 'express';
import Joi from 'joi';
import onboardingController from './onboarding.controller.js';
import { validateBody, validateParams } from '../../shared/middleware/validate.middleware.js';
import { protect } from '../../shared/middleware/auth.middleware.js';
import { requireProvider } from '../../shared/middleware/role.middleware.js';
import multer from 'multer';

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'), false);
    }
  },
});

const uploadMultiple = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  },
}).fields([
  { name: 'license', maxCount: 1 },
  { name: 'idProof', maxCount: 1 },
  { name: 'qualification', maxCount: 1 },
]);

const step1Schema = Joi.object({
  providerType: Joi.string().valid('healthcare', 'home_service', 'both'),
  specialization: Joi.string().max(100),
  experience: Joi.number().min(0).max(50),
  bio: Joi.string().max(500),
});

const step2Schema = Joi.object({
  serviceIds: Joi.array().items(Joi.string()).min(1).required(),
});

const step4Schema = Joi.object({
  longitude: Joi.number().required(),
  latitude: Joi.number().required(),
  address: Joi.string(),
  radius: Joi.number().min(1).max(100),
});

const bankDetailsSchema = Joi.object({
  accountNumber: Joi.string().required(),
  ifscCode: Joi.string().required(),
  accountHolderName: Joi.string().required(),
  upiId: Joi.string(),
});

const documentTypeSchema = Joi.object({
  documentType: Joi.string().valid('license', 'idProof', 'qualification', 'profilePhoto').required(),
});

router.get(
  '/status',
  protect,
  requireProvider,
  onboardingController.getStatus
);

router.post(
  '/step1',
  protect,
  requireProvider,
  validateBody(step1Schema),
  onboardingController.saveStep1
);

router.post(
  '/step2',
  protect,
  requireProvider,
  validateBody(step2Schema),
  onboardingController.saveStep2
);

router.post(
  '/step3',
  protect,
  requireProvider,
  uploadMultiple,
  onboardingController.saveStep3
);

router.post(
  '/upload-document/:documentType',
  protect,
  requireProvider,
  validateParams(documentTypeSchema),
  upload.single('document'),
  onboardingController.uploadDocument
);

router.post(
  '/step4',
  protect,
  requireProvider,
  validateBody(step4Schema),
  onboardingController.saveStep4
);

router.post(
  '/accept-agreement',
  protect,
  requireProvider,
  onboardingController.acceptAgreement
);

router.post(
  '/bank-details',
  protect,
  requireProvider,
  validateBody(bankDetailsSchema),
  onboardingController.saveBankDetails
);

router.post(
  '/submit',
  protect,
  requireProvider,
  onboardingController.submitForApproval
);

router.delete(
  '/document/:documentType',
  protect,
  requireProvider,
  validateParams(documentTypeSchema),
  onboardingController.deleteDocument
);

export default router;
