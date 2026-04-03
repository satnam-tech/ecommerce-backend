import razorpayInstance from "../config/razorpay.js";
import { ApiError } from "../utils/ApiError.js";
import crypto from "node:crypto";

export const createRazorpayOrder = async (amount, receipt) => {
  const options = {
    amount: amount * 100,
    currency: "INR",
    receipt,
  };

  try {
    const order = await razorpayInstance.orders.create(options);
    return order;
  } catch (error) {
    console.log(error);
    console.error("Sending Otp failed, Error:", error.message);

    throw new ApiError(
      error.status || 500,
      error.message || "Creating Razorpay Order failed"
    );
  }
};

export const verifyPaymentSignature = (
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature
) => {
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return false;
  }
  const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

  try {
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", razorpaySecret)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) return false;

    return true;
  } catch (error) {
    console.log(error);
    console.error("Verify payment signature Error:", error.message);

    throw new ApiError(
      error.status || 500,
      error.message || "Verify payment signature failed"
    );
  }
};

export const fetchPaymentId = async (paymentId) => {
  try {
    const payment = await razorpayInstance.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    throw new ApiError(
      error.status || 500,
      error.message || "Failed to fetch payment detials"
    );
  }
};
