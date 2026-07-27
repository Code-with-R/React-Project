import Listing from "../models/listing.model.js";
import { errorHandler } from "../utils/error.js";
import cloudinary from "../config/cloudinary.js";

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

export const deleteListing = async (req, res, next) => {
    try {
        const listing = await Listing.findById(req.params.id);

        if (!listing) {
            return next(errorHandler(404, 'Listing not found!'));
        }

        if (req.user.id !== listing.userRef.toString()) {
            return next(errorHandler(403, 'You can only delete your own listings!'));
        }

        await Listing.findByIdAndDelete(req.params.id);

        const publicIds = listing.imageUrls
            .map((imageUrl) => {
                try {
                    const uploadPath = new URL(imageUrl).pathname.split('/upload/')[1];
                    if (!uploadPath) return null;
                    const withoutVersion = uploadPath.replace(/^v\d+\//, '');
                    const publicId = decodeURIComponent(
                        withoutVersion.replace(/\.[^/.]+$/, '')
                    );
                    return publicId.startsWith('mern-project/listings/')
                        ? publicId
                        : null;
                } catch {
                    return null;
                }
            })
            .filter(Boolean);

        await Promise.allSettled(
            publicIds.map((publicId) => cloudinary.uploader.destroy(publicId))
        );

        res.status(200).json({
            success: true,
            message: 'Listing has been deleted!',
            listingId: listing._id,
        });
    } catch (error) {
        next(error);
    }
};

export const updateListing = async (req, res, next) => {
    try {
        const listing = await Listing.findById(req.params.id);
        if (!listing) {
            return next(errorHandler(404, 'Listing not found!'));
        }
        if (req.user.id !== listing.userRef.toString()) {
            return next(errorHandler(403, 'You can only update your own listings!'));
        }

        const imageUrls = Array.isArray(req.body.imageUrls)
            ? req.body.imageUrls
            : [];
        if (imageUrls.length < 1 || imageUrls.length > 6) {
            return next(errorHandler(400, 'Upload between 1 and 6 images'));
        }
        if (
            req.body.offer &&
            Number(req.body.discountPrice) >= Number(req.body.regularPrice)
        ) {
            return next(
                errorHandler(400, 'Discount price must be lower than regular price')
            );
        }

        const allowedFields = [
            'name',
            'description',
            'address',
            'type',
            'bedrooms',
            'bathrooms',
            'regularPrice',
            'discountPrice',
            'offer',
            'parking',
            'furnished',
            'imageUrls',
        ];
        const updates = Object.fromEntries(
            allowedFields
                .filter((field) => req.body[field] !== undefined)
                .map((field) => [field, req.body[field]])
        );
        updates.imageUrls = imageUrls;
        updates.discountPrice = updates.offer ? updates.discountPrice : 0;

        const updatedListing = await Listing.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        const removedImageUrls = listing.imageUrls.filter(
            (imageUrl) => !imageUrls.includes(imageUrl)
        );
        const removedPublicIds = removedImageUrls
            .map((imageUrl) => {
                try {
                    const uploadPath = new URL(imageUrl).pathname.split('/upload/')[1];
                    if (!uploadPath) return null;
                    const withoutVersion = uploadPath.replace(/^v\d+\//, '');
                    const publicId = decodeURIComponent(
                        withoutVersion.replace(/\.[^/.]+$/, '')
                    );
                    return publicId.startsWith('mern-project/listings/')
                        ? publicId
                        : null;
                } catch {
                    return null;
                }
            })
            .filter(Boolean);

        await Promise.allSettled(
            removedPublicIds.map((publicId) => cloudinary.uploader.destroy(publicId))
        );

        res.status(200).json(updatedListing);
    } catch (error) {
        next(error);
    }
};
