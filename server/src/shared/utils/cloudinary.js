import cloudinary from 'cloudinary';
import config from '../../config/index.js';

cloudinary.v2.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export const uploadToCloudinary = async (filePath, folder = 'uploads') => {
  try {
    const result = await cloudinary.v2.uploader.upload(filePath, {
      folder,
      resource_type: 'auto',
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
      ],
    });
    return result;
  } catch (error) {
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

export const uploadBufferToCloudinary = async (buffer, folder = 'uploads') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.v2.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
        transformation: [
          { quality: 'auto:good' },
          { fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) {
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
        } else {
          resolve(result);
        }
      }
    );
    stream.end(buffer);
  });
};

export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.v2.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error(`Cloudinary delete failed: ${error.message}`);
  }
};

export const getCloudinaryUrl = (publicId, options = {}) => {
  const { width, height, crop = 'fill', quality = 'auto' } = options;
  
  const transformation = [];
  if (width || height) {
    transformation.push({
      width,
      height,
      crop,
    });
  }
  transformation.push({ quality });
  transformation.push({ fetch_format: 'auto' });

  return cloudinary.v2.url(publicId, { transformation });
};

export default {
  uploadToCloudinary,
  uploadBufferToCloudinary,
  deleteFromCloudinary,
  getCloudinaryUrl,
};
