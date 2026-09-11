import express from "express";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import {
    getAdminJobs,
    getAllJobs,
    getPublicJobs,
    getJobById,
    postJob,
    updateJob,
    deleteJob,
    saveJob,
    unsaveJob
} from "../controller/job.controller.js";

const router = express.Router();

router.route("/post").post(isAuthenticated, postJob);
router.route("/update/:id").put(isAuthenticated, updateJob);
router.route("/delete/:id").delete(isAuthenticated, deleteJob);
router.route("/save/:id").post(isAuthenticated, saveJob);
router.route("/save/:id").delete(isAuthenticated, unsaveJob);

router.route("/public").get(getPublicJobs);
router.route("/get").get(isAuthenticated, getAllJobs);

router.route("/getadminjobs").get(isAuthenticated, getAdminJobs);

router.route("/get/:id").get(isAuthenticated, getJobById);

export default router;