import mongoose, { Schema } from "mongoose";

const orderItemSchema = new Schema({
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
}, {_id: false});

const orderSchema = new Schema({
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
    default: null
  },

  addressSnapshot: {
      fullName: { type: String },
      phone: { type: Number},
      addressLine1: { type: String},
      city: { type: String },
      state: { type: String},
      pincode: { type: String},
    // required: [true, "Order address snapshot is required"],

    default: {},
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

  gatewayKey: {
    type: String,
  },
});

export const Order = mongoose.model("Order", orderSchema);
