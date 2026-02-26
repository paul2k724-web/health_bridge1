import serviceRepository from './service.repository.js';
import { NotFoundError, ConflictError } from '../../shared/errors/index.js';
import { getPaginationParams } from '../../shared/utils/pagination.js';
import cacheService from '../../shared/utils/cache.js';

class ServiceService {
  async getActiveServices() {
    return cacheService.getOrSet(
      cacheService.keys.services(),
      () => serviceRepository.findActiveServices(),
      cacheService.ttl.services
    );
  }

  async getAllServices(query = {}) {
    const { page, limit, skip } = getPaginationParams(query);
    
    const filter = {};
    if (query.category) filter.category = query.category;
    if (query.isActive !== undefined) filter.isActive = query.isActive === 'true';

    const services = await serviceRepository.findAllServices({
      ...filter,
      skip,
      limit,
    });
    
    const total = await serviceRepository.countServices(filter);

    return {
      services,
      pagination: { page, limit, total },
    };
  }

  async getServiceById(id) {
    const service = await serviceRepository.findServiceById(id);
    if (!service) {
      throw new NotFoundError('Service not found');
    }
    return service;
  }

  async createService(serviceData) {
    const existing = await serviceRepository.findServiceByName(serviceData.name);
    if (existing) {
      throw new ConflictError('Service with this name already exists');
    }

    const service = await serviceRepository.createService({
      ...serviceData,
      name: serviceData.name.trim(),
    });

    await cacheService.del(cacheService.keys.services());

    return service;
  }

  async updateService(id, updateData) {
    const service = await serviceRepository.findServiceById(id);
    if (!service) {
      throw new NotFoundError('Service not found');
    }

    if (updateData.name) {
      const existing = await serviceRepository.findServiceByName(updateData.name);
      if (existing && existing._id.toString() !== id) {
        throw new ConflictError('Service with this name already exists');
      }
      updateData.name = updateData.name.trim();
    }

    const updated = await serviceRepository.updateService(id, updateData);
    
    await cacheService.del(cacheService.keys.services());
    await cacheService.del(cacheService.keys.serviceById(id));

    return updated;
  }

  async deleteService(id) {
    const service = await serviceRepository.findServiceById(id);
    if (!service) {
      throw new NotFoundError('Service not found');
    }

    await serviceRepository.deleteService(id);
    
    await cacheService.del(cacheService.keys.services());
    await cacheService.del(cacheService.keys.serviceById(id));

    return { message: 'Service deleted successfully' };
  }
}

export default new ServiceService();
