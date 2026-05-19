import { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import {
  AddProductToCartOrUpdateQuantity,
  getAUserCart,
  getAProductById,
  removeProductFromCart,
  calculateCartTotals,
} from "../services/product.service.js";

const getUserCart = asyncHandler(async (req, res) => {
  const { cart } = await getAUserCart(req?.user._id, {
    path: "cartItems.product",
    select: "name description price mainImage",
  });

  console.log("cart:", cart);

  const isCartEmpty = !cart || cart.cartItems.length === 0;

  return res.status(200).json({
    success: true,
    userCart: isCartEmpty ? null : cart,
    message: isCartEmpty ? "Cart is empty" : "Cart fetched successfully",
  });
});

// Not Tested: Check that product is avalable or not (Check stock before add item to cart)
const addItemToCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  if (!isValidObjectId(productId))
    throw new ApiError(400, "Invalid product id");

  // console.log(productId);

  const product = await getAProductById(productId);

  if (!quantity) throw new ApiError(400, "Product quantity is required");

  const cart = await getAUserCart(req?.user._id, {
    path: "cartItems.product",
    select: "name description price mainImage",
  });

  if (product.stock < 1) throw new ApiError(400, "Product is out of stock");

  if (product.stock < quantity)
    throw new ApiError(400, `Product stock is not available ${product.stock}`);

  const { userCart, message } = await AddProductToCartOrUpdateQuantity(
    req?.user._id,
    product,
    cart.cart,
    productId,
    quantity
  );

  res.status(201).json(
    new ApiResponse(
      201,
      {
        cart: userCart,
      },
      message
    )
  );
});

const RemoveItemFromCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!isValidObjectId(productId))
    throw new ApiError(400, "Inavalid product id");

  const product = await getAProductById(productId);

  if (!product) throw new ApiError(400, "Invalid product Id");

  const cart = await getAUserCart(req?.user._id, {
    path: "cartItems.product",
    select: "name description price mainImage",
  });

  if (!cart) throw new ApiError(404, "Cart not found");

  const remainingCartItems = await removeProductFromCart(
    cart.cart,
    productId,
    req?.user._id
  );

  res.status(200).json(
    new ApiResponse(
      200,
      {
        remainingCartItems,
      },
      "Item removed successfully"
    )
  );
});

// Question: If user don't add to cart product instead they click buy now btn, When What Happened from backend : DONE 04-05-2026, 8:11 PM YET NOT TESTED

// Question: How to show delivery date in cart, when user add item to cart, and how to calculate delivery date : DONE 04-05-2026, 9:21 PM YET NOT TESTED

// And how to handle , if user adds some products in past to the cart, Suppose now in that products, have any one product don't have any stock 0, THEN existing added items to cart, HOW TO SHOW THROW ERROR OR MESSAGE, THAT PRODUCT DON'T HAVE ANY stock : DONE 05-05-2026, 12:33 PM YET NOT TESTED

// IMPLEMENT LATER: discountedTotal, tax, shipping, delivery charges, & Stored in CART MODEL AND Implement coupons, discounts : DONE 10-05-2026, 5:53 PM YET NOT TESTED

// IMPLEMENT LATER: Decrease the stock when user place order, and increase the stock when user cancel order: DONE 10-05-2026, 6:13 PM YET NOT TESTED

// IMPLEMENT LATER: Invoice generation when user place order, and send invoice to user email (⚙️ How Invoice is Generated: learning.txt file): DONE 10-05-2026, 6:26 PM YET NOT TESTED

// Left Testing: 1. Cart apis & charges, 2. Stock decrease, 3. Invoice generation and download invoice, 4. Coupon Apis

export { getUserCart, addItemToCart, RemoveItemFromCart };
