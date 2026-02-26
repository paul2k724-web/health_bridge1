import userRepository from './user.repository.js';
import Address from '../../models/Address.model.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../../shared/errors/index.js';
import { toGeoJSONPoint } from '../../shared/utils/geo.js';

class UserService {
  async getUserProfile(userId) {
    const user = await userRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return this.sanitizeUser(user);
  }

  async getAddresses(userId) {
    const addresses = await userRepository.getUserAddresses(userId);
    return addresses;
  }

  async addAddress(userId, addressData) {
    if (addressData.coordinates) {
      const { latitude, longitude } = addressData.coordinates;
      if (latitude && longitude) {
        addressData.location = toGeoJSONPoint(latitude, longitude);
        delete addressData.coordinates;
      }
    } else if (addressData.location?.coordinates) {
      const [longitude, latitude] = addressData.location.coordinates;
      addressData.location = toGeoJSONPoint(latitude, longitude);
    }

    const address = await userRepository.createAddress(userId, addressData);

    return address;
  }

  async updateAddress(userId, addressId, addressData) {
    const existingAddress = await userRepository.findAddressById(addressId);
    
    if (!existingAddress) {
      throw new NotFoundError('Address not found');
    }

    if (existingAddress.user.toString() !== userId.toString()) {
      throw new ForbiddenError('You do not have permission to update this address');
    }

    if (addressData.location?.coordinates) {
      const [longitude, latitude] = addressData.location.coordinates;
      addressData.location = toGeoJSONPoint(latitude, longitude);
    }

    const address = await userRepository.updateAddress(addressId, userId, addressData);

    return address;
  }

  async deleteAddress(userId, addressId) {
    const existingAddress = await userRepository.findAddressById(addressId);
    
    if (!existingAddress) {
      throw new NotFoundError('Address not found');
    }

    if (existingAddress.user.toString() !== userId.toString()) {
      throw new ForbiddenError('You do not have permission to delete this address');
    }

    await userRepository.deleteAddress(addressId, userId);

    return { message: 'Address deleted successfully' };
  }

  async setDefaultAddress(userId, addressId) {
    const address = await userRepository.findAddressById(addressId, userId);
    
    if (!address) {
      throw new NotFoundError('Address not found');
    }

    await Address.updateMany(
      { user: userId, isDefault: true },
      { isDefault: false }
    );

    address.isDefault = true;
    await address.save();

    await userRepository.updateUser(userId, { defaultAddress: addressId });

    return address;
  }

  sanitizeUser(user) {
    const obj = user.toObject ? user.toObject() : user;
    delete obj.password;
    delete obj.otp;
    delete obj.resetPasswordToken;
    delete obj.resetPasswordExpire;
    delete obj.__v;
    delete obj.isDeleted;
    return obj;
  }
}

export default new UserService();
