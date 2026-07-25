import cloudinary from "../config/cloudinary.js";
import User from "../models/user_mode.js";

const uploadBufferToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "mern-project/users",
        resource_type: "image",
        transformation: [
          {
            width: 800,
            height: 800,
            crop: "limit",
            quality: "auto",
            fetch_format: "auto",
          },
        ],
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};

export const uploadImage = async (req, res, next) => {
  let uploadedPublicId = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image",
      });
    }

    const result = await uploadBufferToCloudinary(req.file.buffer);
    uploadedPublicId = result.public_id;
    const user = await User.findById(req.user.id);

    if (!user) {
      await cloudinary.uploader.destroy(result.public_id);
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const previousPublicId = user.avatarPublicId;
    user.avatar = result.secure_url;
    user.avatarPublicId = result.public_id;
    await user.save();

    if (previousPublicId && previousPublicId !== result.public_id) {
      cloudinary.uploader.destroy(previousPublicId).catch((error) => {
        console.error("Could not delete previous Cloudinary image:", error.message);
      });
    }

    const userObject = user.toObject();
    delete userObject.password;

    return res.status(200).json({
      success: true,
      message: "Profile image uploaded and saved successfully",
      user: userObject,
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);

    if (uploadedPublicId) {
      await cloudinary.uploader.destroy(uploadedPublicId).catch(() => {});
    }

    next(error);
  }
};
