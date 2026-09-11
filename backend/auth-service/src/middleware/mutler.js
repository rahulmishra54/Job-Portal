import multer from "multer";

const storage = multer.memoryStorage();

export const uploadFiles = multer({ storage }).fields([
    {
        name: "profilePhoto",
        maxCount: 1
    },
    {
        name: "resume",
        maxCount: 1
    }
]);