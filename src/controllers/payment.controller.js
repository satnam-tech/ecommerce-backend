import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { verifyPaymentSignature } from "../services/payment.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { findAOrder, verifyUserPayment } from "../services/order.service.js";

// Later: Set payment method in model in which method payment complete
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

  const order = await findAOrder(order_id);

  if (!order) throw new ApiError(404, "Order not found");

  const verify = await verifyPaymentSignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  );

  console.log("VERIFY: ", verify);
  const { confirmedOrder, failedMsg } = await verifyUserPayment(
    verify,
    order_id,
    razorpay_payment_id,
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
});

// later test when site is Live
// const razorpayWebhookHandler = asyncHandler(async (req, res) => {
//   const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

//   try {
//     const isValid = validateWebhookSignature(
//       req.body, // raw body (IMPORTANT)
//       req.headers["x-razorpay-signature"],
//       secret
//     );

//     if (!isValid) {
//       return res.status(400).json({ message: "Invalid signature" });
//     }

//     const event = JSON.parse(req.body.toString());

//     const paymentEntity = event.payload.payment.entity;
//     const orderId = paymentEntity.order_id;

//     // 🔥 Handle events
//     switch (event.event) {
//       case "payment.captured":
//         await Payment.findOneAndUpdate(
//           {
//             orderId: orderId,
//             status: { $ne: "SUCCESS" }, // 👈 prevent duplicate overwrite
//           },

//           {
//             $set: {
//               status: "SUCCESS",
//             },
//           }
//         );

//         Order.findOneAndUpdate(
//           {
//             _id: orderId,
//             orderStatus: { $ne: "CONFIRMED" }, // 👈 prevent duplicate overwrite
//             paymentStatus: { $ne: "PAID" }, // 👈 prevent duplicate overwrite
//           },
//           {
//             $set: {
//               orderStatus: "CONFIRMED",
//               paymentStatus: "PAID",
//             },
//           },
//           {
//             sort: { attemptNumber: -1 },
//             returnDocument: "after",
//             projection: { orderStatus: 1, paymentStatus: 1 },
//             // new: true,
//           }
//         );
//         break;

//       case "payment.failed":
//         await Payment.findOneAndUpdate(
//           { OrderId: orderId },
//           {
//             $set: {
//               status: "FAILED",
//               failureReason: paymentEntity.error_description,
//             },
//           },
//           { new: true }
//         );

//         await Order.findOneAndUpdate(
//           { _id: orderId },
//           {
//             $set: {
//               paymentStatus: "FAILED",
//             },
//           },
//           {
//             sort: { attemptNumber: -1 },
//           }
//         );
//         break;

//       default:
//         console.log("Unhandled event:", event.event);
//     }

//     return res.status(200).json({ status: "ok" });
//   } catch (error) {
//     console.error("Webhook Error:", error);
//     return res.status(500).json({ message: "Server error" });
//   }
// });
export { verifyPayment };
