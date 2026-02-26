import User from '../../models/User.model.js';
import RefreshToken from '../../models/RefreshToken.model.js';
import ProviderProfile from '../../models/ProviderProfile.model.js';
import AuditLog from '../../models/AuditLog.model.js';

class AuthRepository {
  async findUserByEmail(email) {
    return await User.findOne({ email: email.toLowerCase(), isDeleted: false });
  }

  async findUserByPhone(phone) {
    return await User.findOne({ phone, isDeleted: false });
  }

  async findUserById(id, includePassword = false) {
    const query = User.findById(id);
    if (includePassword) {
      query.select('+password');
    }
    return await query;
  }

  async findUserWithOTP(id) {
    return await User.findById(id).select('+otp.code');
  }

  async createUser(userData) {
    return await User.create(userData);
  }

  async updateUser(id, updateData) {
    return await User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  }

  async createProviderProfile(profileData) {
    return await ProviderProfile.create(profileData);
  }

  async findProviderProfileByUser(userId) {
    return await ProviderProfile.findOne({ user: userId });
  }

  async createRefreshToken(tokenData) {
    return await RefreshToken.create(tokenData);
  }

  async findActiveRefreshTokens(userId) {
    return await RefreshToken.find({
      user: userId,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    });
  }

  async revokeAllRefreshTokens(userId, reason = 'User action') {
    return await RefreshToken.updateMany(
      { user: userId, isRevoked: false },
      {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: reason,
      }
    );
  }

  async createAuditLog(logData) {
    return await AuditLog.create(logData);
  }

  async getUserForLogin(email) {
    return await User.findOne({
      email: email.toLowerCase(),
      isDeleted: false,
    }).select('+password +loginAttempts +lockUntil');
  }
}

export default new AuthRepository();
