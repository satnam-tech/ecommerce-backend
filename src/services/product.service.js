import { Product } from "../models/product.model.js";
import { isValidObjectId } from "mongoose";
import { uploadOnCloudinary } from "./cloudinary.service.js";
import { Cart } from "../models/cart.model.js";
import { ApiError } from "../utils/ApiError.js";
import { applyCoupon } from "./coupon.service.js";

export function productFilter(
  category,
  minPrice,
  maxPrice,
  brand,
  search,
  sort
) {
  let filter = {};

  if (category) {
    if (!isValidObjectId(category))
      throw new ApiError(400, "Invalid category Id");
    filter.category = category;
  }

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  if (brand) {
    filter.brand = brand;
  }

  // if (search?.trim()) {
  //   const keyword = search.trim();
  //   filter.name = { $regex: keyword, $options: "i" }
  // }

  // seraching on both
  if (search?.trim()) {
    const keyword = search.trim();
    filter.$or = [
      { name: { $regex: keyword, $options: "i" } },
      { description: { $regex: keyword, $options: "i" } },
    ];
  }

  let sortOption = {};

  switch (sort) {
    case "price_asc":
      sortOption.price = 1;
      break;
    case "price_desc":
      sortOption.price = -1;
      break;
    case "newest":
      sortOption.createdAt = -1;
      break;
    case "rating":
      sortOption.rating = -1;
      break;
    default:
      sortOption.createdAt = -1;
  }

  let haveSort;
  // Sorting
  if (sort) {
    haveSort = true;
  }

  return { filter, haveSort, sortOption };
}

export async function listAllProducts(
  page,
  limit,
  filter,
  haveSort,
  sortOption
) {
  try {
    let query = Product.find(filter);

    // Sorting
    if (haveSort) {
      query = query.sort(sortOption);
    }

    query = query.skip((page - 1) * limit).limit(limit);

    const allProducts = await query;

    return allProducts;
  } catch (error) {
    console.log("Get All Products failed: ", error);
    throw new ApiError(500, "Something went wrong while Fetching the Products");
  }
}

export async function getTotalProductsCount() {
  const totalProducts = await Product.countDocuments();

  return totalProducts;
}

export async function getCurrentSubImagesCount(productId) {
  const subImages = await Product.findById(productId).select("subImages");

  return subImages.subImages.length;
}

export async function getAProductById(productId, select) {
  let product;
  if (select) {
    product = await Product.findById(productId).select(select);
  } else {
    product = await Product.findById(productId);
  }

  console.log("Product: ", product);
  return product;
}

export async function findProducts(payload) {
  const products = await Product.find(payload);
  return products;
}

export async function checkExistingProduct(payload) {
  const existingProduct = await Product.findOne(payload);

  return existingProduct;
}

export async function uploadProductMedia(
  mainImageLocalPath,
  subImagesLocalPath
) {
  try {
    const mainImageUpload = uploadOnCloudinary(mainImageLocalPath);

    const subImagesUploads = subImagesLocalPath.map((img) =>
      uploadOnCloudinary(img.path)
    );

    const uploadsResult = await Promise.all([
      mainImageUpload,
      ...subImagesUploads,
    ]);

    const mainImage = uploadsResult[0];
    const subImages = uploadsResult.slice(1);

    const formattedResult = {
      mainImage: mainImage.secure_url,
      subImages: subImages.map((img) => img.secure_url),
    };

    return formattedResult;
  } catch (error) {
    console.log("Uploading product media failed: ", error);
    throw new ApiError(
      500,
      "Something went wrong while Uploading the Product Media"
    );
  }
}

export async function createNewProduct(productPayload) {
  try {
    const product = await Product.create(productPayload);

    return product;
  } catch (error) {
    console.log("Creating a product failed: ", error);
    throw new ApiError(500, "Something went wrong while Creating the Product");
  }
}

export async function updateAProduct(productId, updatePayload) {
  try {
    const updatedproduct = await Product.findByIdAndUpdate(
      productId,
      updatePayload,
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    return updatedproduct;
  } catch (error) {
    console.log("Updating a product failed: ", error);
    throw new ApiError(500, "Something went wrong while Updating the Product");
  }
}

export async function uploadProductMainImage(mainImageLocalPath) {
  try {
    const mainImageResult = await uploadOnCloudinary(mainImageLocalPath);

    return mainImageResult;
  } catch (error) {
    console.log("Uploading product Main Image failed for: ", error);
    throw new ApiError(
      500,
      "Something went wrong while Uploading the Product Main Image"
    );
  }
}

export async function uploadProductSubImages(subImagesLocalPath) {
  try {
    const subImageResult = await Promise.all(
      subImagesLocalPath.map((img) => uploadOnCloudinary(img.path))
    );

    return subImageResult;
  } catch (error) {
    console.log("Uploading product Sub Images failed for: ", error);
    throw new ApiError(
      500,
      "Something went wrong while Uploading the Product Sub Images"
    );
  }
}

export async function deleteAProduct(productId) {
  try {
    const deletedproduct = await Product.findByIdAndDelete(productId, {
      returnDocument: "after",
    });

    return deletedproduct;
  } catch (error) {
    console.log("Deleting a product failed: ", error);
    throw new ApiError(500, "Something went wrong while Deleting the Product");
  }
}

export async function UpdateProductMainImage(productId, mainImageResult) {
  try {
    const updatedMainImage = await Product.findByIdAndUpdate(productId, {
      $set: {
        mainImage: mainImageResult?.secure_url,
      },
    }).select("name description mainImage");

    return updatedMainImage;
  } catch (error) {
    console.log("Deleting a product failed: ", error);
    throw new ApiError(500, "Something went wrong while Deleting the Product");
  }
}

export async function addNewSubImages(productId, subImages) {
  try {
    const addedNewSubImages = await Product.findByIdAndUpdate(
      productId,
      {
        $push: {
          subImages,
        },
      },

      { returnDocument: "after", runValidators: true }
    ).select("name description subImages");

    return addedNewSubImages;
  } catch (error) {
    console.log("Adding new subImages failed: ", error);
    throw new ApiError(
      500,
      "Something went wrong while Adding the new subImages"
    );
  }
}

export async function deleteASubImage(productId, subImageUrl) {
  try {
    const deletedNewSubImages = await Product.findByIdAndUpdate(
      productId,
      {
        $pull: {
          subImages: subImageUrl,
        },
      },

      { returnDocument: "after", runValidators: true }
    ).select("name description subImages");

    return deletedNewSubImages;
  } catch (error) {
    console.log("Deleting subImages failed: ", error);
    throw new ApiError(
      500,
      "Something went wrong while Deleting the subImages"
    );
  }
}

// Cart services
export async function getAUserCart(userId, populate) {
  let query = Cart.findOne({ owner: userId });

  if (populate) {
    query = query.populate(populate);
  }

  const cart = await query;

  console.log("User Cart:", cart);

  return {
    cart,
    estimatedDelivery: cart
      ? calculateDeliveryDate({
          pincode: "110001",
          product: { processingTime: 2 },
        })
      : null,
  };
}

export async function AddProductToCartOrUpdateQuantity(
  userId,
  product,
  userCart,
  productId,
  quantity
) {
  let newItem = {
    product: productId,
    quantity: quantity,
  };

  let message;

  // let userCart = null;
  if (!userCart) {
    userCart = await Cart.create({
      owner: userId,
      cartTotal: quantity * product?.price,
      cartItems: [newItem],
    });

    message = "Item added successfully";
  } else {
    let cartItems = userCart.cartItems || [];

    let existingItem = cartItems.find((item) => {
      return item.product._id.equals(productId);
    });

    if (existingItem) {
      existingItem.quantity = quantity;
      message = "Updated item quantity successfully";
    } else {
      cartItems.push(newItem);
      message = "Item added successfully";
    }

    await userCart.save();
  }

  await userCart.populate({
    path: "cartItems.product",
    select: "name description price mainImage",
  });

  let userCartwithTotals = null;
  if (userCart !== null) {
    // Calculate totals
    userCartwithTotals = await calculateCartTotals({
      cart: userCart,
    });
  }

  return { userCart: userCartwithTotals, message };
}

export async function removeProductFromCart(userCart, productId, userId) {
  const cartItems = userCart.cartItems;

  const index = cartItems.findIndex((item) => item.product.equals(productId));

  if (index !== -1) {
    cartItems.splice(index, 1);
  } else {
    throw new ApiError(404, "Product not found in cart");
  }

  let remaininigCartItems = null;
  if (userCart !== null) {
    // Calculate totals
    remaininigCartItems = await calculateCartTotals({ cart: userCart });
  }

  // const remaininigCartItems = await Cart.findOne({
  //   owner: userId,
  // }).populate({
  //   path: "cartItems.product",
  //   select: "name description price mainImage",
  // });

  return remaininigCartItems;
}

// Calculate Delivery Date
export function calculateDeliveryDate({ pincode, product }) {
  const today = new Date();

  let shippingDays;

  if (pincode.startsWith("14")) {
    shippingDays = 2; // local
  } else {
    shippingDays = 5; // remote
  }

  const processingDays = product.processingTime || 1;

  const totalDays = shippingDays + processingDays;

  const deliveryDate = new Date(today);
  deliveryDate.setDate(today.getDate() + totalDays);

  return deliveryDate;
}

// Calculate Cart Totals
export const calculateCartTotals = async ({ cart, coupon = null }) => {
  // 1. subtotal
  let subtotal = 0;

  for (const item of cart.cartItems) {
    subtotal += item.product.price * item.quantity;
    console.log("Item Price: ", item.product.price);
    console.log("Item Quantity: ", item.quantity);
  }

  // 2. coupon discount
  let discountAmount = 0;

  if (coupon) {
    // FREE_SHIPPING handled separately
    if (coupon.discount_type !== "FREE_SHIPPING") {
      discountAmount = await applyCoupon(coupon, subtotal);
    }
  }

  // 3. discounted total
  const discountedTotal = Math.max(subtotal - discountAmount, 0);

  // 4. tax
  let taxAmount = 50;

  for (const item of cart.cartItems) {
    const itemTax = item.taxRate || 0;

    taxAmount += item.product.price * item.quantity * (itemTax / 100);
    console.log("Item price: ", item.product.price);
    console.log("Item quantity: ", item.quantity);
  }

  // 5. shipping
  let shippingCharge = 0;

  if (discountedTotal < 5000) {
    shippingCharge = 100;
  }

  // FREE_SHIPPING coupon
  if (coupon && coupon.discount_type === "FREE_SHIPPING") {
    shippingCharge = 0;
  }

  // 6. COD charge
  let deliveryCharge = 0;

  // 7. final total
  const grandTotal =
    discountedTotal + taxAmount + shippingCharge + deliveryCharge;

  // 8. save values into cart
  cart.subTotal = subtotal;
  cart.discountAmount = discountAmount;
  cart.discountedTotal = discountedTotal;
  cart.taxAmount = taxAmount;
  cart.shippingCharges = shippingCharge;
  cart.deliveryCharges = deliveryCharge;
  cart.finalTotal = grandTotal;

  await cart.save();
  console.log("Updated Cart: ", cart);
  return cart;
};

// Decrease the stock when user place Order
export const decreaseProductStock = async (orderItems) => {
  for (const item of orderItems) {
    const product = await Product.findById(item.product);

    if (!product) {
      throw new ApiError(404, `Product not found`);
    }

    // Check stock
    if (product.stock < item.quantity) {
      throw new ApiError(400, `${product.name} is out of stock`);
    }

    // Decrease stock
    product.stock -= item.quantity;

    await product.save();
  }

  return true;
};
