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

    subTotal: {
      type: Number,
    },

    cartItems: {
      type: [cartItemSchema],
      required: [true, "cartItem is required"],
    },

    discountAmount: {
      type: Number,
    },

    discountedTotal: {
      type: Number,
    },

    taxAmount: {
      type: Number,
      default: 0,
    },

    shippingCharges: {
      type: Number,
      default: 0,
    },

    deliveryCharges: {
      type: Number,
      default: 0,
    },

    finalTotal: {
      type: Number,
    },

    coupon: {
      type: String,
    },

    appliedCoupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      default: null,
    },
  },
  { timestamps: true }
);

export const Cart = mongoose.model("Cart", cartSchema);
