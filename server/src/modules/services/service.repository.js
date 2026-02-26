import ServiceCategory from '../../models/ServiceCategory.model.js';

class ServiceRepository {
  async findActiveServices() {
    return await ServiceCategory.find({ isActive: true, isDeleted: false })
      .sort({ name: 1 });
  }

  async findAllServices(options = {}) {
    const query = { isDeleted: false };
    
    if (options.category) {
      query.category = options.category;
    }
    
    if (options.isActive !== undefined) {
      query.isActive = options.isActive === 'true';
    }

    let servicesQuery = ServiceCategory.find(query).sort({ createdAt: -1 });

    if (options.skip) {
      servicesQuery = servicesQuery.skip(options.skip);
    }
    
    if (options.limit) {
      servicesQuery = servicesQuery.limit(options.limit);
    }

    return await servicesQuery;
  }

  async findServiceById(id) {
    return await ServiceCategory.findOne({ _id: id, isDeleted: false });
  }

  async findServiceByName(name) {
    return await ServiceCategory.findOne({ name: name.toLowerCase(), isDeleted: false });
  }

  async createService(serviceData) {
    return await ServiceCategory.create(serviceData);
  }

  async updateService(id, updateData) {
    return await ServiceCategory.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
  }

  async deleteService(id) {
    return await ServiceCategory.findByIdAndUpdate(
      id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );
  }

  async countServices(filter = {}) {
    return await ServiceCategory.countDocuments({ ...filter, isDeleted: false });
  }
}

export default new ServiceRepository();
