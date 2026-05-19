import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createACoupon,
  deleteACoupon,
  findCouponByCode,
  getAAvailableCoupons,
  getCoupons,
  removeCoupon,
  updateACoupon,
  updateCouponActiveStatus,
} from "../services/coupon.service.js";
import {
  calculateCartTotals,
  getAUserCart,
} from "../services/product.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { isValidObjectId } from "mongoose";

const createCoupon = asyncHandler(async (req, res) => {
  const { code, discount_type, discount_value, startsAt, expirationDate } =
    req.body;

  const createdCoupon = await createACoupon({
    code,
    discount_type,
    discount_value,
    startsAt,
    expirationDate,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { coupon: createdCoupon },
        "Coupon created successfully"
      )
    );
});

const getAllCoupons = asyncHandler(async (req, res) => {
  const coupons = await getCoupons();

  return res
    .status(200)
    .json(new ApiResponse(200, { coupons }, "Coupons retrieved successfully"));
});

const getAvailableCoupons = asyncHandler(async (req, res) => {
  const coupons = await getAAvailableCoupons(req.user._id);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { coupons },
        "Available coupons retrieved successfully"
      )
    );
});

const applyCouponToCart = asyncHandler(async (req, res) => {
  const { couponCode } = req.body;

  // 1. find cart
  const { cart } = await getAUserCart(req.user._id, {
    path: "cartItems.product",
    select: "name description price mainImage",
  });

  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }

  // 2. find coupon
  const coupon = await findCouponByCode(couponCode);

  if (!coupon) {
    throw new ApiError(404, "Invalid coupon");
  }

  // 3. save coupon in cart
  cart.appliedCoupon = coupon._id;

  // 4. recalculate totals
  await calculateCartTotals({
    cart,
    coupon,
    // paymentMethod: cart.paymentMethod,
  });

  // 5. populate cart
  const userCart = await getAUserCart(req.user._id, {
    path: "cartItems.product",
    select: "name description price mainImage",
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, { cart: userCart }, "Coupon applied successfully")
    );
});

const updateCoupon = asyncHandler(async (req, res) => {
  const { couponId } = req.params;

  const updatedCoupon = await updateACoupon(couponId, req.body.coupon);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        coupon: updatedCoupon,
      },
      "Coupon updated successfully"
    )
  );
});

const removeCouponFromCart = asyncHandler(async (req, res) => {
  const { couponCode } = req.body;

  if (!couponCode) {
    throw new ApiError(400, "Coupon code is required");
  }

  // Find user cart
  const {cart} = await getAUserCart(req.user._id, {
    path: "cartItems.product",
    select: "name description price mainImage",
  });

  console.log(cart);
  
  if (!cart || !cart.cartItems.length === 0) {
    throw new ApiError(404, "Cart not found");
  }

  // Find coupon
  const coupon = await findCouponByCode(couponCode);

  if (!coupon) {
    throw new ApiError(404, "Coupon not found");
  }

  // Remove coupon
  const updatedCart = await removeCoupon(coupon._id, req.user._id);

  // Recalculate totals
  const recalculatedCart = await calculateCartTotals({
    cart: updatedCart.cart,
    coupon: null,
    paymentMethod: updatedCart.paymentMethod,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { cart: recalculatedCart },
        "Coupon removed successfully"
      )
    );
});

const updateCouponStatus = asyncHandler(async (req, res) => {
  const { couponId } = req.params;

  const { is_active } = req.body;

  if (!is_active) {
    throw new ApiError(400, "status field is required");
  }

  // Validate boolean
  // if (typeof is_active !== "boolean") {
  //   throw new ApiError(400, "is_active must be boolean");
  // }

  // Validate couponId
  if (!isValidObjectId(couponId)) {
    throw new ApiError(400, "Invalid coupon id");
  }

  // Update status
  const updatedCoupon = await updateCouponActiveStatus(couponId, is_active);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        coupon: updatedCoupon,
      },
      `Coupon ${is_active ? "activated" : "deactivated"} successfully`
    )
  );
});

const deleteCoupon = asyncHandler(async (req, res) => {
  const { couponId } = req.params;

  // Validate couponId
  if (!isValidObjectId(couponId)) {
    throw new ApiError(400, "Invalid coupon id");
  }

  // Delete coupon
  const deletedCoupon = await deleteACoupon(couponId);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        coupon: deletedCoupon,
      },
      "Coupon deleted successfully"
    )
  );
});

export {
  createCoupon,
  getAllCoupons,
  getAvailableCoupons,
  applyCouponToCart,
  updateCoupon,
  removeCouponFromCart,
  updateCouponStatus,
  deleteCoupon,
};
