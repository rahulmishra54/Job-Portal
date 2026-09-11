import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";

import userRoute from "./routes/user.route.js";




const app = express();

// middleware
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
const corsOptions = {
    origin:'http://localhost:5173',
    credentials:true
}

app.use(cors(corsOptions));



// api's
app.use("/api/v1/user", userRoute);




app.use((req, res) => {
    res.status(404).json({ success: false, message: "Route not found." });
});

app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const status = error instanceof SyntaxError && error.body ? 400 : 500;
    res.status(status).json({
        success: false,
        message: status === 400 ? "Invalid JSON body." : "Internal server error."
    });
});

export default app;