import { isValidObjectId } from "mongoose";
import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

const getUserCart = asyncHandler(async (req, res) => {
  const userCart = await Cart.find({ owner: req?.user._id }).populate({
    path: "cartItems.product",
    select: "name description price mainImage",
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        userCart,
      },
      "Cart fetched successfully"
    )
  );
});

// Not Tested: Check that product is avalable or not (Check stock before add item to cart)
const addItemToCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  if (!isValidObjectId(productId))
    throw new ApiError(400, "Invalid product id");

  const product = await Product.findById(productId);

  if (!product) throw new ApiError(400, "Invalid product id");
  if (!quantity) throw new ApiError(400, "Product quantity is required");

  const cart = await Cart.findOne({ owner: req?.user._id });

  console.log(cart);

  if(product.stock < 1)
    throw new ApiError(400, "Product is out of stock OR 1")

  if(!(product.stock >= quantity))
    throw new ApiError(400, `Product stock is not availale, ${product.stock}`)


  let newItem = {
    product: productId,
    quantity: quantity,
  };

  let message;

  if (!cart) {
    let newCart = await Cart.create({
      owner: req?.user._id,
      cartTotal: quantity * product?.price,
      cartItems: [newItem],
    });

    message = "Item added successfully";
  } else {
    let cartItems = cart.cartItems || [];

    let existingItem = cartItems.find((item) => {
      return item.product.equals(productId);
    });

    if (existingItem) {
      existingItem.quantity = quantity;
      message = "Updated item quantity successfully";
    } else {
      cartItems.push(newItem);
      message = "Item added successfully";
    }
  }

  if (cart !== null) {
    const cartItems = cart.cartItems;
    let total = 0;

    for (const item of cartItems) {
      const productPrice = await Product.findById(item.product).select("price");
      total += item.quantity * productPrice.price;
    }

    cart.cartTotal = total;
    await cart.save();
  }

  const populatedCart = await Cart.findOne({ owner: req?.user._id }).populate({
    path: "cartItems.product",
    select: "name description price mainImage",
  });

  res.status(201).json(
    new ApiResponse(
      201,
      {
        cart: populatedCart,
      },
      message
    )
  );
});

const RemoveItemFromCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!isValidObjectId(productId))
    throw new ApiError(400, "Inavalid product id");

  const product = await Product.findById(productId);
  console.log(product);

  if (!product) throw new ApiError(400, "Invalid product Id");

  const cart = await Cart.findOne({ owner: req?.user._id });

  if (!cart) throw new ApiError(404, "Cart not found");

  const cartItems = cart.cartItems;

  const index = cartItems.findIndex((item) => item.product.equals(productId));

  if (index !== -1) {
    cartItems.splice(index, 1);
  } else {
    throw new ApiError(404, "Product not found in cart");
  }
  
  let total = 0;
  for (const item of cartItems) {
    const productPrice = await Product.findById(item.product).select("price");
    total += item.quantity * productPrice.price;
  }

  cart.cartTotal = total;
  await cart.save();

  const remaininigCartItem = await Cart.findOne({
    owner: req?.user._id,
  }).populate({
    path: "cartItems.product",
    select: "name description price mainImage",
  });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        remaininigCartItem,
      },
      "Item removed successfully"
    )
  );
});

// Question: If user don't add to cart product instead they click buy now btn, When What Happened from backend

// And how to handle , if user adds some products in past to the cart, Suppose now in that products, have any one product don't have any stock 0, THEN existing added items to cart, HOW TO SHOW THROW ERROR OR MESSAGE, THAT PRODUCT DON'T HAVE ANY stock

// IMPLEMENT LATER: discountedTotal, tax, shipping, delivery charges, & Stored in CART MODEL


export { getUserCart, addItemToCart, RemoveItemFromCart };
