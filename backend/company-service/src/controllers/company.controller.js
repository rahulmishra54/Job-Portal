import { Company } from "../models/company.model.js";
import mongoose from "mongoose";
import redis from "../services/redis.js";

import {uploadCompanyLogo,updateCompanyLogo} from "../utils/uploadUserFile.js"
export const registerCompany = async (req, res) => {
    try {
        if (req.role !== "recruiter") {
            return res.status(403).json({ message: "Only recruiters can register companies.", success: false });
        }
        const {
            companyName,
            description,
            website,
            location
        } = req.body;

        const logo = req.file;

        // 1. Validate company name
        if (!companyName) {
            return res.status(400).json({
                message: "Company name is required.",
                success: false
            });
        }

        // 2. Check if company already exists
        const existingCompany = await Company.findOne({
            name: companyName
        });

        if (existingCompany) {
            return res.status(400).json({
                message: "You can't register same company.",
                success: false
            });
        }

        // 3. Upload logo to Cloudinary
        let logoData = { companyLogo: null };

        if (logo) {
            if (!logo.mimetype.startsWith("image/")) {
                return res.status(400).json({
                    message: "Company logo must be an image.",
                    success: false
                });
            }

            logoData = await uploadCompanyLogo(logo);
        }

        // 4. Create company
        const company = await Company.create({
            name: companyName,
            description,
            website,
            location,
            logo: logoData.companyLogo
                ? {
                    url: logoData.companyLogo.url,
                    publicId: logoData.companyLogo.publicId
                }
                : undefined,
            userId: req.id
        });

        await redis.del(`companies:${req.id}`);

        // 5. Response
        return res.status(201).json({
            message: "Company registered successfully.",
            company,
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

export const getCompany = async (req, res) => {
    try {
        const userId = req.id;

        // Create unique Redis key for this user's companies
        const cacheKey = `companies:${userId}`;

        // 1. Check Redis
        let cachedCompanies;
        if (redis.isOpen) {
            try {
                cachedCompanies = await redis.get(cacheKey);
            } catch (error) {
                console.error("Company cache read failed:", error);
            }
        }

        if (cachedCompanies) {
            return res.status(200).json({
                companies: JSON.parse(cachedCompanies),
                success: true
            });
        }

        // 2. Redis doesn't have the data → get from MongoDB
        const companies = await Company.find({ userId });

        if (!companies || companies.length === 0) {
            return res.status(200).json({
                companies: [],
                success: true
            });
        }

        // 3. Store the result in Redis
        if (redis.isOpen) {
            try {
                await redis.set(cacheKey, JSON.stringify(companies), { EX: 600 });
            } catch (error) {
                console.error("Company cache write failed:", error);
            }
        }

        // 4. Send response
        return res.status(200).json({
            companies,
            success: true
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};
/// get company by id

export const getCompanyById = async (req, res) => {
    try {
        const companyId = req.params.id;

        if (!mongoose.isValidObjectId(companyId)) {
            return res.status(400).json({ message: "Invalid company id.", success: false });
        }

        // 1. Create a unique cache key for this company
        const cacheKey = `company:${companyId}`;

        // 2. Check Redis first
        const cachedCompany = await redis.get(cacheKey);

        if (cachedCompany) {
            return res.status(200).json({
                company: JSON.parse(cachedCompany),
                success: true
            });
        }

        // 3. Redis doesn't have company → get it from MongoDB
        const company = await Company.findById(companyId);

        if (!company) {
            return res.status(404).json({
                message: "Company not found.",
                success: false
            });
        }

        // 4. Store company in Redis for 10 minutes
        await redis.set(
            cacheKey,
            JSON.stringify(company),
            "EX",
            600
        );

        // 5. Return company
        return res.status(200).json({
            company,
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

export const getPublicCompanyById = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid company id.", success: false });
        }
        const company = await Company.findById(req.params.id).select("name logo location website").lean();
        if (!company) {
            return res.status(404).json({ message: "Company not found.", success: false });
        }
        return res.status(200).json({ company, success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error.", success: false });
    }
};
export const updateCompany = async (req, res) => {
    try {
        const { name, description, website, location } = req.body;

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid company id.", success: false });
        }

        const company = await Company.findById(req.params.id);

        if (!company) {
            return res.status(404).json({
                message: "Company not found.",
                success: false
            });
        }

        if (company.userId.toString() !== req.id) {
            return res.status(403).json({ message: "You are not allowed to update this company.", success: false });
        }

        // Update only fields that were provided
        const updateData = {};

        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (website !== undefined) updateData.website = website;
        if (location !== undefined) updateData.location = location;

        // Upload new logo only if user provided one
        if (req.file) {
            if (!req.file.mimetype.startsWith("image/")) {
                return res.status(400).json({
                    message: "Company logo must be an image.",
                    success: false
                });
            }

            const logoData = await updateCompanyLogo(req.file, company.logo);

            updateData.logo = logoData.companyLogo;
        }

        const updatedCompany = await Company.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        await redis.del(`company:${req.params.id}`);
        await redis.del(`companies:${req.id}`);

        return res.status(200).json({
            message: "Company information updated.",
            company: updatedCompany,
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