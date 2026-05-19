import { Address } from "../models/address.model.js";
import { Order } from "../models/order.model.js";
import { Payment } from "../models/payment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { createRazorpayOrder } from "./payment.service.js";
import { getAProductById } from "./product.service.js";
import mongoose from "mongoose";

export async function getAllUserOrders(userId, page, limit) {
  try {
    const orders = await Order.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(userId),
        },
      },

      {
        $addFields: {
          totalOrderItems: {
            $size: "$orderItems",
          },
        },
      },

      {
        $project: {
          gatewayOrderId: 0,
          paymentProvider: 0,
        },
      },

      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },

      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner_details",

          pipeline: [
            {
              $project: {
                fullName: 1,
                phone: 1,
              },
            },
          ],
        },
      },

      {
        $addFields: {
          owner_details: { $first: "$owner_details" },
        },
      },

      {
        $lookup: {
          from: "products",
          localField: "orderItems.product",
          foreignField: "_id",
          as: "product_details",
          pipeline: [
            {
              $project: {
                name: 1,
                description: 1,
                price: 1,
                mainImage: 1,
              },
            },
          ],
        },
      },

      {
        $addFields: {
          product_details: { $first: "$product_details" },
        },
      },
    ]);

    return orders;
    // const orders = await Order.find({ owner: userId })
    //   .skip((page - 1) * limit)
    //   .limit(limit)
    //   .populate("owner", "fullName phone")
    //   .populate({
    //     path: "orderItems.product",
    //     select: "name description price mainImage",
    //   })
    //   .select("-gatewayOrderId -paymentProvider");

    // // adding totalOrderItemsCount in order document
    // const orderWithOrderItemsCount = await Promise.all(
    //   orders.map((order) => {
    //     const obj = order.toObject();

    //     return {
    //       ...obj,
    //       totalOrderItems: obj.orderItems.length,
    //     };
    //   })
    // );
  } catch (error) {
    console.log("Get User Orders failed: ", error);
    throw new ApiError(
      500,
      "Something went wrong while Fetching the user orders"
    );
  }
}

export async function getAdminOrdersList(orderStatus, page, limit) {
  try {
    let matchStage = {};

    if (orderStatus) {
      matchStage.orderStatus = orderStatus;
    }

    let orders = Order.aggregate([
      { $match: matchStage },
      { $sort: { createdAt: -1 } },

      { $skip: (page - 1) * limit },
      { $limit: limit },

      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner_details",

          pipeline: [
            {
              $project: {
                fullName: 1,
                phone: 1,
              },
            },
          ],
        },
      },

      {
        $addFields: {
          owner_details: { $first: "$owner_details" },
        },
      },
      {
        $lookup: {
          from: "payments",
          localField: "_id",
          foreignField: "orderId",
          as: "payment_details",

          pipeline: [
            {
              $project: {
                amount: 0,
                razorpayOrderId: 0,
              },
            },
          ],
        },
      },

      {
        $addFields: {
          payment_details: { $first: "$payment_details" },
        },
      },
    ]);

    // query = query
    //   .skip((page - 1) * limit)
    //   .limit(limit)
    //   .populate("owner", "fullName phone");

    // const allOrders = await query;

    // const allOrdersWithPayment = await Promise.all(
    //   allOrders.map(async (order) => {
    //     const paymentDetails = await Payment.find({ orderId: order.id }).select(
    //       "-amount -razorpayOrderId"
    //     );

    //     const obj = order.toObject();

    //     return {
    //       ...obj,
    //       paymentDetails,
    //     };
    //   })
    // );

    return orders;
  } catch (error) {
    console.log("Get Admin Orders List failed: ", error);
    throw new ApiError(
      500,
      "Something went wrong while Fetching the Admin Orders List"
    );
  }
}

export async function getOrderById(orderId) {
  console.log("orderId: ", orderId);
  try {
    const order = await Order.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(orderId) } },
      {
        $lookup: {
          from: "products",
          localField: "orderItems.product",
          foreignField: "_id",
          as: "product_details",
        },
      },
      {
        $addFields: {
          product_details: { $first: "$product_details" },
        },
      },

      {
        $lookup: {
          from: "payments",
          localField: "_id",
          foreignField: "orderId",
          as: "payment_details",
        },
      },
      {
        $addFields: {
          payment_details: { $first: "$payment_details" },
        },
      },
    ]);

    console.log("ORDER (fn): ", order);
    return order[0];

    // const order = await Order.findOne({ _id: orderId }).populate({
    //   path: "orderItems.product",
    //   select: "name description price mainImage",
    // });

    // if (!order) return null;

    // const paymentDetails = await Payment.findOne({ orderId: order._id });

    // const orderWithPaymentDetails = {
    //   ...order.toObject(),
    //   paymentDetails,
    // };

    // return orderWithPaymentDetails;
  } catch (error) {
    console.log("Get Order by id failed: ", error);
    throw new ApiError(
      500,
      "Something went wrong while Fetching the OrderById"
    );
  }
}

export async function findAOrder(orderId, populateOptions = []) {
  let query = Order.findOne({ _id: orderId });

  if (populateOptions.length > 0) {
    query = query.populate(populateOptions);
  }

  const order = await query;

  return order;
}

export async function updateAOrderStatus(orderId, orderStatus) {
  try {
    const order = await Order.findById(orderId);

    const updatedOrderStatus = await Order.findByIdAndUpdate(
      {
        _id: orderId,
      },
      {
        $set: {
          orderStatus: orderStatus,
        },
      },
      { returnDocument: "after" }
    );

    return updatedOrderStatus;
  } catch (error) {
    console.log("Update Order status failed: ", error);
    throw new ApiError(
      500,
      "Something went wrong while Updating the Order Status"
    );
  }
}

export async function getTotalOrdersCount(userId) {
  let totalOrders;
  if (userId) {
    totalOrders = await Order.countDocuments({
      owner: userId,
    });
  } else {
    totalOrders = await Order.countDocuments();
  }

  return totalOrders;
}

export async function createAOrder(cart, orderItems, userId) {
  if (!orderItems || orderItems.length < 1) {
    throw new ApiError(400, "No items provided");
  }

  try {
    let totalPrice = 0;
    const processedItems = [];

    // Validate + prepare items
    for (const item of orderItems) {
      const product = await getAProductById(item.product);

      if (!product) {
        throw new ApiError(404, "Product not found");
      }

      if (product.stock < item.quantity) {
        throw new ApiError(400, "Insufficient stock");
      }

      if (product.price < 1) {
        throw new ApiError(400, "Invalid product price");
      }

      const itemTotal = product.price * item.quantity;
      totalPrice += itemTotal;

      processedItems.push({
        product: item.product,
        quantity: item.quantity,
        priceAtPurchase: product.price,
      });
    }

    console.log("ORDER ITEMS: ", orderItems);
    console.log("PROCESSED ITEMS: ", processedItems);


    console.log("CART: ", cart);
    console.log("FINAL TOTAL: ", cart.finalTotal);
    
    const newOrder = {
      owner: userId,
      orderPrice: cart.finalTotal,
      subTotal: totalPrice,
      // COPY SNAPSHOT
      ...(cart && {
        subTotal: cart.subTotal,
        discountAmount: cart.discountAmount,
        discountedTotal: cart.discountedTotal,
        taxAmount: cart.taxAmount,
        shippingCharges: cart.shippingCharges,
        deliveryCharges: cart.deliveryCharges,
        orderPrice: cart.finalTotal,
      }),

      orderItems: processedItems,
      orderStatus: "DRAFT",
      paymentStatus: "PENDING",
    };

    const order = await Order.create(newOrder);

    const createdOrder = await Order.findById(order._id).populate({
      path: "orderItems.product",
      select: "name description price mainImage",
    });

    return createdOrder;
  } catch (error) {
    console.log("Create Order failed: ", error);
    throw new ApiError(500, "Something went wrong while Creating the Order");
  }
}

export async function getAUserOrder(orderId) {
  const order = await Order.findOne({ _id: orderId }).populate({
    path: "orderItems.product",
    select: "name description price mainImage",
  });

  return order;
}

export async function placeAUserOrder(
  orderId,
  userOrder,
  addressId,
  paymentMethod
) {
  try {
    const address = await Address.findOne({ _id: addressId });

    if (!address) throw new ApiError(404, "Address not found");

    userOrder.address = addressId;

    userOrder.addressSnapshot = {
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address?.addressLine2,
      city: address.city,
      state: address.state,
      country: address.country,
      landmark: address?.landmark,
      pincode: address.pincode,
    };

    userOrder.paymentMethod = paymentMethod;

    let codResponse, onlineResponse, razorpayOrder;

    if (paymentMethod === "COD") {
      ((userOrder.paymentStatus = "PENDING"),
        (userOrder.orderStatus = "CONFIRMED"),
        // Delivery charge for COD
        (userOrder.orderPrice += 40),
        (codResponse = {
          orderId: userOrder._id,
          paymentMethod: userOrder.paymentMethod,
          orderStatus: userOrder.orderStatus,
          address: userOrder.address,
          addressSnapshot: userOrder.addressSnapshot,
        }));
    } else {
      let amount = userOrder.orderPrice;
      let receipt = userOrder._id.toString();
      razorpayOrder = await createRazorpayOrder(amount, receipt);

      console.log("RAZORPAY_ORDER: ", razorpayOrder);

      userOrder.orderStatus = "PENDING_PAYMENT";
      userOrder.paymentStatus = "PENDING";
      userOrder.paymentProvider = "RAZORPAY";
      userOrder.gatewayOrderId = razorpayOrder?.id;
      // order.gatewayKey = razorpayOrder?.razorpay_key;

      onlineResponse = {
        orderId: userOrder._id,

        address: userOrder.address,
        shippingAddress: userOrder.addressSnapshot,
        paymentProvider: userOrder.paymentProvider,
        orderStatus: userOrder.orderStatus,
        paymentMethod: userOrder.paymentMethod,
        // razorpayOrderId: order.gatewayOrderId,
        //   razorpayKey: order.gatewayKey,
      };
    }

    if (onlineResponse) {
      const lastAttempt = await Payment.find({ orderId: orderId })
        .sort({ attemptNumber: -1 })
        .limit(1);

      const attemptNumber = lastAttempt.length
        ? lastAttempt[0].attemptNumber + 1
        : 1;

      await Payment.create({
        orderId: userOrder._id,
        amount: userOrder.orderPrice,
        status: "PENDING",
        razorpayOrderId: userOrder.gatewayOrderId,
        attemptNumber,
      });
    }

    const placedOrder = await userOrder.save();

    return { placedOrder, razorpayOrder, codResponse, onlineResponse };
  } catch (error) {
    console.log("Placing Order failed: ", error);
    throw new ApiError(500, "Something went wrong while Placing the Order");
  }
}

export async function verifyUserPayment(verify, orderId, razorpay_payment_id) {
  try {
    let failedMsg, confirmedOrder;
    if (!verify) {
      await Payment.findOneAndUpdate(
        { orderId: orderId },
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

      failedMsg = "Invalid payment signature, Payment failed recorded";
    } else {
      // signature verified
      await Payment.findOneAndUpdate(
        {
          orderId,
          status: { $in: ["PENDING", "FAILED"] },
        },
        {
          $set: {
            status: "SUCCESS",
            transactionId: razorpay_payment_id,
          },

          sort: { attemptNumber: -1 },
        }
      );

      confirmedOrder = await Order.findOneAndUpdate(
        { _id: orderId },
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
    }

    return { confirmedOrder, failedMsg };
  } catch (error) {
    console.log("Verify Payment failed: ", error);
    throw new ApiError(500, "Something went wrong while verifying the payment");
  }
}

// Later
export async function getAdminDashboardStats(userId) {}

// can we use asyncHandler in service db functions, I think not, because asyncHandler converts function to req, res, next parameters
// export const getAllOrders = asyncHandler(() => {

// })
