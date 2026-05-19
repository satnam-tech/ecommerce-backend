import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateUserToken } from "../utils/token.js";

export const authenticationMiddleware = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    const authHeader = req.header("Authorization");
    
    if (!token) return next();

    if (authHeader && !authHeader.startsWith("Bearer"))
      throw new ApiError(400, "Authorization header must start with Bearer");

    const payload = validateUserToken(token);

    req.user = payload;

    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Unauthorized request");
  }
});

export const ensureAuthenticated = (req, res, next) => {
  if (!req.user && !req.user?._id) {
    throw new ApiError(401, "You must be logged in to access this resource");
  }

  next();
};

export const restrictToRole = function (role) {
  return function (req, res, next) {
    if (req.user.role !== role) {
      throw new ApiError(401, "You are not authorized to access this resource");
    }

    next();
  };
};
