import Joi from "joi";
import phoneNumberExtension from "joi-phone-number";
// const phoneNumberExtension = require("joi-phone-number");

// Instead of writing multiple if-else statements for validating data,
// you can use the Joi package, which describes the required data and validates it from the client side.
const customJoi = Joi.extend(phoneNumberExtension);

export const registerPostRequestBodySchema = Joi.object({
  fullName: Joi.string().required(),
  phone: customJoi.string().phoneNumber({ defaultCountry: "IN" }).required(),
  password: Joi.string().min(10).required(),
});

export const createAddressPostRequestBodySchema = Joi.object({
  address: Joi.object({
    fullName: Joi.string().required(),
    phone: customJoi.string().phoneNumber({ defaultCountry: "IN" }).required(),
    addressLine1: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    pincode: Joi.string()
      .length(6)
      .pattern(/^[1-9][0-9]{5}$/) // Cannot start with 0
      .required(),
    country: Joi.string().required(),

    addressLine2: Joi.string(),
    landmark: Joi.string(),
  }).required(),
});

export const updateAddressPatchRequestBodySchema = Joi.object({
  address: Joi.object({
    fullName: Joi.string(),
    phone: customJoi.string().phoneNumber({ defaultCountry: "IN" }),
    addressLine1: Joi.string(),
    city: Joi.string(),
    state: Joi.string(),
    pincode: Joi.string()
      .length(6)
      .pattern(/^[1-9][0-9]{5}$/), // Cannot start with 0
    country: Joi.string(),

    addressLine2: Joi.string(),
    landmark: Joi.string(),
  })
    .min(1)
    .required(),
});

export const createProductPostRequestBodySchema = Joi.object({
  product: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
    price: Joi.number().min(1).required(),
    brand: Joi.string(),
    stock: Joi.number().required(),
    categoryId: Joi.string().required(),
  }).required(),
});

export const updateProductPatchRequestBodySchema = Joi.object({
  product: Joi.object({
    name: Joi.string(),
    description: Joi.string(),
    price: Joi.number().min(1),
    brand: Joi.string(),
    stock: Joi.number(),
    categoryId: Joi.string(),
  })
    .min(1)
    .required(),
});

export const placeOrderPostRequestBodySchema = Joi.object({
  addressId: Joi.string().required(),
  paymentMethod: Joi.string().required(),
});

export const updateCategoryPatchRequestBodySchema = Joi.object({
  category: Joi.object({
    name: Joi.string(),
    description: Joi.string(),
  })
    .min(1)
    .required(),
});

export const createCouponPostRequestBodySchema = Joi.object({
  code: Joi.string().required(),
  discount_type: Joi.string().valid("PERCENTAGE", "FIXED", "FREE_SHIPPING").required(),
  minimum_cart_value: Joi.number().min(0),
  discount_value: Joi.number().min(0).required(),
  startsAt: Joi.date().required(),
  expirationDate: Joi.date().required(),
});

export const updateCouponPatchRequestBodySchema = Joi.object({
  coupon: Joi.object({
    code: Joi.string(),
    discount_value: Joi.number().min(0),
    discount_type: Joi.string().valid("PERCENTAGE", "FIXED", "FREE_SHIPPING"),
    minimum_cart_value: Joi.number().min(0),
    startsAt: Joi.date(),
    expirationDate: Joi.date(),
  })
    .min(1)
    .required(),
});