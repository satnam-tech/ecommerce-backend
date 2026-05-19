import cloudinary from "../config/cloudinary.js";
import fs from "fs/promises";

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // file has been uploaded successfully
    console.log("file is uploaded on cloudinary ", response.url);

    // Non-blocking delete
    fs.unlink(localFilePath)
      .catch((err) => console.error("Unlink error:", err));

    return response;
  } catch (error) {
    // also cleanup if upload fails

    // Non-blocking delete
    fs.unlink(localFilePath)
      .catch((err) => console.error("Unlink error:", err));
    return null;
  }
};

export { uploadOnCloudinary };
