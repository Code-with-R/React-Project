import Listing from "../models/listing.model.js";
import { errorHandler } from "../utils/error.js";

export const createListing = async (req, res, next) =>{
    try {
        const imageUrls = Array.isArray(req.body.imageUrls)
            ? req.body.imageUrls
            : [];

        if (imageUrls.length < 1 || imageUrls.length > 6) {
            return next(errorHandler(400, "Upload between 1 and 6 images"));
        }

        if (
            req.body.offer &&
            Number(req.body.discountPrice) >= Number(req.body.regularPrice)
        ) {
            return next(
                errorHandler(400, "Discount price must be lower than regular price")
            );
        }

        const listing = await Listing.create({
            ...req.body,
            imageUrls,
            discountPrice: req.body.offer ? req.body.discountPrice : 0,
            userRef: req.user.id,
        });
        return res.status(201).json(listing);
    } catch (error) {
        next(error);
    }
};

export const getListing = async (req, res, next) => {
    try {
        const listing = await Listing.findById(req.params.id);
        if (!listing) return next(errorHandler(404, "Listing not found"));
        res.status(200).json(listing);
    } catch (error) {
        next(error);
    }
};
