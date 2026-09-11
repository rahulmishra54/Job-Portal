import multer from "multer";

const storage = multer.memoryStorage();

export const uploadCompanyLogo = multer({
    storage
}).single("companyLogo");