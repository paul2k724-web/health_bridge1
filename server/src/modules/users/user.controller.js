import userService from './user.service.js';
import ApiResponse from '../../shared/utils/response.js';
import asyncHandler from '../../shared/middleware/async.middleware.js';

const getProfile = asyncHandler(async (req, res) => {
  const user = await userService.getUserProfile(req.user._id);
  return ApiResponse.success(res, { user });
});

const getAddresses = asyncHandler(async (req, res) => {
  const addresses = await userService.getAddresses(req.user._id);
  return ApiResponse.success(res, { addresses });
});

const addAddress = asyncHandler(async (req, res) => {
  const address = await userService.addAddress(req.user._id, req.body);
  return ApiResponse.created(res, { address }, 'Address added successfully');
});

const updateAddress = asyncHandler(async (req, res) => {
  const address = await userService.updateAddress(req.user._id, req.params.id, req.body);
  return ApiResponse.success(res, { address }, 'Address updated successfully');
});

const deleteAddress = asyncHandler(async (req, res) => {
  await userService.deleteAddress(req.user._id, req.params.id);
  return ApiResponse.success(res, null, 'Address deleted successfully');
});

const setDefaultAddress = asyncHandler(async (req, res) => {
  const address = await userService.setDefaultAddress(req.user._id, req.params.id);
  return ApiResponse.success(res, { address }, 'Default address updated');
});

export default {
  getProfile,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
