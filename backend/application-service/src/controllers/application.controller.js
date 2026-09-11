import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";
import "../models/company.model.js";
import "../models/user.model.js";
import mongoose from "mongoose";
import redis from "../services/redis.js";
export const applyJob = async (req, res) => {
    try {
        if (req.role !== "student") {
            return res.status(403).json({ message: "Only students can apply for jobs.", success: false });
        }
        const userId = req.id;
        const jobId = req.params.id;

        if (!jobId) {
            return res.status(400).json({
                message: "Job id is required.",
                success: false
            });
        }

        if (!mongoose.isValidObjectId(jobId)) {
            return res.status(400).json({ message: "Invalid job id.", success: false });
        }

        // Redis rate limit
        const key = `apply:${userId}:${jobId}`;

        // Check if the user has already applied
        const existingApplication = await Application.findOne({
            job: jobId,
            applicant: userId
        });

        if (existingApplication) {
            return res.status(400).json({
                message: "You have already applied for this job.",
                success: false
            });
        }

        // Check if the job exists
        const job = await Job.findById(jobId);

        if (!job) {
            return res.status(404).json({
                message: "Job not found",
                success: false
            });
        }

        const exists = redis.isOpen ? await redis.get(key) : null;
        if (exists) {
            return res.status(429).json({ message: "Please wait before trying again.", success: false });
        }
        if (redis.isOpen) await redis.set(key, "1", { EX: 600 });

        // Create application
        const newApplication = await Application.create({
            job: jobId,
            applicant: userId
        });

        // Add application to job
        job.applications.push(newApplication._id);
        await job.save();
        if (redis.isOpen) {
            await redis.del(`job:${jobId}`);
            await redis.del(`appliedJobs:${userId}`);
        }

        return res.status(201).json({
            message: "Job applied successfully.",
            success: true
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};
export const getAppliedJobs = async (req, res) => {
    try {
        if (req.role !== "student") {
            return res.status(403).json({ message: "Only students can view applications.", success: false });
        }
        const userId = req.id;

        // Unique Redis key for this user's applications
        const key = `appliedJobs:${userId}`;

        // 1. Check Redis first
        const cachedApplications = redis.isOpen ? await redis.get(key) : null;

        if (cachedApplications) {
            return res.status(200).json({
                application: JSON.parse(cachedApplications),
                success: true
            });
        }

        // 2. Redis MISS → get data from MongoDB
        const applications = await Application.find({
            applicant: userId
        })
            .sort({ createdAt: -1 })
            .populate({
                path: "job",
                populate: {
                    path: "company"
                }
            });

        // 3. No applications
        if (applications.length === 0) {
            return res.status(200).json({
                application: [],
                success: true
            });
        }

        // 4. Store result in Redis for 5 minutes
        if (redis.isOpen) await redis.set(key, JSON.stringify(applications), { EX: 300 });

        // 5. Return response
        return res.status(200).json({
            application: applications,
            success: true
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};
// admin dekhega kitna user ne apply kiya hai
export const getApplicants = async (req,res) => {
    try {
        if (req.role !== "recruiter") {
            return res.status(403).json({ message: "Only recruiters can view applicants.", success: false });
        }
        const jobId = req.params.id;
        if (!mongoose.isValidObjectId(jobId)) {
            return res.status(400).json({ message: "Invalid job id.", success: false });
        }
        const job = await Job.findById(jobId).populate({
            path:'applications',
            options:{sort:{createdAt:-1}},
            populate:{
                path:'applicant'
            }
        });
        if(!job){
            return res.status(404).json({
                message:'Job not found.',
                success:false
            })
        };
        if (job.created_by.toString() !== req.id) {
            return res.status(403).json({ message: "You are not allowed to view these applicants.", success: false });
        }
        return res.status(200).json({
            job, 
            success:true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error.", success: false });
    }
}
export const updateStatus = async (req,res) => {
    try {
        if (req.role !== "recruiter") {
            return res.status(403).json({ message: "Only recruiters can update application status.", success: false });
        }
        const {status} = req.body;
        const applicationId = req.params.id;
        if(!status){
            return res.status(400).json({
                message:'status is required',
                success:false
            })
        };
        if (!mongoose.isValidObjectId(applicationId) || !["pending", "accepted", "rejected"].includes(String(status).toLowerCase())) {
            return res.status(400).json({ message: "Invalid application id or status.", success: false });
        }

        // find the application by applicantion id
        const application = await Application.findOne({_id:applicationId});
        if(!application){
            return res.status(404).json({
                message:"Application not found.",
                success:false
            })
        };

        const job = await Job.findById(application.job);
        if (!job || job.created_by.toString() !== req.id) {
            return res.status(403).json({ message: "You are not allowed to update this application.", success: false });
        }

        // update the status
        application.status = status.toLowerCase();
        await application.save();
        if (redis.isOpen) {
            await redis.del(`appliedJobs:${application.applicant}`);
            await redis.del(`job:${application.job}`);
        }

        return res.status(200).json({
            message:"Status updated successfully.",
            success:true
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error.", success: false });
    }
}