import mongoose, { Schema } from "mongoose";

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      unique: true,
      index: true
    },

    description: {
      type: String,
      required: [true, "Category description is required"],
      index: true
    },
  },
  { timestamps: true }
);


export const Category = mongoose.model("Category", categorySchema);
