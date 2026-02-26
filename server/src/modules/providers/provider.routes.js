import { Router } from 'express';
import Joi from 'joi';
import providerController from './provider.controller.js';
import onboardingController from './onboarding.controller.js';
import onboardingRoutes from './onboarding.routes.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../shared/middleware/validate.middleware.js';
import { objectId } from '../../shared/middleware/validate.middleware.js';
import {
  registerProviderSchema,
  updateProviderProfileSchema,
  updateLocationSchema,
  acceptRejectJobSchema,
  updateJobStatusSchema,
  providerJobsFilterSchema,
  providerFilterSchema,
  approveRejectProviderSchema,
} from './provider.validator.js';
import { protect } from '../../shared/middleware/auth.middleware.js';
import {
  requireProvider,
  requireAdmin,
  requireApprovedProvider,
} from '../../shared/middleware/role.middleware.js';

const router = Router();

const jobIdSchema = Joi.object({
  jobId: objectId().required(),
});

const providerIdSchema = Joi.object({
  providerId: objectId().required(),
});

const availabilitySchema = Joi.object({
  isAvailable: Joi.boolean().required(),
});

const scheduleSchema = Joi.object({
  schedule: Joi.array().items(
    Joi.object({
      day: Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
      startTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      isAvailable: Joi.boolean(),
    })
  ),
});

router.use('/onboarding', onboardingRoutes);

router.post(
  '/register',
  protect,
  validateBody(registerProviderSchema),
  providerController.registerProvider
);

router.get(
  '/profile',
  protect,
  requireProvider,
  providerController.getProfile
);

router.put(
  '/profile',
  protect,
  requireProvider,
  validateBody(updateProviderProfileSchema),
  providerController.updateProfile
);

router.patch(
  '/location',
  protect,
  requireProvider,
  validateBody(updateLocationSchema),
  providerController.updateLocation
);

router.patch(
  '/availability',
  protect,
  requireProvider,
  validateBody(availabilitySchema),
  providerController.updateAvailability
);

router.put(
  '/availability/schedule',
  protect,
  requireProvider,
  validateBody(scheduleSchema),
  providerController.updateSchedule
);

router.get(
  '/jobs',
  protect,
  requireProvider,
  validateQuery(providerJobsFilterSchema),
  providerController.getJobs
);

router.get(
  '/jobs/available',
  protect,
  requireProvider,
  validateQuery(providerJobsFilterSchema),
  providerController.getAvailableJobs
);

router.patch(
  '/jobs/:jobId/accept-reject',
  protect,
  requireProvider,
  validateParams(jobIdSchema),
  validateBody(acceptRejectJobSchema),
  providerController.acceptRejectJob
);

router.patch(
  '/jobs/:jobId/status',
  protect,
  requireProvider,
  validateParams(jobIdSchema),
  validateBody(updateJobStatusSchema),
  providerController.updateJobStatus
);

router.get(
  '/earnings',
  protect,
  requireProvider,
  providerController.getEarnings
);

router.get(
  '/jobs/:jobId/navigation',
  protect,
  requireProvider,
  validateParams(jobIdSchema),
  providerController.getNavigation
);

router.get(
  '/jobs/:jobId/whatsapp',
  protect,
  requireProvider,
  validateParams(jobIdSchema),
  providerController.getWhatsApp
);

router.get(
  '/public/:providerId',
  providerController.getPublicProfile
);

router.get(
  '/admin',
  protect,
  requireAdmin,
  validateQuery(providerFilterSchema),
  providerController.getAllProviders
);

router.get(
  '/admin/:providerId',
  protect,
  requireAdmin,
  validateParams(providerIdSchema),
  providerController.getProviderDetails
);

router.patch(
  '/admin/:providerId/approve-reject',
  protect,
  requireAdmin,
  validateParams(providerIdSchema),
  validateBody(approveRejectProviderSchema),
  providerController.approveRejectProvider
);

export default router;
