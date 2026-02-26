import { Router } from 'express';
import serviceController from './service.controller.js';
import { validateBody, validateParams, validateQuery } from '../../shared/middleware/validate.middleware.js';
import {
  createServiceSchema,
  updateServiceSchema,
  serviceIdSchema,
  serviceFilterSchema,
} from './service.validator.js';
import { protect, optionalAuth } from '../../shared/middleware/auth.middleware.js';
import { requireAdmin } from '../../shared/middleware/role.middleware.js';

const router = Router();

router.get('/', serviceController.getActiveServices);

router.get('/:id', serviceController.getServiceById);

router.get(
  '/:id/providers',
  serviceController.getServiceProviders
);

router.get('/customer', protect, serviceController.getActiveServices);

// Admin routes
router.get(
  '/admin',
  protect,
  requireAdmin,
  validateQuery(serviceFilterSchema),
  serviceController.getAllServices
);

router.post(
  '/admin',
  protect,
  requireAdmin,
  validateBody(createServiceSchema),
  serviceController.createService
);

router.put(
  '/admin/:id',
  protect,
  requireAdmin,
  validateParams(serviceIdSchema),
  validateBody(updateServiceSchema),
  serviceController.updateService
);

router.delete(
  '/admin/:id',
  protect,
  requireAdmin,
  validateParams(serviceIdSchema),
  serviceController.deleteService
);

export default router;
