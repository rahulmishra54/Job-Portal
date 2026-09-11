import express from "express";
import {isAuthenticated} from "../middlewares/isAuthenticated.js";
import { getCompany, getCompanyById, getPublicCompanyById, registerCompany, updateCompany } from "../controllers/company.controller.js";
import { uploadCompanyLogo } from "../middlewares/multer.js";

const router = express.Router();

router.route("/register").post(isAuthenticated, uploadCompanyLogo, registerCompany);
router.route("/get").get(isAuthenticated,getCompany);
router.route("/public/:id").get(getPublicCompanyById);
router.route("/get/:id").get(isAuthenticated,getCompanyById);
router.route("/update/:id").put(isAuthenticated,uploadCompanyLogo, updateCompany);

export default router;

