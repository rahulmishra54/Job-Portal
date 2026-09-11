import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    fullname: String,
    email: String,
    phoneNumber: String,
    password: {
        type: String,
        select: false
    },
    role: String,
    profile: mongoose.Schema.Types.Mixed
});

export const User = mongoose.models.User || mongoose.model("User", userSchema);
