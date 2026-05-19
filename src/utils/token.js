import { getUserById } from "../services/user.service.js";
import jwt from "jsonwebtoken";
import { ApiError } from "./ApiError.js";

export const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await getUserById(userId);

    if (!user) throw new ApiError(404, "User not found");

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    
    return { accessToken, refreshToken };
  } catch (error) {
    console.log("ERROR WHILE GENERATING TOKENS: ", error);
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

export const validateUserToken =  (token, isRefreshToken) => {
  try {
    const secret = isRefreshToken
      ? process.env.REFRESH_TOKEN_SECRET
      : process.env.ACCESS_TOKEN_SECRET;

    if (!secret) {
      throw new Error("JWT secret not defined");
    }

    const payload = jwt.verify(token, secret);

    return payload;
  } catch (error) {
    console.log("ERROR WHILE VERIFYING TOKEN: ", error);
    throw new ApiError(500, "Something went wrong while verify user token");
  }
};
