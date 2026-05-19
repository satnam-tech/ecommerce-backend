import {
  createAddressPostRequestBodySchema,
  createCouponPostRequestBodySchema,
  createProductPostRequestBodySchema,
  placeOrderPostRequestBodySchema,
  registerPostRequestBodySchema,
  updateAddressPatchRequestBodySchema,
  updateCategoryPatchRequestBodySchema,
  updateCouponPatchRequestBodySchema,
  updateProductPatchRequestBodySchema,
} from "../schema.js";
import { ApiError } from "../utils/ApiError.js";

// Joe Validating middleware: which describes the required data and validates it from the client side.
export const validateRegisterUser = (req, res, next) => {
  let { error } = registerPostRequestBodySchema.validate(req.body);
  console.log(req.body);
  if (error) {
    let errMsg = error.details.map((el) => el.message);
    console.log(error.details);
    throw new ApiError(400, errMsg);
  } else {
    next();
  }
};

export const validateCreateAddress = (req, res, next) => {
  let { error } = createAddressPostRequestBodySchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map((el) => el.message);
    console.log(error.details);
    throw new ApiError(400, errMsg);
  } else {
    next();
  }
};

export const validateUpdateAddress = (req, res, next) => {
  let { error } = updateAddressPatchRequestBodySchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map((el) => el.message);
    console.log(error.details);
    throw new ApiError(400, errMsg);
  } else {
    next();
  }
};

export const validateCreateProduct = (req, res, next) => {
  let { error } = createProductPostRequestBodySchema.validate(req.body);

  console.log("Validation Error: ", error);
  if (error) {
    let errMsg = error.details.map((el) => el.message);
    throw new ApiError(400, errMsg);
  } else {
    if (
      !req.files ||
      !Array.isArray(req.files.mainImage) ||
      !req.files.mainImage.length === 0
    ) {
      throw new ApiError(400, "Product main image is required");
    }

    if (
      !req.files ||
      !Array.isArray(req.files.subImages) ||
      !req.files.subImages.length === 0
    ) {
      throw new ApiError(400, "Sub images are required");
    }

    const subImagesPath = req.files?.subImages || [];

    if (subImagesPath.length < 2) {
      throw new ApiError(400, "At least 2 sub images are required");
    }

    next();
  }
};

export const validateUpdateProduct = (req, res, next) => {
  let { error } = updateProductPatchRequestBodySchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map((el) => el.message);
    console.log(error.details);
    throw new ApiError(400, errMsg);
  } else {
    next();
  }
};

export const validateUpdateCategory = (req, res, next) => {
  let { error } = updateCategoryPatchRequestBodySchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map((el) => el.message);
    console.log(error.details);
    throw new ApiError(400, errMsg);
  } else {
    next();
  }
};

export const validatePlaceOrder = (req, res, next) => {
  let { error } = placeOrderPostRequestBodySchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map((el) => el.message);
    console.log(error.details);
    throw new ApiError(400, errMsg);
  } else {
    next();
  }
};

export const validateCreateCoupon = (req, res, next) => {
  let { error } = createCouponPostRequestBodySchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map((el) => el.message);
    console.log(error.details);
    throw new ApiError(400, errMsg);
  } else {
    next();
  }
};

export const validateUpdateCoupon = (req, res, next) => {
  let { error } = updateCouponPatchRequestBodySchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map((el) => el.message);
    console.log(error.details);
    throw new ApiError(400, errMsg);
  } else {
    next();
  }
};