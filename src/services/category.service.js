import { Category } from "../models/category.model.js";
import { ApiError } from "../utils/ApiError.js";

export async function createACategory(categoryPayload) {
  try {
    const category = await Category.create(categoryPayload);

    return category;
  } catch (error) {
    console.log("Create Category failed: ", error);
    throw new ApiError(500, "Something went wrong while Creating the Category");
  }
}

export async function getCategories(search) {
  console.log("Search from fn: ", search);
  try {
    let filter = {};

    if (search?.trim()) {
      const keyword = search.trim();
      filter.$or = [
        { name: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
      ];
    }

    console.log("Filter: ", filter);

    const query = Category.find(filter).sort({ createdAt: -1 });

    const allCategories = await query;

    return allCategories;
  } catch (error) {
    console.log("Get All Categories failed: ", error);
    throw new ApiError(
      500,
      "Something went wrong while Getting all Categories"
    );
  }
}

export async function getCategoriesCount() {
  const totalCategories = await Category.countDocuments();

  return totalCategories;
}

export async function updateACategory(categoryId, updateData) {
  const updatedCategory = await Category.findByIdAndUpdate(
    categoryId,
    {
      $set: updateData,
    },

    { returnDocument: "after", runValidators: true }
  );
  return updatedCategory;
}

export async function deleteACategory(categoryId) {
  const deletedCategory = await Category.findByIdAndDelete(categoryId, {
    returnDocument: "after",
  });

  return deletedCategory;
}
