import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userRouter from './routes/user_route.js';
import authRouter from './routes/auth_route.js';
import uploadRouter from "./routes/uploadroute.js";
import multer from "multer";
import listingRouter from './routes/listingRoute.js';
import cookieParser from 'cookie-parser';


dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use("/api/upload", uploadRouter);
app.get("/", (req, res) => {
    res.send("API is running");
});

app.use(cookieParser());

app.use("/api/user", userRouter);
app.use("/api/auth", authRouter);
app.use("/api/listing", listingRouter);

app.use((err, req, res, next) => {
    const statusCode = err instanceof multer.MulterError ? 400 : err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    return res.status(statusCode).json({
        success: false,
        statusCode,
        message,
    });
});

const startServer = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('Connected to MongoDB!');
        app.listen(port, () => {
            console.log(`Server is running on port ${port}!`);
        });
    } catch (error) {
        console.error("Failed to start the server:", error.message);
        process.exit(1);
    }
};

startServer();
