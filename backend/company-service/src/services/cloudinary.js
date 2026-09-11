import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file for the first time.
 */
export const uploadFile = async (
  buffer,
  folder,
  resourceType = "auto"
) => {
  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    stream.end(buffer);
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
};


/**
 * Replace an existing file.
 */
export const updateFile = async (
  buffer,
  oldPublicId,
  folder,
  resourceType = "auto"
) => {
  const newFile = await uploadFile(
    buffer,
    folder,
    resourceType
  );

  if (oldPublicId) {
    await cloudinary.uploader.destroy(oldPublicId, {
      resource_type: resourceType,
    });
  }

  return newFile;
};