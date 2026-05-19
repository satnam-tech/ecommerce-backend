import { Cart } from "../models/cart.model.js";
import { Coupon } from "../models/coupon.model.js";
import { ApiError } from "../utils/ApiError.js";
import { getAUserCart } from "./product.service.js";

export async function createACoupon(couponData) {
  try {
    const createdCoupon = await Coupon.create(couponData);
    return createdCoupon;
  } catch (error) {
    console.log("Error creating coupon:", error);
    throw new ApiError(500, "Something went wrong while creating coupon");
  }
}

export async function getCoupons() {
  try {
    const coupons = await Coupon.find();
    return coupons;
  } catch (error) {
    console.log("Error retrieving coupons:", error);
  }
}

export async function findCouponByCode(code) {
  try {
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    return coupon;
  } catch (error) {
    console.log("Error finding coupon:", error);
  }
}

export async function findCouponById(id) {
  console.log("Finding coupon with ID:", id);
  try {
    const coupon = await Coupon.findOne({ _id: id });

    console.log("Found coupon:", coupon);
    return coupon;
  } catch (error) {
    console.log("Error finding coupon:", error);
  }
}
export async function getAAvailableCoupons(userId) {
  const cart = await Cart.findOne({
    owner: userId,
  });

  console.log("User cart:", cart);

  if (!cart) {
    return false;
  }

  let cartTotal = cart.subTotal;

  console.log("Cart total:", cartTotal);

  const coupons = await Coupon.find({
    is_active: true,
    expirationDate: { $gt: new Date() },
  });

  const eligibleCoupons = coupons.filter(
    (coupon) => cartTotal >= coupon.minimumCartValue
  );

  return eligibleCoupons;
}

export async function applyCoupon(coupon, subtotal) {
  // 1. active check
  if (!coupon.is_active) {
    throw new ApiError(400, "Coupon inactive");
  }

  // 2. date check
  const now = new Date();

  if (coupon.startsAt > now) {
    throw new ApiError(400, "Coupon not started");
  }

  if (coupon.expirationDate < now) {
    throw new ApiError(400, "Coupon expired");
  }

  // 3. minimum cart value
  if (subtotal < coupon.minimumCartValue) {
    throw new ApiError(
      400,
      `Minimum cart value should be ₹${coupon.minimumCartValue}`
    );
  }

  // 4. calculate discount
  let discount = 0;

  if (coupon.discount_type === "PERCENTAGE") {
    discount = (subtotal * coupon.discount_value) / 100;
  } else if (coupon.discount_type === "FIXED") {
    discount = coupon.discount_value;
  }

  return discount;
}

export async function updateACoupon(couponId, updateData) {
  console.log("Updating coupon with ID:", couponId);
  // Find coupon
  const coupon = await findCouponById(couponId);

  console.log("Found coupon:", coupon);

  if (!coupon) {
    throw new ApiError(404, "Coupon not found");
  }

  const updatedCoupon = await Coupon.findByIdAndUpdate(
    couponId,
    { $set: updateData },
    {
      new: true,
      runValidators: true,
    }
  );
  return updatedCoupon;
}

export async function removeCoupon(couponId, userId) {
  // Find cart
  const cart = await Cart.findOne({
    owner: userId,
  });

  if (!cart || !cart.cartItems.length === 0) {
    throw new ApiError(404, "Cart not found");
  }

  // No coupon applied
  if (!cart.appliedCoupon) {
    throw new ApiError(400, "No coupon applied");
  }

  // Verify coupon matches
  if (cart.appliedCoupon.toString() !== couponId.toString()) {
    throw new ApiError(400, "This coupon is not applied to cart");
  }

  // Remove coupon
  cart.appliedCoupon = null;

  // Reset discount
  cart.discountAmount = 0;

  await cart.save();

  // Return updated cart
  const updatedCart = await getAUserCart(userId, {
    path: "cartItems.product",
    select: "name description price mainImage",
  });

  return updatedCart;
}

export const updateCouponActiveStatus = async (couponId, isActive) => {
  const coupon = await Coupon.findByIdAndUpdate(
    couponId,
    {
      $set: {
        is_active: isActive,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!coupon) {
    throw new ApiError(404, "Coupon not found");
  }

  return coupon;
};

export const deleteACoupon = async (couponId) => {
  // Find coupon
  const coupon = await Coupon.findByIdAndDelete(couponId, {
    returnDocument: "after",
    runValidators: true,
  });

  if (!coupon) {
    throw new ApiError(404, "Coupon not found");
  }

  return coupon;
};
