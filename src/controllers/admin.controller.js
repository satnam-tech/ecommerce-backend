import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../services/cloudinary.service.js";
import { Product } from "../models/product.model.js";
import { Category } from "../models/category.model.js";
import { User } from "../models/user.model.js";
import { isValidObjectId } from "mongoose";
import { getCurrentSubImagesCount } from "./product.controller.js";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) throw new ApiError(404, "User not found");

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.log("ERROR WHILE GENERATING TOKENS: ", error);
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

const adminLogin = asyncHandler(async (req, res) => {
  const { phone, password } = req.body;

  if (!phone && !password)
    throw new ApiError(400, "phone and password are required");

  const user = await User.findOne({ phone });

  if (!user) throw new ApiError(404, "User does not exists");

  if (user?.isVerified !== true)
    throw new ApiError(
      401,
      "unauthorized request, user not verified, login with otp"
    );

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) throw new ApiError(401, "Invalid user credentials");

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInAdmin = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInAdmin,
          accessToken,
          refreshToken,
        },
        "Admin logged In Successfully"
      )
    );
});

const logoutAdmin = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,

    {
      $unset: {
        refreshToken: 1, // removes the field from document
      },
    },

    {
      returnDocument: "after",
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "Admin logged out successfully"));
});

// Product Controllers, Optimizing later
const createProduct = asyncHandler(async (req, res) => {
  /*
    Get data from fronted
    Validate that data, empty or undefined: throw err
    Handles files stores on server, using multer middleware: main image and sub images up to 4
    Then Upload files to cloudinary
    Create new Product with urls of files from cloudinary upload function
    Finnaly Send Response to frontend
    */

  if (!req.body) {
    throw new ApiError(400, "Request body is missing");
  }
  const { product } = req.body;

  if (!product) throw new ApiError(400, "Product data is required");

  const { name, description, price, brand, stock, categoryId } = product;
  const requiredFields = [
    "name",
    "description",
    "price",
    "brand",
    "stock",
    "categoryId",
  ];

  for (const field of requiredFields) {
    if (product[field] === undefined)
      throw new ApiError(400, "All fileds required");
  }

  if (
    [name, description, price, stock, brand, categoryId].some(
      (field) => field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "fields cannot be empty");
  }

  // need to test
  const existingProduct = await Product.findOne({
    name,
    description,
  });

  if (existingProduct) {
    throw new ApiError(409, "Product already exists");
  }

  console.log(req.files);

  let mainImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.mainImage) &&
    req.files.mainImage.length > 0
  ) {
    mainImageLocalPath = req.files.mainImage[0].path;
  } else {
    throw new ApiError(400, "Product main image is required");
  }

  const subImagesPath = req.files?.subImages || [];

  if (subImagesPath.length < 2) {
    throw new ApiError(400, "At least 2 sub images are required");
  }

  let subImagesLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.subImages) &&
    req.files.subImages.length > 0
  ) {
    subImagesLocalPath = req.files.subImages;
  }

  const mainImageResult = await uploadOnCloudinary(mainImageLocalPath);

  let subImageResult;
  if (subImagesLocalPath) {
    subImageResult = await Promise.all(
      subImagesLocalPath.map((img) => uploadOnCloudinary(img.path))
    );
  }

  const subImages = Array.isArray(subImageResult)
    ? subImageResult.map((img) => img?.secure_url)
    : [];

  // console.log("SUB IMAGES URLS: ", subImages);

  const newProduct = await Product.create({
    ...product,
    mainImage: mainImageResult?.url,
    subImages,
    owner: req?.user._id,
    category: categoryId,

    // $set: {
    //   discount:
    // }
  });

  return res
    .status(201)
    .json(new ApiResponse(201, newProduct, "Product created successfully"));
});

const updateProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  // Validate body
  if (!req.body) {
    throw new ApiError(400, "Request body is missing");
  }

  const { product } = req.body;

  if (!isValidObjectId(productId)) {
    throw new ApiError(400, "Invalid Product ID");
  }

  // Validate product field
  if (!product) {
    throw new ApiError(400, "Product data is required");
  }

  const { name, description, price, brand, stock, categoryId } = product;

  console.log(product);

  // Later validate data using joe or express validator

  Object.keys(product).forEach((key) => {
    if (product[key] === undefined || product[key].trim() === "") {
      delete product[key];
    }
  });

  console.log("AFTER FILTERING: ", product);
  // console.log("AFTER FILTERING: ", product.length);

  if (!Object.keys(product).length > 0)
    throw new ApiError(400, "Product data is required");

  const updatedProduct = await Product.findByIdAndUpdate(
    productId,
    { $set: product },
    { returnDocument: "after", runValidators: true }
  );

  if (!updatedProduct)
    throw new ApiError(404, "No Product found with the provided ID.");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedProduct, "Product updated successfully"));
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!isValidObjectId(productId))
    throw new ApiError(400, "Invalid product id");

  const deletedProduct = await Product.findByIdAndDelete(productId, {
    returnDocument: "after",
  });

  console.log("DELETED PRODUCT: ", deletedProduct);

  if (!deletedProduct)
    throw new ApiError(404, "No Product found with the provided ID.");

  return res
    .status(200)
    .json(new ApiResponse(200, deletedProduct, "Product deleted successfully"));
});

const updateMainImage = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!isValidObjectId(productId))
    throw new ApiError(400, "Invalid product id");

  const mainImageLocalPath = req.files?.mainImage[0]?.path;

  console.log("MAIN IMAGE: ", mainImageLocalPath);

  if (!mainImageLocalPath)
    throw new ApiError(400, "Product main image is required");

  const mainImageResult = await uploadOnCloudinary(mainImageLocalPath);

  console.log(mainImageResult?.url);
  console.log(mainImageResult?.secure_url);
  console.log(mainImageResult);

  const updatedMainImage = await Product.findByIdAndUpdate(productId, {
    $set: {
      mainImage: mainImageResult?.secure_url,
    },
  }).select("name description mainImage");

  if (!updatedMainImage)
    throw new ApiError(400, "No Product found with the provided ID.");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedMainImage,
        "Product Main Image updated successfully"
      )
    );
});

const addNewSubImage = asyncHandler(async (req, res) => {
  // user can add newSubImage
  // check subImage from req.files
  // Add Image, if user adds With Checking: subImages array have an space for new Image or Not, ONLY (4 TOTAL URLS Stores)
  // Before adding image we have to check have space for new Image or not, beacuse subImages only stores 4 url images only because we define in SCHEMA
  // Finnaly Send Response
  const { productId } = req.params;

  if (!isValidObjectId(productId))
    throw new ApiError(400, "Invalid product id");

  if (!productId) throw new ApiError(400, "Product Id is required");

  let product = await Product.findById(productId);

  if (!product) throw new ApiError(404, "Product does not found");

  const currentImagesCount = await getCurrentSubImagesCount(productId);
  const MAX_IMAGES = 4;
  const remainingSlots = MAX_IMAGES - currentImagesCount;

  console.log("CURRENT IMAGE COUNT: ", currentImagesCount);
  console.log("REMAINING SLOTS: ", remainingSlots);

  if (remainingSlots <= 0)
    throw new ApiError(400, "Maximum 4 sub-images already uploaded");

  let subImagesPath;
  if (
    req.files &&
    Array.isArray(req.files.subImages) &&
    req.files.subImages.length > 0
  ) {
    subImagesPath = req.files.subImages;
  } else {
    throw new ApiError(400, "SubImages are required");
  }

  console.log("SUB IMAGES: ", subImagesPath);
  console.log("SUB IMAGES LENGTH: ", subImagesPath.length);

  if (subImagesPath.length > remainingSlots)
    throw new ApiError(
      400,
      `You can upload only ${remainingSlots} more sub image(s)`
    );

  // const subImagesResult = await Promise.allSettled(
  //   subImagesPath.map((img) => uploadOnCloudinary(img.path))
  // );

  const uploads = await Promise.all(
    subImagesPath.map((img) => uploadOnCloudinary(img.path))
  );

  console.log("Upload full result: ", uploads);

  const subImages = uploads.map((img) => img?.secure_url);

  console.log("Uploaded SubImages Url: ", subImages);

  // alternative better performance if use $push operartor
  const addedNewSubImages = await Product.findByIdAndUpdate(
    productId,
    {
      $push: {
        subImages,
      },
    },
    { returnDocument: "after", runValidators: true }
  ).select("name description subImages");

  return res
    .status(200)
    .json(
      new ApiResponse(200, addedNewSubImages, "Sub images added successfully")
    );
});

const deleteSubImage = asyncHandler(async (req, res) => {
  // user can delete subImage
  // get url of this image
  // Remove sub image from given url form body
  // Finnaly Send Response

  // Validate body
  if (!req.body) {
    throw new ApiError(400, "Request body is missing");
  }

  const { productId } = req.params;
  const { url } = req.body;

  if (!isValidObjectId(productId)) throw new ApiError(400, "Invalid object id");

  if (!url) throw new ApiError(400, "Sub Image Url is required");

  let product = await Product.findById(productId);

  if (!product) throw new ApiError(404, "Product does not found");

  if (!product.subImages.includes(url))
    throw new ApiError(400, "Url not found in subImages");

  const leftSubImages = await Product.findByIdAndUpdate(
    productId,
    {
      $pull: {
        subImages: url,
      },
    },
    { returnDocument: "after", runValidators: true }
  ).select("name description subImages");

  if (!removedSubImage) throw new ApiError(404, "Invalid product id");

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        leftSubImages,
        removedUrl: url,
      },
      "Sub image removed successfully"
    )
  );
});

// Category Controllers
const createCategory = asyncHandler(async (req, res) => {
  if (!req.body) {
    throw new ApiError(400, "Request body is missing");
  }

  const { name, description } = req.body;

  if (!name?.trim() || !description?.trim())
    throw new ApiError(400, "name and description are required");

  const newCategory = await Category.create({
    name,
    description,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, newCategory, "Category Created successfully"));
});

const getAllCategories = asyncHandler(async (req, res) => {
  const { search } = req.query;
  let filter = {};

  if (search?.trim()) {
    const keyword = search.trim();
    filter.$or = [
      { name: { $regex: keyword, $options: "i" } },
      { description: { $regex: keyword, $options: "i" } },
    ];
  }

  const query = Category.find(filter).sort({ createdAt: -1 });

  const allCategories = await query;

  const totalCategories = await Category.countDocuments();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        allCategories,
        totalCategories,
      },
      "Categories fetched successfully"
    )
  );
});

const updateCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;

  if (!req.body) {
    throw new ApiError(400, "Request body is missing");
  }

  const { name, description } = req.body;

  const updateData = {
    name,
    description,
  };

  if (!(name && description)) {
    throw new ApiError(400, "One of Field is must!");
  }

  Object.keys(updateData).forEach((key) => {
    if (updateData[key] === undefined) delete updateData[key];
  });

  const updatedCategory = await Category.findByIdAndUpdate(
    categoryId,
    {
      $set: updateData,
    },
    { returnDocument: "after", runValidators: true }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedCategory, "Category updated successfully")
    );
});

const deleteCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;

  const products = await Product.find({ category: categoryId });

  if (products.length > 0) {
    throw new ApiError(
      400,
      "Cannot delete category. It is assigned to existing products.",
      {
        count: products.length,
        products,
      }
    );
  }

  const deletedCategory = await Category.findByIdAndDelete(categoryId, {
    returnDocument: "after",
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, deletedCategory, "Category deleted successfully")
    );
});

// 3 Admin controllers left (getOrdersList, getOrdersById, updateOrderStatus), writing later when cart & order controllers are completed

export {
  adminLogin,
  logoutAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
  updateMainImage,
  addNewSubImage,
  deleteSubImage,
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
};
