import cloudinary from '../../config/cloudinary';

export const uploadAvatar = async (fileBuffer: Buffer, userId: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `avatars/${userId}`,
        transformation: [{ width: 500, height: 500, crop: 'limit' }],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result!.secure_url);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

export const deleteAvatar = async (avatarUrl: string) => {
  if (!avatarUrl) return;

  const urlParts = avatarUrl.split('/');
  const uploadIndex = urlParts.indexOf('upload');
  
  if (uploadIndex === -1 || uploadIndex + 1 >= urlParts.length) {
    console.error('Invalid Cloudinary URL format:', avatarUrl);
    return;
  }
  
  const publicIdWithVersion = urlParts.slice(uploadIndex + 2).join('/');
  const publicId = publicIdWithVersion.split('.').slice(0, -1).join('.');
  
  console.log('Deleting avatar with public_id:', publicId);
  
  const result = await cloudinary.uploader.destroy(publicId);
  console.log('Cloudinary delete result:', result);
  
  if (result.result !== 'ok') {
    console.error('Failed to delete from Cloudinary:', result);
  }
};