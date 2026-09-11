import { Job } from "../model/job.model.js";
import client from "../service/redis.js";
import { attachCompanies } from "../service/company.js";
import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
    job: mongoose.Schema.Types.ObjectId,
    applicant: mongoose.Schema.Types.ObjectId,
    status: String
});
mongoose.models.Application || mongoose.model("Application", applicationSchema);
const userSchema = new mongoose.Schema({
    savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Job" }]
});
const User = mongoose.models.User || mongoose.model("User", userSchema);

const invalidateJobCaches = async () => {
    try {
        if (!client.isOpen) return;
        const keys = [];
        for (const pattern of ["jobs:*", "public:jobs:*", "public:v2:jobs:*", "public:v3:jobs:*"]) {
            for await (const key of client.scanIterator({ MATCH: pattern })) keys.push(key);
        }
        if (keys.length) await client.del(keys);
    } catch (error) {
        console.error("Job cache invalidation failed:", error);
    }
};
// admin post krega job
export const postJob = async (req, res) => {
    try {
        if (req.role !== "recruiter") {
            return res.status(403).json({
                message: "Only recruiters can create jobs.",
                success: false
            });
        }
        const { title, description, requirements, salary, location, jobType, experience, position, companyId } = req.body;
        const userId = req.id;
        const normalizedSalary = String(salary || "").trim().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*lakh(?:s)?$/);
        const salaryValue = normalizedSalary ? Number(normalizedSalary[1]) * 100000 : Number(salary);
        const experienceValue = Number(experience);
        const positionValue = Number(position);
        const requirementsValue = typeof requirements === "string"
            ? requirements.split(",").map(requirement => requirement.trim()).filter(Boolean)
            : requirements;

        if (
            !title ||
            !description ||
            !requirementsValue?.length ||
            !location ||
            !jobType ||
            !Number.isFinite(salaryValue) ||
            !Number.isFinite(experienceValue) ||
            !Number.isFinite(positionValue) ||
            positionValue <= 0 ||
            !companyId ||
            !mongoose.isValidObjectId(companyId)
        ) {
            return res.status(400).json({
                message: "Please provide valid job details and a company.",
                success: false
            })
        };
        const companyResponse = await fetch(`http://localhost:5002/api/v1/company/get/${companyId}`, {
            headers: { Authorization: req.headers.authorization }
        });
        if (!companyResponse.ok) {
            return res.status(companyResponse.status === 404 ? 404 : 400).json({
                message: "Company not found.",
                success: false
            });
        }
        const companyData = await companyResponse.json();
        if (String(companyData.company?.userId) !== String(userId)) {
            return res.status(403).json({
                message: "You are not allowed to create a job for this company.",
                success: false
            });
        }
        const job = await Job.create({
            title,
            description,
            requirements: requirementsValue,
            salary: salaryValue,
            location,
            jobType,
            experienceLevel: experienceValue,
            position: positionValue,
            company: companyId,
            created_by: userId
        });
        await invalidateJobCaches();
        return res.status(201).json({
            message: "New job created successfully.",
            job,
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Unable to create job.",
            success: false
        });
    }
}

const getOwnedJob = async (jobId, userId) => {
    if (!mongoose.isValidObjectId(jobId)) return null;
    const job = await Job.findById(jobId);
    return job && String(job.created_by) === String(userId) ? job : null;
};

export const updateJob = async (req, res) => {
    try {
        if (req.role !== "recruiter") {
            return res.status(403).json({ message: "Only recruiters can update jobs.", success: false });
        }
        const job = await getOwnedJob(req.params.id, req.id);
        if (!job) return res.status(404).json({ message: "Job not found.", success: false });

        const { title, description, requirements, salary, location, jobType, experience, position, companyId } = req.body;
        const salaryMatch = String(salary || "").trim().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*lakh(?:s)?$/);
        const salaryValue = salaryMatch ? Number(salaryMatch[1]) * 100000 : Number(salary);
        const experienceValue = Number(experience);
        const positionValue = Number(position);
        const requirementsValue = typeof requirements === "string"
            ? requirements.split(",").map(requirement => requirement.trim()).filter(Boolean)
            : requirements;
        if (!title || !description || !requirementsValue?.length || !location || !jobType ||
            !Number.isFinite(salaryValue) || !Number.isFinite(experienceValue) ||
            !Number.isFinite(positionValue) || positionValue <= 0 ||
            !companyId || !mongoose.isValidObjectId(companyId)) {
            return res.status(400).json({ message: "Please provide valid job details and a company.", success: false });
        }
        const companyResponse = await fetch(`http://localhost:5002/api/v1/company/get/${companyId}`, {
            headers: { Authorization: req.headers.authorization }
        });
        if (!companyResponse.ok) return res.status(404).json({ message: "Company not found.", success: false });
        const companyData = await companyResponse.json();
        if (String(companyData.company?.userId) !== String(req.id)) {
            return res.status(403).json({ message: "You are not allowed to use this company.", success: false });
        }
        job.title = title;
        job.description = description;
        job.requirements = requirementsValue;
        job.salary = salaryValue;
        job.location = location;
        job.jobType = jobType;
        job.experienceLevel = experienceValue;
        job.position = positionValue;
        job.company = companyId;
        await job.save();
        await client.del(`job:${job._id}`);
        await invalidateJobCaches();
        return res.status(200).json({ message: "Job updated successfully.", job, success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Unable to update job.", success: false });
    }
};

export const deleteJob = async (req, res) => {
    try {
        if (req.role !== "recruiter") {
            return res.status(403).json({ message: "Only recruiters can delete jobs.", success: false });
        }
        const job = await getOwnedJob(req.params.id, req.id);
        if (!job) return res.status(404).json({ message: "Job not found.", success: false });
        await Job.deleteOne({ _id: job._id });
        await client.del(`job:${job._id}`);
        await invalidateJobCaches();
        return res.status(200).json({ message: "Job deleted successfully.", success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Unable to delete job.", success: false });
    }
};
// student k liye
export const getAllJobs = async (req, res) => {
    try {
        const keyword = req.query.keyword || "";

        const cacheKey = `jobs:${keyword.toLowerCase()}`;

        
        const cachedJobs = await client.get(cacheKey);

        if (cachedJobs) {
            return res.status(200).json({
                jobs: JSON.parse(cachedJobs),
                success: true
            });
        }

        
        const query = {
            $or: [
                {
                    title: {
                        $regex: keyword,
                        $options: "i"
                    }
                },
                {
                    description: {
                        $regex: keyword,
                        $options: "i"
                    }
                }
            ]
        };

        const jobs = await Job.find(query)
            .sort({ createdAt: -1 });
        const jobsWithCompanies = await attachCompanies(jobs, req.headers.authorization);

    
        await client.setEx(
            cacheKey,
            300,
            JSON.stringify(jobsWithCompanies)
        );

        
        return res.status(200).json({
            jobs: jobsWithCompanies,
            success: true
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Internal server error.",
            success: false
        });
    }
};

export const getPublicJobs = async (req, res) => {
    try {
        const keyword = req.query.keyword || "";
        const cacheKey = `public:v3:jobs:${keyword.toLowerCase()}`;
        let cachedJobs;
        if (client.isOpen) {
            try {
                cachedJobs = await client.get(cacheKey);
            } catch (error) {
                console.error("Public jobs cache read failed:", error);
            }
        }

        if (cachedJobs) {
            return res.status(200).json({
                jobs: JSON.parse(cachedJobs),
                success: true
            });
        }

        const query = {
            $or: [
                { title: { $regex: keyword, $options: "i" } },
                { description: { $regex: keyword, $options: "i" } }
            ]
        };
        const jobs = await Job.find(query)
            .select("-created_by -applications")
            .sort({ createdAt: -1 })
            .lean();
        const jobsWithCompanies = await attachCompanies(jobs);

        if (client.isOpen) {
            try {
                await client.setEx(cacheKey, 300, JSON.stringify(jobsWithCompanies));
            } catch (error) {
                console.error("Public jobs cache write failed:", error);
            }
        }

        return res.status(200).json({ jobs: jobsWithCompanies, success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error.",
            success: false
        });
    }
};
// student
export const getJobById = async (req, res) => {
    try {
        const jobId = req.params.id;
        const job = await Job.findById(jobId).populate({
            path: "applications"
        });

        if (!job) {
            return res.status(404).json({
                message: "Job not found.",
                success: false
            });
        }

        return res.status(200).json({
            job,
            success: true
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Internal server error.",
            success: false
        });
    }
};
// admin kitne job create kra hai abhi tk
export const getAdminJobs = async (req, res) => {
    try {
        const adminId = req.id;

        const jobs = await Job.find({ created_by: adminId })
            .sort({ createdAt: -1 });

        if (jobs.length === 0) {
            return res.status(200).json({
                jobs: [],
                success: true
            });
        }

        return res.status(200).json({
            jobs: await attachCompanies(jobs, req.headers.authorization),
            success: true
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Internal server error.",
            success: false
        });
    }
};

export const saveJob = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid job id.", success: false });
        const job = await Job.findById(req.params.id).select("_id").lean();
        if (!job) return res.status(404).json({ message: "Job not found.", success: false });
        await User.findByIdAndUpdate(req.id, { $addToSet: { savedJobs: job._id } });
        return res.status(200).json({ message: "Job saved successfully.", success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Unable to save job.", success: false });
    }
};

export const unsaveJob = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid job id.", success: false });
        await User.findByIdAndUpdate(req.id, { $pull: { savedJobs: req.params.id } });
        return res.status(200).json({ message: "Job removed from saved jobs.", success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Unable to remove saved job.", success: false });
    }
};