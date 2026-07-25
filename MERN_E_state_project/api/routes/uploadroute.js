import express from "express";
import upload from "../middleware/upload.middleware.js";
import { verifyUser } from "../middleware/verifyUser.js";
import { uploadImage } from "../controlers/uploadcontroller.js";

const router = express.Router();

router.post("/image", verifyUser, upload.single("image"), uploadImage);

export default router;
