import mongoose from "mongoose";

const listingSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        address: {
            type: String,
            required: true,
        },
        regularPrice: {
            type: Number,
            required: true,
        },
        discountPrice: {
            type: Number,
            required: true,
            min: 0,
        },
        bedrooms: {
            type: Number,
            required: true,
            min: 1,
            max: 10,
        },
        bathrooms: {
            type: Number,
            required: true,
            min: 1,
            max: 10,
        },
        furnished: {
            type: Boolean,
            required: true,
        },
        parking: {
            type: Boolean,
            required: true,
        },
        type: {
            type: String,
            required: true,
            enum: ['sale', 'rent'],
        },
        offer: {
            type: Boolean,
            required: true,
        },
        imageUrls: {
            type: [String],
            required: true,
            validate: {
                validator: (images) => images.length >= 1 && images.length <= 6,
                message: 'A listing must have between 1 and 6 images',
            },
        },
        userRef: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

    }, { timestamps: true }
);


const Listing = mongoose.model('Listing', listingSchema);

export default Listing;
