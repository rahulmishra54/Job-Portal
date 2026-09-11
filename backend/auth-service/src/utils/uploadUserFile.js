import {uploadFile,updateFile} from "../services/cloudinary.js"



export const uploadUserFiles = async (profilePhoto, resume) => {
  if (profilePhoto && !profilePhoto.mimetype.startsWith("image/")) {
    throw new Error("Profile photo must be an image");
  }

  if (resume && resume.mimetype !== "application/pdf") {
    throw new Error("Resume must be a PDF");
  }

  const [profilePhotoResult, resumeResult] = await Promise.all([
    profilePhoto
      ? uploadFile(
          profilePhoto.buffer,
          "jobportal/profile",
          "image"
        )
      : null,

    resume
      ? uploadFile(
          resume.buffer,
          "jobportal/resumes",
          "raw"
        )
      : null,
  ]);

  return {
    profilePhoto: profilePhotoResult,
    resume: resumeResult,
  };
};


export const updateUserFiles = async (
  profilePhoto,
  resume,
  oldProfilePhoto,
  oldResume
) => {
  // Validate profile photo
  if (
    profilePhoto &&
    !profilePhoto.mimetype.startsWith("image/")
  ) {
    throw new Error("Profile photo must be an image");
  }

  // Validate resume
  if (
    resume &&
    resume.mimetype !== "application/pdf"
  ) {
    throw new Error("Resume must be a PDF");
  }

  // Upload both independently
  const [profilePhotoResult, resumeResult] = await Promise.all([
    profilePhoto
      ? updateFile(
          profilePhoto.buffer,
          oldProfilePhoto?.publicId,
          "jobportal/profile",
          "image"
        )
      : null,

    resume
      ? updateFile(
          resume.buffer,
          oldResume?.publicId,
          "jobportal/resumes",
          "raw"
        )
      : null,
  ]);

  return {
    profilePhoto: profilePhotoResult,
    resume: resumeResult,
  };
};
