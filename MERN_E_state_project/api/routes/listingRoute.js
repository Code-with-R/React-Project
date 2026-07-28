import express from "express";
import {
  createListing,
  getListing,
  getSimilarListings,
  deleteListing,
  updateListing,
} from "../controlers/listingController.js";
import { verifyToken } from "../utils/verifyUser.js";

const router = express.Router();

router.post('/create', verifyToken, createListing);
router.get('/get/:id', getListing);
router.get('/similar/:id', getSimilarListings);
router.delete('/delete/:id', verifyToken, deleteListing);
router.post('/update/:id', verifyToken, updateListing);

export default router;
