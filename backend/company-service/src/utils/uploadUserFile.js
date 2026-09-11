import { uploadFile, updateFile } from "../services/cloudinary.js";

export const uploadCompanyLogo = async (companyLogo) => {
    if (companyLogo && !companyLogo.mimetype.startsWith("image/")) {
        throw new Error("Company logo must be an image");
    }

    if (!companyLogo) {
        return {
            companyLogo: null
        };
    }

    const companyLogoResult = await uploadFile(
        companyLogo.buffer,
        "jobportal/company",
        "image"
    );

    return {
        companyLogo: companyLogoResult
    };
};


export const updateCompanyLogo = async (
    companyLogo,
    oldCompanyLogo
) => {
    if (companyLogo && !companyLogo.mimetype.startsWith("image/")) {
        throw new Error("Company logo must be an image");
    }

    if (!companyLogo) {
        return {
            companyLogo: oldCompanyLogo
        };
    }

    const companyLogoResult = await updateFile(
        companyLogo.buffer,
        oldCompanyLogo?.publicId,
        "jobportal/company",
        "image"
    );

    return {
        companyLogo: companyLogoResult
    };
};