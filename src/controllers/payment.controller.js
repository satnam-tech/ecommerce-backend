import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Order } from "../models/order.model.js";
import { Payment } from "../models/payment.model.js";
import { verifyPaymentSignature } from "../services/payment.service.js";
import { validateWebhookSignature } from "razorpay/dist/utils/razorpay-utils.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const verifyPayment = asyncHandler(async (req, res) => {
  const {
    order_id,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;

  console.log({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  });

  // if (status === "failed") {
  //   await Payment.findOneAndUpdate(
  //     { orderId: order._id },
  //     {
  //       $set: {
  //         status: "FAILED",
  //         // failureReason: from error
  //       },
  //     },
  //     {
  //       sort: { attemptNumber: -1 },
  //     }
  //   );

  //   await Order.findOneAndUpdate(
  //     { orderId: order._id },
  //     {
  //       $set: {
  //         paymentStatus: "FAILED",
  //       },
  //     },
  //     {
  //       sort: { attemptNumber: -1 },
  //     }
  //   );

  //   return res
  //     .status(400)
  //     .json(new ApiResponse(400, null, "Payment failed recorded"));
  // }

  const order = await Order.findOne({ _id: order_id });

  if (!order) throw new ApiError(404, "Order not found");

  const verify = await verifyPaymentSignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  );

  console.log("VERIFY: ", verify);
  let failedMsg;

  if (!verify) {
    await Payment.findOneAndUpdate(
      { orderId: order._id },
      {
        $set: {
          status: "FAILED",
          // failureReason: from error
        },
      },
      {
        sort: { attemptNumber: -1 },
      }
    );

    await Order.findOneAndUpdate(
      { _id: order._id },
      {
        $set: {
          paymentStatus: "FAILED",
        },
      },
      {
        sort: { attemptNumber: -1 },
      }
    );

    failedMsg = "Invalid payment signature, Payment failed recorded";
  } else {
    // signature verified
    await Payment.findOneAndUpdate(
      {
        orderId: order._id,
        status: { $in: ["PENDING", "FAILED"] }, // 👈 allow update only in these states
      },
      {
        $set: {
          status: "SUCCESS",
          transactionId: razorpay_payment_id,
        },

        sort: { attemptNumber: -1 },
      }
    );

    const confirmedOrder = await Order.findOneAndUpdate(
      { _id: order._id },
      {
        $set: {
          orderStatus: "CONFIRMED",
          paymentStatus: "PAID",
        },
      },
      {
        sort: { attemptNumber: -1 },
        returnDocument: "after",
        projection: { orderStatus: 1, paymentStatus: 1 },
        // new: true,
      }
    );

    return res.status(failedMsg ? 400 : 200).json(
      new ApiResponse(
        failedMsg ? 400 : 200,

        failedMsg
          ? { status: "False" }
          : {
              confirmedOrder,
              status: "ok",
              transactionId: razorpay_payment_id,
            },

        failedMsg ? failedMsg : "Payment done successfully"
      )
    );
  }
});

const razorpayWebhookHandler = asyncHandler(async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  try {
    const isValid = validateWebhookSignature(
      req.body, // raw body (IMPORTANT)
      req.headers["x-razorpay-signature"],
      secret
    );

    if (!isValid) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    const event = JSON.parse(req.body.toString());

    const paymentEntity = event.payload.payment.entity;
    const orderId = paymentEntity.order_id;

    // 🔥 Handle events
    switch (event.event) {
      case "payment.captured":
        await Payment.findOneAndUpdate(
          {
            orderId: orderId,
            status: { $ne: "SUCCESS" }, // 👈 prevent duplicate overwrite
          },

          {
            $set: {
              status: "SUCCESS",
            },
          }
        );

        Order.findOneAndUpdate(
          {
            _id: orderId,
            orderStatus: { $ne: "CONFIRMED" }, // 👈 prevent duplicate overwrite
            paymentStatus: { $ne: "PAID" }, // 👈 prevent duplicate overwrite
          },
          {
            $set: {
              orderStatus: "CONFIRMED",
              paymentStatus: "PAID",
            },
          },
          {
            sort: { attemptNumber: -1 },
            returnDocument: "after",
            projection: { orderStatus: 1, paymentStatus: 1 },
            // new: true,
          }
        );
        break;

      case "payment.failed":
        await Payment.findOneAndUpdate(
          { OrderId: orderId },
          {
            $set: {
              status: "FAILED",
              failureReason: paymentEntity.error_description,
            },
          },
          { new: true }
        );

        await Order.findOneAndUpdate(
          { _id: orderId },
          {
            $set: {
              paymentStatus: "FAILED",
            },
          },
          {
            sort: { attemptNumber: -1 },
          }
        );
        break;

      default:
        console.log("Unhandled event:", event.event);
    }

    return res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("Webhook Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});
export { verifyPayment, razorpayWebhookHandler };
