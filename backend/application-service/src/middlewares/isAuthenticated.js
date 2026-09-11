
import jwt from "jsonwebtoken";

const isAuthenticated = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Access token not found",
                success: false
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.ACCESS_SECRET_KEY
        );

        req.id = decoded.userId;
        req.role = decoded.role;

        next();

    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired access token",
            success: false
        });
    }
};

export const verifyRefreshToken = (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                message: "Refresh token not found",
                success: false
            });
        }

        const decoded = jwt.verify(
            refreshToken,
            process.env.REFRESH_SECRET_KEY
        );

        req.id = decoded.userId;

        next();

    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired refresh token",
            success: false
        });
    }
};

export default isAuthenticated;