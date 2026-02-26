import User from '../../models/User.model.js';
import Address from '../../models/Address.model.js';
import AuditLog from '../../models/AuditLog.model.js';

class UserRepository {
  async findUserById(id) {
    return await User.findById(id).populate('addresses');
  }

  async findUserWithAddresses(userId) {
    return await User.findById(userId).populate({
      path: 'addresses',
      options: { sort: { isDefault: -1, createdAt: -1 } },
    });
  }

  async createAddress(userId, addressData) {
    const address = await Address.create({
      user: userId,
      ...addressData,
    });

    await User.findByIdAndUpdate(userId, {
      $push: { addresses: address._id },
    });

    if (address.isDefault) {
      await User.findByIdAndUpdate(userId, {
        defaultAddress: address._id,
      });
    }

    return address;
  }

  async findAddressById(addressId, userId = null) {
    const query = { _id: addressId };
    if (userId) {
      query.user = userId;
    }
    return await Address.findOne(query);
  }

  async updateAddress(addressId, userId, updateData) {
    const address = await Address.findOneAndUpdate(
      { _id: addressId, user: userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (address && address.isDefault) {
      await User.findByIdAndUpdate(userId, {
        defaultAddress: address._id,
      });
    }

    return address;
  }

  async deleteAddress(addressId, userId) {
    const address = await Address.findOneAndDelete({
      _id: addressId,
      user: userId,
    });

    if (address) {
      await User.findByIdAndUpdate(userId, {
        $pull: { addresses: addressId },
        $unset: address.isDefault ? { defaultAddress: 1 } : {},
      });
    }

    return address;
  }

  async getUserAddresses(userId) {
    return await Address.find({ user: userId }).sort({ isDefault: -1, createdAt: -1 });
  }

  async createAuditLog(logData) {
    return await AuditLog.create(logData);
  }
}

export default new UserRepository();
