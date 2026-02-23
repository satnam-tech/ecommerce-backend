import cloudinary from "../config/cloudinary.js";
import fs from "fs";

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // file has been uploaded successfully
    console.log("file is uploaded on cloudinary ", response.url);
    return response;
    
  } catch (error) {
    if (localFilePath) fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload operation got failed
    throw error; 
  }
};

export {uploadOnCloudinary}
