import express from "express";
import { generateAccessToken, login, logout, register, updateProfile } from "../controllers/user.controller.js";
import isAuthenticated from "../middleware/isAuthenticated.js";
import { uploadFiles} from "../middleware/mutler.js";
 
const router = express.Router();

router.route("/register").post(uploadFiles,register);
router.route("/login").post(login);
router.route("/refresh").get(generateAccessToken);
router.route("/logout").get(logout);
router.route("/profile/update").post(isAuthenticated,uploadFiles,updateProfile);

export default router;

