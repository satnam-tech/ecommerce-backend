import mongoose, { Schema } from "mongoose";

const orderItemSchema = new Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },

    quantity: {
      type: Number,
      required: [true, "Order item quantity is required"],
    },

    priceAtPurchase: {
      type: Number,
      // required: [true, "Order item priceAtPurchase is required"],
    },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    orderPrice: {
      type: Number,
      required: [true, "Order price is required"],
    },

    orderItems: {
      type: [orderItemSchema],
      required: [true, "Order items is required"],
    },

    address: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
      // required: [true, "Order address is required"],
      default: null,
    },

    addressSnapshot: {
      fullName: { type: String },
      phone: { type: Number },
      addressLine1: { type: String },
      addressLine2: { type: String },
      city: { type: String },
      country: { type: String },
      state: { type: String },
      pincode: { type: String },
      // required: [true, "Order address snapshot is required"],

      default: {},
    },

    subTotal: {
      type: Number,
      default: 0,
    },

    discountAmount: {
      type: Number,
      default: 0,
    },

    discountedTotal: {
      type: Number,
      default: 0,
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

    orderStatus: {
      type: String,
      enum: [
        "DRAFT",
        "PENDING_PAYMENT",
        "CONFIRMED",
        "PROCESSING",
        "SHIPPED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
      ],

      required: [true, "Order status is required"],
    },

    paymentMethod: {
      type: String,
      enum: ["COD", "ONLINE"],
    },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
    },

    paymentProvider: {
      type: String,
    },

    gatewayOrderId: {
      type: String,
    },
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);
