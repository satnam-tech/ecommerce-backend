import razorpayInstance from "../config/razorpay.js";
import { ApiError } from "../utils/ApiError";
import { validateWebhookSignature } from "razorpay/dist/utils/razorpay-utils.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createOrder = asyncHandler(async ({ amount, receipt }) => {
  const options = {
    amount: amount * 100,
    currency: "INR",
    receipt,
  };

  const order = await razorpayInstance.orders.create(options);
  return order;
});

const verifyPaymentSignature = ({
  razorpay_order_id,
  payment_order_id,
  razorpay_signature,
}) => {
  const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
  try {
    const body = razorpay_order_id + "|" + razorpay_order_id;

    const expectedSignature = validateWebhookSignature(
      body,
      razorpay_signature,
      razorpaySecret
    );

    if (expectedSignature !== razorpay_signature) {
      throw new ApiError(400, "Payment verification failed!");
    }

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

const fetchPaymentId = async (paymentId) => {
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

// const refundPaymentId = async (data) => {}
