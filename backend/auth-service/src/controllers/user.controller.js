import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import {uploadUserFiles,updateUserFiles} from "../utils/uploadUserFile.js";


export const register = async (req, res) => {
    try {
        const { fullname, email, phoneNumber, password, role } = req.body;

        if (!fullname || !email || !phoneNumber || !password || !role) {
            return res.status(400).json({
                message: "Something is missing",
                success: false
            });
        }

        if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8 || !["student", "recruiter"].includes(role)) {
          return res.status(400).json({ message: "Invalid email, password, or role.", success: false });
        }

        const profilePhoto = req.files?.profilePhoto?.[0];
        const resume = req.files?.resume?.[0];
        

        

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                message: 'User already exist with this email.',
                success: false,
            })
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const userData = await uploadUserFiles(profilePhoto, resume);
        const user = await User.create({
            fullname,
            email,
            phoneNumber,
            password: hashedPassword,
            role,
            profile: {
              resume: userData.resume
                ? { url: userData.resume.url, publicId: userData.resume.publicId, originalName: resume.originalname }
                : undefined,
              profilePhoto: userData.profilePhoto
                ? { url: userData.profilePhoto.url, publicId: userData.profilePhoto.publicId }
                : undefined
            }
        });

          const accessToken = jwt.sign({ userId: user._id, role: user.role }, process.env.ACCESS_SECRET_KEY, { expiresIn: "15m" });

          const refreshToken = jwt.sign({ userId: user._id, role: user.role, tokenVersion: user.tokenVersion }, process.env.REFRESH_SECRET_KEY, { expiresIn: "7d" });

        

        const responseUser = {
          _id: user._id,
          fullname: user.fullname,
          email: user.email,
          phoneNumber: user.phoneNumber,
          role: user.role,
          profile: user.profile
        };

        return res.status(201).cookie("refreshToken", refreshToken, { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true, sameSite: 'strict' }).json({
            accessToken,
            user: responseUser,
            message: "Account created successfully.",
            success: true
        });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error.", success: false });
    }
}
export const login = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({
                message: "Something is missing",
                success: false
            });
        };
        if (!/^\S+@\S+\.\S+$/.test(email) || !["student", "recruiter"].includes(role)) {
          return res.status(400).json({ message: "Invalid email or role.", success: false });
        }
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                message: "Incorrect email or password.",
                success: false,
            })
        }
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(400).json({
                message: "Incorrect email or password.",
                success: false,
            })
        };
        // check role is correct or not
        if (role !== user.role) {
            return res.status(400).json({
                message: "Account doesn't exist with current role.",
                success: false
            })
        };

        
        const accessToken = jwt.sign({ userId: user._id, role: user.role }, process.env.ACCESS_SECRET_KEY, { expiresIn: "15m" });

        const refreshToken = jwt.sign({ userId: user._id, role: user.role, tokenVersion: user.tokenVersion }, process.env.REFRESH_SECRET_KEY, { expiresIn: "7d" });

        user = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            profile: user.profile
        }

        return res.status(200).cookie("refreshToken", refreshToken, { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true, sameSite: 'strict' }).json({
            accessToken, 
            message: `Welcome back ${user.fullname}`,
            user,
            success: true
        })
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error.", success: false });
    }
}
export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
          try {
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY);
            await User.findByIdAndUpdate(decoded.userId, { $inc: { tokenVersion: 1 } });
          } catch (error) {
            console.error("Refresh token revocation failed:", error.message);
          }
        }
        res.clearCookie("refreshToken", { httpOnly: true, sameSite: 'strict' });
        return res.status(200).json({
            message: "Logged out successfully.",
            success: true
        })
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error.", success: false });
    }
}


export const updateProfile = async (req, res) => {
  try {
    const { fullname, email, phoneNumber, bio, skills } = req.body;
    const id = req.id;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid user id." });
    }

    // Get uploaded files
    const profilePhoto = req.files?.profilePhoto?.[0];
    const resume = req.files?.resume?.[0];

    // Find existing user
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Existing Cloudinary files
    const oldProfilePhoto = user.profile.profilePhoto;
    const oldResume = user.profile.resume;

    // Upload new files if provided
    const files = await updateUserFiles(
      profilePhoto,
      resume,
      oldProfilePhoto,
      oldResume
    );

    // Update normal fields
    if (fullname !== undefined) user.fullname = fullname;
    if (email !== undefined) {
      const normalizedEmail = String(email).trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
        return res.status(400).json({ success: false, message: "Invalid email." });
      }
      const duplicate = await User.findOne({ email: normalizedEmail, _id: { $ne: id } });
      if (duplicate) return res.status(400).json({ success: false, message: "Email is already in use." });
      user.email = normalizedEmail;
    }
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (bio !== undefined) user.profile.bio = bio;
    if (skills !== undefined) user.profile.skills = String(skills).split(",").map(skill => skill.trim()).filter(Boolean);

    // Update profile photo
    if (files.profilePhoto) {
      user.profile.profilePhoto = {
        url: files.profilePhoto.url,
        publicId: files.profilePhoto.publicId,
      };
    }

    // Update resume
    if (files.resume && resume) {
      user.profile.resume = {
        url: files.resume.url,
        publicId: files.resume.publicId,
        originalName: resume.originalname,
      };
    }

    await user.save();

    const updatedUser = {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profile: user.profile,
    };

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: updatedUser,
    });

  } catch (error) {
    console.error(error);
    const status = error.message === "Cloudinary storage is not configured." ? 503 : 500;
    return res.status(status).json({ success: false, message: status === 503 ? error.message : "Internal server error." });
  }
};




export const generateAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token not found",
      });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_SECRET_KEY
    );

    const user = await User.findById(decoded.userId).select("role tokenVersion");
    if (!user || user.tokenVersion !== (decoded.tokenVersion || 0)) {
      return res.status(401).json({ success: false, message: "Refresh session has been revoked" });
    }

    const accessToken = jwt.sign(
      {
        userId: decoded.userId,
        role: user.role,
      },
      process.env.ACCESS_SECRET_KEY,
      {
        expiresIn: "15m",
      }
    );

    return res.status(200).json({
      success: true,
      accessToken,
    });

  } catch (err) {
    console.error(err);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
    });
  }
};