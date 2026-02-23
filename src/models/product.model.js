import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required!"],
    },

    description: {
      type: String,
      required: [true, "Product description is required!"],
    },

    price: {
      type: Number,
      min: [1, "Price must be at least 1 rupees"],
      required: [true, "Product price is required!!"],
    },

    discount: {
      type: Number,
    },

    stock: {
      type: Number,
      min: [1, "Stock must be at least 1"],
      required: [true, "Product stock is required!"],
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Product category is required"],
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "OUT OF STOCK"],
    },

    mainImage: {
      type: String, // image url
      required: [true, "Product main image is required"],
    },

    subImages: {
      type: [String],
      validate: {
        validator: function (arr) {
          return arr.length >= 2 && arr.length <= 4;
        },
        message: "Sub images must be between 2 and 4",
      },
    },
  },
  {
    timestamps: true,
  }
);

productSchema.plugin(mongooseAggregatePaginate);

export const Product = mongoose.model("Product", productSchema);
