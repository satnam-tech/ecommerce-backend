import { Category } from "../models/category.model";
import { Product } from "../models/product.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name.trim() || !description.trim())
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
      {
        count: products.length,
        products,
      },
      "Cannot delete category. It is assigned to existing products."
    );
  }

  const deletedCategory = await Category.findByIdAndDelete(categoryId);

  return res
    .status(200)
    .josn(
      new ApiResponse(200, deletedCategory, "Category deleted successfully")
    );
});


export { createCategory, getAllCategories, updateCategory, deleteCategory };
