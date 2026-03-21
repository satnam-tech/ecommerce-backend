import { asyncHandler } from "../utils/asyncHandler.js";
import { Product } from "../models/product.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { isValidObjectId } from "mongoose";

const getAllProducts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const { category, minPrice, maxPrice, brand, search, sort } = req.query;

  let filter = {};

  if (category) {
    if (!isValidObjectId(category))
      throw new ApiError(400, "Invalid category Id");
    filter.category = category;
  }

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  if (brand) {
    filter.brand = brand;
  }

  // if (search?.trim()) {
  //   const keyword = search.trim();
  //   filter.name = { $regex: keyword, $options: "i" }
  // }

  // seraching on both
  if (search?.trim()) {
    const keyword = search.trim();
    filter.$or = [
      { name: { $regex: keyword, $options: "i" } },
      { description: { $regex: keyword, $options: "i" } },
    ];
  }

  console.log("FILTERS: ", filter);

  let query = Product.find(filter);

  let sortOption = {};

  switch (req.query.sort) {
    case "price_asc":
      sortOption.price = 1;
      break;
    case "price_desc":
      sortOption.price = -1;
      break;
    case "newest":
      sortOption.createdAt = -1;
      break;
    case "rating":
      sortOption.rating = -1;
      break;
    default:
      sortOption.createdAt = -1;
  }

  // Sorting
  if (sort) {
    query = query.sort(sortOption);
  }

  query = query.skip((page - 1) * limit).limit(limit);

  const allProducts = await query;
  // const allProducts = await Product.find()

  console.log("PRODUCTS: ", allProducts);

  let totalProducts;
  if (
    filter?.category ||
    filter?.$or ||
    filter?.brand ||
    filter.price?.$gte ||
    filter.price?.$lte
  ) {
    totalProducts = allProducts.length;
  } else {
    totalProducts = await Product.countDocuments();
  }

  console.log("Total Products: ", totalProducts);

  const totalPages = Math.ceil(totalProducts / limit);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        allProducts,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        page: page,
        limit: limit,
        totalProducts,
        totalPages,
      },
      "Products Fetch successfully"
    )
  );
});

const getProductById = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!isValidObjectId(productId))
    throw new ApiError(400, "Invalid product id");

  const product = await Product.findById(productId);

  if (!product)
    throw new ApiError(404, "No Product found with the provided ID.");

  res
    .status(200)
    .json(new ApiResponse(200, product, "Product fetched successfully"));
});

const getCurrentSubImagesCount = async (productId) => {
  const subImages = await Product.findById(productId).select("subImages");
  return subImages.subImages.length;
};

export { getAllProducts, getProductById, getCurrentSubImagesCount };
