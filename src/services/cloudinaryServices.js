// Cloudinary config - உன்னுடைய values போடு
const CLOUDINARY_CONFIG = {
  cloudName: 'dsdi6vvzr', // Dashboard-லிருந்து
  apiKey: '365839181763248',
  uploadPreset: 'f2c_unsigned', // கீழே create பண்ணுவோம்
};

// ════════════════════════════
// Image Upload Function
// ════════════════════════════
export const uploadImageToCloudinary = async (
  imageUri,
  folder = 'products',
) => {
  try {
    // FormData create பண்ணு
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: `zunkako_${Date.now()}.jpg`,
    });
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('folder', `zunkako/${folder}`);
    formData.append('cloud_name', CLOUDINARY_CONFIG.cloudName);

    // Cloudinary API-ல் upload
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    const data = await response.json();

    if (data.secure_url) {
      console.log('Upload success:', data.secure_url);
      return {
        success: true,
        url: data.secure_url, // Full image URL
        publicId: data.public_id, // Cloudinary ID (delete-க்கு)
        width: data.width,
        height: data.height,
      };
    } else {
      throw new Error('Upload failed: ' + JSON.stringify(data));
    }
  } catch (error) {
    console.log('Cloudinary upload error:', error);
    return {success: false, error: error.message};
  }
};

// ════════════════════════════
// Video Upload Function
// (Farmer Story Video-க்கு)
// ════════════════════════════
export const uploadVideoToCloudinary = async videoUri => {
  try {
    const formData = new FormData();
    formData.append('file', {
      uri: videoUri,
      type: 'video/mp4',
      name: `zunkako_story_${Date.now()}.mp4`,
    });
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('folder', 'zunkako/farmer_stories');
    formData.append('resource_type', 'video');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/video/upload`,
      {
        method: 'POST',
        body: formData,
      },
    );

    const data = await response.json();

    if (data.secure_url) {
      return {success: true, url: data.secure_url};
    }
    throw new Error('Video upload failed');
  } catch (error) {
    return {success: false, error: error.message};
  }
};

// ════════════════════════════
// Image Delete Function
// ════════════════════════════
export const deleteImageFromCloudinary = async publicId => {
  // Note: Delete-க்கு server-side signature தேவை
  // Firebase Functions use பண்றோம் (future)
  console.log('Image to delete:', publicId);
};

// ════════════════════════════
// Optimized Image URL Get
// ════════════════════════════
export const getOptimizedImageUrl = (publicId, options = {}) => {
  const {width = 400, height = 400, quality = 'auto'} = options;
  return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload/w_${width},h_${height},q_${quality},f_auto/${publicId}`;
};
