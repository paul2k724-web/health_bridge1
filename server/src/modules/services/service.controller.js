import serviceService from './service.service.js';
import { getProvidersForService } from '../../shared/utils/autoAssign.js';
import ApiResponse from '../../shared/utils/response.js';
import asyncHandler from '../../shared/middleware/async.middleware.js';

const getActiveServices = asyncHandler(async (req, res) => {
  const services = await serviceService.getActiveServices();
  return ApiResponse.success(res, { services });
});

const getAllServices = asyncHandler(async (req, res) => {
  const result = await serviceService.getAllServices(req.query);
  return ApiResponse.paginated(res, result.services, result.pagination);
});

const getServiceById = asyncHandler(async (req, res) => {
  const service = await serviceService.getServiceById(req.params.id);
  return ApiResponse.success(res, { service });
});

const getServiceProviders = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { latitude, longitude, radius = 15 } = req.query;
  
  const providers = await getProvidersForService(
    id,
    parseFloat(longitude) || 77.2090,
    parseFloat(latitude) || 28.6139,
    parseInt(radius)
  );
  
  return ApiResponse.success(res, { providers });
});

const createService = asyncHandler(async (req, res) => {
  const service = await serviceService.createService(req.body);
  return ApiResponse.created(res, { service }, 'Service created successfully');
});

const updateService = asyncHandler(async (req, res) => {
  const service = await serviceService.updateService(req.params.id, req.body);
  return ApiResponse.success(res, { service }, 'Service updated successfully');
});

const deleteService = asyncHandler(async (req, res) => {
  const result = await serviceService.deleteService(req.params.id);
  return ApiResponse.success(res, null, result.message);
});

export default {
  getActiveServices,
  getAllServices,
  getServiceById,
  getServiceProviders,
  createService,
  updateService,
  deleteService,
};
