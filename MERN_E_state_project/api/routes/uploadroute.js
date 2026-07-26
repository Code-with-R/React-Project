import express from "express";
import upload from "../middleware/upload.middleware.js";
import { verifyUser } from "../middleware/verifyUser.js";
import {
  uploadImage,
  uploadListingImages,
} from "../controlers/uploadcontroller.js";

const router = express.Router();

router.post("/image", verifyUser, upload.single("image"), uploadImage);
router.post(
  "/listing-images",
  verifyUser,
  upload.array("images", 6),
  uploadListingImages
);

export default router;
