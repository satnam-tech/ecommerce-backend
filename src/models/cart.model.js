import mongoose, { Schema } from "mongoose";

const cartItemSchema = new Schema(
  {
    _id: false, // Stop generating nested document id

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
    },

    quantity: {
      type: Number,
      required: [true, "Product quantity is required"],
    },
  },
  { timestamps: true }
);

const cartSchema = new Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    cartTotal: {
      type: Number,
    },

    cartItems: {
      type: [cartItemSchema],
      required: [true, "cartItem is required"],
    },
  },
  { timestamps: true }
);

export const Cart = mongoose.model("Cart", cartSchema);
