import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { isValidObjectId } from "mongoose";
import {
  getTotalProductsCount,
  productFilter,
  listAllProducts,
  getAProductById,
} from "../services/product.service.js";

const getAllProducts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const { category, minPrice, maxPrice, brand, search, sort } = req.query;

  const { filter, haveSort, sortOption } = productFilter(
    category,
    minPrice,
    maxPrice,
    brand,
    search,
    sort
  );

  let allProducts = await listAllProducts(
    page,
    limit,
    filter,
    haveSort,
    sortOption
  );

  let totalProducts;
  if (
    filter?.category ||
    filter?.$or ||
    filter?.brand ||
    filter?.price?.$gte ||
    filter?.price?.$lte
  ) {
    totalProducts = allProducts.length;
  } else {
    totalProducts = await getTotalProductsCount();
  }

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
      "Products fetch successfully"
    )
  );
});

const getProductById = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!isValidObjectId(productId))
    throw new ApiError(400, "Invalid product id");

  const product = await getAProductById(productId);

  return res
    .status(200)
    .json(new ApiResponse(200, product, "Product fetched successfully"));
});

export { getAllProducts, getProductById };
