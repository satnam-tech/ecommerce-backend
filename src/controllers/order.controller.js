import { isValidObjectId } from "mongoose";
import { Order } from "../models/order.model.js";
import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import { Address } from "../models/address.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Payment } from "../models/payment.model.js";
import {createRazorpayOrder} from "../services/payment.service.js"

const createOrder = asyncHandler(async (req, res) => {
  /* 
    Check user have a cart, cartItems or not
    Create Order using cart info, and cartItems
    */
  const userCart = await Cart.findOne({ owner: req?.user._id });

  if (!userCart) throw new ApiError(404, "User cart not found");

  if (userCart.cartItems.length < 1)
    throw new ApiError(404, "User cart items not found");

  let cartItems = userCart.cartItems;

  for (const item of cartItems) {
    const product = await Product.findById(item.product);
    if (product.stock < 1)
      throw new ApiError(400, "Product is out of stock (when creating order)");
    if (product.price < 1)
      throw new ApiError(400, "Invalid Product Price (when creating order)");
  }

  console.log("CART ITEMS: ", cartItems);

  const newOrder = {
    owner: req?.user._id,
    orderPrice: userCart?.cartTotal,
    orderItems: cartItems,
    orderStatus: "DRAFT",
    paymentStatus: "PENDING",
  };

  const order = await Order.create(newOrder);

  console.log(order);

  const orderItems = order.orderItems;

  for (const item of orderItems) {
    const product = await Product.findById(item.product);

    const productPrice = product.price;
    item.priceAtPurchase = productPrice;
  }

  await order.save();

  const createdOrder = await Order.findOne({ owner: req?.user._id }).populate({
    path: "orderItems.product",
    select: "name description price mainImage",
  });

  if (!createdOrder) throw new ApiError(404, "Order not created");

  res.status(201).json(
    new ApiResponse(
      201,
      {
        orderId: createOrder?._id,
        createdOrder,
      },
      "Order created successfully"
    )
  );
});

const getOrderDetails = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  if (!isValidObjectId(orderId)) throw new ApiError(400, "Invalid order id");

  const order = await Order.findOne({ _id: orderId }).populate({
    path: "orderItems.product",
    select: "name description price mainImage",
  });

  if (!order) throw new ApiError(400, "Inavalid order id");

  return res
    .status(200)
    .json(new ApiResponse(200, order, "Checkout details fetched successfully"));
});

// Later: user paid order created COD OR ONLINE, WHAT if user place order again from postman and others, how to handle duplicate order creation if one order paid and entity created
const placeOrder = asyncHandler(async (req, res) => {
  /*
    get addressId and paymentMethod
    Place Order according to paymentMethod
    And send response according to paymentMethod
    */

  const { orderId } = req.params;
  const { addressId, paymentMethod } = req.body;

  if (!orderId) throw new ApiError(400, "Order id is required");

  if (!addressId || !paymentMethod)
    throw new ApiError(400, "Fields are required");

  if (!isValidObjectId(orderId) || !isValidObjectId(addressId))
    throw new ApiError(401, "Invalid order id or addressId");

  if (paymentMethod !== "COD" && paymentMethod !== "ONLINE")
    throw new ApiError(400, "Invalid payment method");

  let order = await Order.findOne({ _id: orderId });

  if (!order) throw new ApiError(404, "User order not found");

  if (order.orderItems.length < 1)
    throw new ApiError(400, "User order don't have any items");

  const orderItems = order.orderItems;

  if (order.orderPrice < 1)
    throw new ApiError(400, "Invalid orderPrice (when placing order)");

  for (const item of orderItems) {
    const product = await Product.findById(item.product);
    if (!product)
      throw new ApiError(404, "Product not found (when placing order)");

    if (product.stock < 1)
      throw new ApiError(400, "Product is out of stock (when placing order)");
    if (product.price < 1)
      throw new ApiError(400, "Invalid Product Price (when placing order)");
  }

  const address = await Address.findOne({ _id: addressId });

  if (!address) throw new ApiError(404, "Address not found");

  order.address = addressId;

  order.addressSnapshot = {
    fullName: address.fullName,
    phone: address.phone,
    addressLine1: address.addressLine1,
    city: address.fullName.city,
    state: address.state,
    pincode: address.pincode,
  };

  order.paymentMethod = paymentMethod;

  let codResponse, onlineResponse, razorpayOrder;

  if (paymentMethod === "COD") {
    ((order.paymentStatus = "PENDING"),
      (order.orderStatus = "CONFIRMED"),
      (codResponse = {
        orderId: order._id,
        paymentMethod: order.paymentMethod,
        orderStatus: order.orderStatus,
        address: order.address,
        addressSnapshot: order.addressSnapshot,
      }));
  } else {
    let amount = order.orderPrice;
    let receipt = order._id.toString();
    razorpayOrder = await createRazorpayOrder(amount, receipt);

    console.log("RAZORPAY_ORDER: ", razorpayOrder);
    

    order.orderStatus = "PENDING_PAYMENT";
    order.paymentStatus = "PENDING";
    order.paymentProvider = "RAZORPAY";
    order.gatewayOrderId = razorpayOrder?.id;
    // order.gatewayKey = razorpayOrder?.razorpay_key;

    onlineResponse = {
      orderId: order._id,
      
      address: order.address,
      shippingAddress: order.addressSnapshot,
      paymentProvider: order.paymentProvider,
      orderStatus: order.orderStatus,
      paymentMethod: order.paymentMethod,
      // razorpayOrderId: order.gatewayOrderId,
      //   razorpayKey: order.gatewayKey,
    };
  }

  if (onlineResponse) {
    const lastAttempt = await Payment.find({ orderId: order._id })
      .sort({ attemptNumber: -1 })
      .limit(1);

    const attemptNumber = lastAttempt.length
      ? lastAttempt[0].attemptNumber + 1
      : 1;

    await Payment.create({
      orderId: order._id,
      amount: order.orderPrice,
      status: "PENDING",
      razorpayOrderId: order.gatewayOrderId,
      attemptNumber,
    });
  }

  await order.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      codResponse
        ? codResponse
        : {
            onlineResponse,
            razorpayOrderId: order.gatewayOrderId,
            currency: razorpayOrder?.currency,
            amount: order.orderPrice,
            // razorpayKey: order.gatewayKey,
          },
      codResponse
        ? "Order placed successfully (COD)"
        : "Order placed successfully or payment initiated (ONLINE)"
    )
  );

  // return res.status(200).json(
  //   new ApiResponse(200, razorpayOrder, "Order Created Successfully")
  // )
});

export { createOrder, getOrderDetails, placeOrder };
