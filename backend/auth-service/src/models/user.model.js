import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullname: {  
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["student", "recruiter"],
      required: true,
    },

    tokenVersion: {
      type: Number,
      default: 0,
    },

    profile: {
      bio: {
        type: String,
        default: null,
      },

      skills: {
        type: [String],
        default: [],
      },

      resume: {
        url: {
          type: String,
          default: null,
        },

        publicId: {
          type: String,
          default: null,
        },

        originalName: {
          type: String,
          default: null,
        },
      },

      company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        default: null,
      },

      profilePhoto: {
        url: {
          type: String,
          default: null,
        },

        publicId: {
          type: String,
          default: null,
        },
      },

    },
    savedJobs: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job"
    }],
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model("User", userSchema);