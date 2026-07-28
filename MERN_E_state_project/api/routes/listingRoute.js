import express from "express";
import {
  createListing,
  getListing,
  getListings,
  getSimilarListings,
  deleteListing,
  updateListing,
} from "../controlers/listingController.js";

import { verifyToken } from "../utils/verifyUser.js";

const router = express.Router();

router.post("/create", verifyToken, createListing);

// IMPORTANT: Search route
router.get("/get", getListings);

// Single listing route
router.get("/get/:id", getListing);

router.get("/similar/:id", getSimilarListings);

router.delete("/delete/:id", verifyToken, deleteListing);

router.post("/update/:id", verifyToken, updateListing);

export default router;