
import express from "express";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

const proxyOptions = (target) => ({
    target,
    on: {
        error: (_error, _req, res) => {
            if (!res.headersSent) {
                res.writeHead(503, { "Content-Type": "application/json" });
                res.end(JSON.stringify({
                    success: false,
                    message: "Service temporarily unavailable"
                }));
            }
        }
    }
});

app.use("/auth-service", createProxyMiddleware(proxyOptions("http://localhost:5001")));

app.use("/company-service", createProxyMiddleware(proxyOptions("http://localhost:5002")));

app.use("/job-service", createProxyMiddleware(proxyOptions("http://localhost:5003")));

app.use("/application-service", createProxyMiddleware(proxyOptions("http://localhost:5004")));

app.use("/ai-feature-service", createProxyMiddleware(proxyOptions("http://localhost:5005")));

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found."
    });
});

app.listen(5000, () => {
    console.log("API Gateway is running on port 5000");
});