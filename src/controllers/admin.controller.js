import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { isValidObjectId } from "mongoose";
import {
  checkExistingProduct,
  getCurrentSubImagesCount,
  uploadProductMedia,
  createNewProduct,
  updateAProduct,
  deleteAProduct,
  uploadProductMainImage,
  UpdateProductMainImage,
  uploadProductSubImages,
  addNewSubImages,
  deleteASubImage,
  findProducts,
  getAProductById,
} from "../services/product.service.js";
import {
  getUserById,
  getUserByPhone,
  logoutAUser,
} from "../services/user.service.js";
import {
  createACategory,
  deleteACategory,
  getCategories,
  getCategoriesCount,
  updateACategory,
} from "../services/category.service.js";
import {
  getAdminOrdersList,
  getOrderById,
  getTotalOrdersCount,
  updateAOrderStatus,
} from "../services/order.service.js";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await getUserById(userId);

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

  const user = await getUserByPhone(phone);

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

  const loggedInAdmin = await getUserById(user, "-password");

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
  await logoutAUser(req?.user._id);

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

// Product Controllers, Optimizing later: DONE 05-04-2026, 2:37PM, LATER CAN TEST
const createProduct = asyncHandler(async (req, res) => {
  /*
    Get data from fronted
    Validate that data, empty or undefined: throw err
    Handles files stores on server, using multer middleware: main image and sub images up to 4
    Then Upload files to cloudinary
    Create new Product with urls of files from cloudinary upload function
    Finnaly Send Response to frontend
    */
  const { product } = req.body;
  const { name, description, categoryId } = req.body.product;

  // need to test
  // const existingProduct = await checkExistingProduct({ name, description });

  // if (existingProduct) {
  //   throw new ApiError(409, "Product already exists");
  // }

  const mainImageLocalPath = req.files.mainImage[0].path;
  const subImagesLocalPath = req.files.subImages;

  const result = await uploadProductMedia(
    mainImageLocalPath,
    subImagesLocalPath
  );

  const newProduct = await createNewProduct({
    ...product,
    mainImage: result?.mainImage,
    subImages: result?.subImages,
    owner: req?.user._id,
    category: categoryId,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, newProduct, "Product created successfully"));
});

const updateProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { product } = req.body;

  if (!isValidObjectId(productId)) {
    throw new ApiError(400, "Invalid Product ID");
  }

  const updatedProduct = await updateAProduct(productId, { $set: product });

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

  const deletedProduct = await deleteAProduct(productId);

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

  if (!mainImageLocalPath)
    throw new ApiError(400, "Product main image is required");

  const mainImageResult = await uploadProductMainImage(mainImageLocalPath);

  const updatedMainImage = await UpdateProductMainImage(
    productId,
    mainImageResult
  );

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

  let product = await getAProductById(productId);

  if (!product) throw new ApiError(404, "Product does not found");

  const currentImagesCount = await getCurrentSubImagesCount(productId);
  const MAX_IMAGES = 4;
  const remainingSlots = MAX_IMAGES - currentImagesCount;

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

  if (subImagesPath.length > remainingSlots)
    throw new ApiError(
      400,
      `You can upload only ${remainingSlots} more sub image(s)`
    );

  const subImageResult = await uploadProductSubImages(subImagesPath);

  const subImages = subImageResult.map((img) => img?.secure_url);

  const addedNewSubImages = await addNewSubImages(productId, subImages);

  return res
    .status(200)
    .json(
      new ApiResponse(200, addedNewSubImages, "Sub images added successfully")
    );
});

const removeASubImage = asyncHandler(async (req, res) => {
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

  let product = await getAProductById(productId);

  if (!product) throw new ApiError(404, "Product does not found");

  if (!product.subImages.includes(url))
    throw new ApiError(400, "Url not found in subImages");

  const leftSubImages = await deleteASubImage(productId, url);

  if (!leftSubImages) throw new ApiError(404, "Invalid product id");

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        leftSubImages,
        removedImage: url,
      },
      "Sub image removed successfully"
    )
  );
});

// Category Controllers
const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name?.trim() || !description?.trim())
    throw new ApiError(400, "name and description are required");

  const newCategory = await createACategory({
    name,
    description,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, newCategory, "Category Created successfully"));
});

const getAllCategories = asyncHandler(async (req, res) => {
  const { search } = req.query;
  console.log("Search from cont: ", search);

  const allCategories = await getCategories(search);

  let totalCategories;
  if (search) {
    totalCategories = allCategories.length;
  } else {
    totalCategories = await getCategoriesCount();
  }

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
  const { category } = req.body;

  const updatedCategory = await updateACategory(categoryId, category);

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedCategory, "Category updated successfully")
    );
});

const deleteCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;

  const products = await findProducts({ category: categoryId });

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

  const deletedCategory = await deleteACategory(categoryId);

  return res
    .status(200)
    .json(
      new ApiResponse(200, deletedCategory, "Category deleted successfully")
    );
});

// 3 Admin controllers left (getOrdersList, getOrdersById, updateOrderStatus), writing later when cart & order controllers are completed: DONE - 05-04-2026, 01:42PM & LATER CAN TEST - TESTING DONE : 06-04-2026, 8:27PM
const getOrdersList = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const { orderStatus } = req.query;

  let orders = await getAdminOrdersList(orderStatus, page, limit);

  let totalOrders;
  if (orderStatus) {
    totalOrders = orders.length;
  } else {
    totalOrders = await getTotalOrdersCount();
  }

  const totalPages = Math.ceil(totalOrders / limit);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        allOrders: orders,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        page: page,
        limit: limit,
        totalOrders,
        totalPages,
      },
      "Orders fetched successfully"
    )
  );
});

const getOrdersById = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  console.log("orderId: ", orderId);
  if (!isValidObjectId(orderId)) throw new ApiError(400, "Invalid order id");

  const order = await getOrderById(orderId);

  console.log("ORDER: ", order);

  if (!order) {
    throw new ApiError(404, "Order not found, Invalid orderId");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, order, "Orders fetched successfully"));
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { orderStatus } = req.body;

  if (!orderStatus) throw new ApiError(400, "Order status is required");

  if (!isValidObjectId(orderId)) {
    throw new ApiError(400, "Invalid order id");
  }

  const order = await getOrderById(orderId);

  if (!order) {
    throw new ApiError(404, "Order not found, Invalid orderId");
  }

  const notAllowedStatuses = ["OUT_FOR_DELIVERY", "DELIVERED"];

  if (notAllowedStatuses.includes(order.orderStatus)) {
    return res
      .status(200)
      .json(
        new ApiResponse(200, null, "Order cannot be updated in current status")
      );
  }

  const updatedOrderStatus = await updateAOrderStatus(orderId, orderStatus);

  if (!updatedOrderStatus) throw new ApiError(404, "Order not found");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { orderStatus: updatedOrderStatus?.orderStatus },
        "Order status changed successfully"
      )
    );
});

// LATER WRITE
const dashboardStats = asyncHandler(async (req, res) => {});

export {
  adminLogin,
  logoutAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
  updateMainImage,
  addNewSubImage,
  removeASubImage,
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
  getOrdersList,
  getOrdersById,
  updateOrderStatus,
  dashboardStats,
};
