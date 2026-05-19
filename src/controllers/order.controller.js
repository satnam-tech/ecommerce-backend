import { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getAUserCart,
  getAProductById,
  decreaseProductStock,
} from "../services/product.service.js";
import {
  createAOrder,
  findAOrder,
  getAUserOrder,
  placeAUserOrder,
} from "../services/order.service.js";
import { generateInvoicePDF } from "../services/invoice.service.js";

const createOrder = asyncHandler(async (req, res) => {
  /* 
    Check user have a cart, cartItems or not
    Create Order using cart info, and cartItems
    */

  let orderItems;
  let userCart = null;

  if (req.body.items && req.body.items.length > 0) {
    orderItems = req.body.items; // Buy Now
  } else {
    userCart = await getAUserCart(req?.user._id); // Cart flow

    if (!userCart || userCart.length === 0) {
      throw new Error("Cart is empty");
    }

    orderItems = userCart.cart.cartItems;
  }

  console.log("Order Items:", orderItems);
  console.log("Cart: ", userCart);

  const createdOrder = await createAOrder(
    userCart?.cart,
    orderItems,
    req?.user._id
  );

  if (!createdOrder) throw new ApiError(404, "Order not created");

  res.status(201).json(
    new ApiResponse(
      201,
      {
        orderId: createdOrder?._id,
        createdOrder,
      },
      "Order created successfully"
    )
  );
});

const getOrderDetails = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  if (!isValidObjectId(orderId)) throw new ApiError(400, "Invalid order id");

  const order = await getAUserOrder(orderId);

  console.log(order);

  if (!order) throw new ApiError(400, "Inavalid order id");

  return res
    .status(200)
    .json(new ApiResponse(200, order, "Checkout details fetched successfully"));
});

/* Later: user paid order created COD OR ONLINE, WHAT if user place order again from postman and others, how to handle duplicate order creation if one order paid and entity created:
DONE - 05-04-2026, 02:10PM & LATER CAN TEST 
*/
const placeOrder = asyncHandler(async (req, res) => {
  /*
    get addressId and paymentMethod
    Place Order according to paymentMethod
    And send response according to paymentMethod
    */

  const { orderId } = req.params;
  const { addressId, paymentMethod } = req.body;

  if (!isValidObjectId(orderId) || !isValidObjectId(addressId))
    throw new ApiError(401, "Invalid order id or addressId");

  if (paymentMethod !== "COD" && paymentMethod !== "ONLINE")
    throw new ApiError(400, "Invalid payment method");

  let order = await findAOrder(orderId);

  if (!order) throw new ApiError(404, "User order not found");

  if (order.orderStatus === "CONFIRMED" || order.paymentStatus === "PAID") {
    throw new ApiError(400, "Order already placed!");
  }

  if (order.orderItems.length < 1)
    throw new ApiError(400, "User order don't have any items");

  const orderItems = order.orderItems;

  if (order.orderPrice < 1)
    throw new ApiError(400, "Invalid orderPrice (when placing order)");

  for (const item of orderItems) {
    const product = await getAProductById(item.product);
    if (!product)
      throw new ApiError(404, "Product not found (when placing order)");

    if (product.stock < 1)
      throw new ApiError(400, "Product is out of stock (when placing order)");
    if (product.price < 1)
      throw new ApiError(400, "Invalid Product Price (when placing order)");
  }

  const { placedOrder, razorpayOrder, codResponse, onlineResponse } =
    await placeAUserOrder(orderId, order, addressId, paymentMethod);

  // Decrease the stock of products after placing order
  await decreaseProductStock(placedOrder.orderItems);

  return res.status(200).json(
    new ApiResponse(
      200,
      codResponse
        ? codResponse
        : {
            onlineResponse,
            razorpayOrderId: placedOrder.gatewayOrderId,
            currency: razorpayOrder?.currency,
            amount: placedOrder.orderPrice,
            // razorpayKey: order.gatewayKey,
          },
      codResponse
        ? "Order placed successfully (COD)"
        : "Order placed successfully or payment initiated (ONLINE)"
    )
  );
});

const downloadInvoice = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  // Validate orderId
  if (!isValidObjectId(orderId)) {
    throw new ApiError(400, "Invalid order id");
  }

  // Find order
  const order = await findAOrder(orderId, [
    {
      path: "owner",
      select: "fullName phone",
    },
    {
      path: "orderItems.product",
      select: "name price",
    },
  ]);

  console.log("Order:", order.orderItems[0].product);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Generate PDF
  await generateInvoicePDF(order, res);
});

export { createOrder, getOrderDetails, placeOrder, downloadInvoice };
