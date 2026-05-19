import { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { findAOrder } from "../services/order.service.js";

export const isOwner = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;

  if (!isValidObjectId(orderId)) throw new ApiError(400, "Invalid order id");

  const order = await findAOrder(orderId);

  if (!order) throw new ApiError(404, "Order not found (order middleware)");

  if (!order.owner.equals(req?.user._id))
    throw new ApiError(400, "You don't owner of this order, to place order");

  next();
});
