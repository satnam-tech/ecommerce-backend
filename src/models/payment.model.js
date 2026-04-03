import mongoose, { Schema } from "mongoose";

const paymentSchema = new Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "Payment order id required"],
    },

    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
    },

    method: {
      type: String,
      enum: ["UPI", "CARD"],
    //   required: [true, "Payment method is required"],
    },

    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
    },

    transactionId: {
      type: String,
      default: null,
    },

    razorpayOrderId: {
      type: String,
    },

    attemptNumber: {
      type: Number,
      required: true,
    },

    failureReason: {
      type: String,
    },
  },
  { timestamps: true }
);

export const Payment = mongoose.model("Payment", paymentSchema);
