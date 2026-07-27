import express from "express";
import {
  createListing,
  getListing,
  deleteListing,
} from "../controlers/listingController.js";
import { verifyToken } from "../utils/verifyUser.js";

const router = express.Router();

router.post('/create', verifyToken, createListing);
router.get('/get/:id', getListing);
router.delete('/delete/:id', verifyToken, deleteListing);

export default router;
