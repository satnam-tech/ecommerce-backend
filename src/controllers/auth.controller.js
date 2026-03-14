import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import {
  sendOtp,
  verifyOtp,
  canResendOtp,
} from "../services/otp.service.js";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

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

const registerUser = asyncHandler(async (req, res) => {
  /* 
    1) Get user data (fullName, phone, password)
    2) Validate Data (All required, empty, missing)
    3) Check user already exists or not: phone
    4) Send Otp
    5) Create User object - create entry in db
    6) check for creation
    7) return res
    */

  const { fullName, phone, password } = req.body;

  console.log(phone, password);

  if ([fullName, phone, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({ phone });

  if (existedUser) {
    throw new ApiError(409, "User already exists");
  }

  const result = await sendOtp(phone);

  if (result?.status !== "pending")
    throw new ApiError(500, "Otp sending failed");

  const now = new Date();

  const user = await User.create({
    fullName,
    phone,
    password,
    lastOtpSent: now,
  });

  console.log("USER: ", user);

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  console.log("CREATED USE: ", createdUser);

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        createdUser,
        "User registered successfully and OTP sent"
      )
    );
});

const verifyUserOtp = asyncHandler(async (req, res) => {
  const { phone, code } = req.body;

  if (!phone || !code) {
    throw new ApiError(400, "phone and otp are required");
  }

  const user = await User.findOne({ phone });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.isVerified) {
    const verify = await verifyOtp(phone, code);

    if (verify?.status !== "approved") throw new ApiError(400, "Invalid OPT");

    user.isVerified = true;
    await user.save({ validateBeforeSave: false });
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const verifiedUser = await User.findById(user._id).select(
    "-password -accessToken -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: verifiedUser,
          accessToken,
          refreshToken,
        },
        "OTP verified successfully"
      )
    );
});

const resendUserOtp = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  console.log("BODY: ", phone);

  if (!phone) {
    throw new ApiError(400, "phone field are required");
  }

  const result = await canResendOtp(phone);

  console.log(result);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "OTP resent successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  /*
    1) Get login data (phone, password)
    2) Authenticate user (find by phone And Compare password)
    3) Set cookie
    4) return login user
    */

  const { phone, password } = req.body;

  if (!phone && !password)
    throw new ApiError(400, "phone and password are required");

  const user = await User.findOne({ phone });

  if (!user) throw new ApiError(404, "User does not exists");

  if (user?.isVerified !== true)
    throw new ApiError(
      401,
      "unauthorized request, user not verified, login with otp"
    );

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) throw new ApiError(401, "Invalid user credentials");

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully"
      )
    );
});

const loginWithOtp = asyncHandler(async (req, res) => {
  /*
  1) Check user exists or not
  2) Send otp 
  3) return response
  */

  const { phone } = req.body;

  const user = await User.findOne({ phone });

  if (!user) throw new ApiError(404, "User does not exists");

  const result = await sendOtp(phone);

  if (result?.status !== "pending")
    throw new ApiError(500, "Otp sending failed");

  const now = new Date();

  user.lastOtpSent = now;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, phone, "OTP sent successfully"));
});

const verifyLoginOtp = asyncHandler(async (req, res) => {
  const { phone, code } = req.body;

  if (!phone && !code) throw new ApiError(400, "Phone and code are required");

  const user = await User.findOne({ phone }).select("-password -refreshToken");

  if (!user) throw new ApiError(404, "User does not exists");

  const verify = await verifyOtp(phone, code);

  console.log("VERIFY OTP: ", verify);

  if (verify?.status !== "approved") throw new ApiError(400, "Invalid OPT");

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "Login successful via OTP"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const logoutUser = await User.findByIdAndUpdate(
    req.user._id,

    {
      $unset: {
        refreshToken: 1, // removes the field from document
      },
    },

    {
      returnDocument: "after",
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) throw new ApiError(401, "unauthorized request");

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) throw new ApiError(401, "Invalid refresh token");

    if (incomingRefreshToken !== user?.refreshToken)
      throw new ApiError(401, "Refresh token is expired or used");

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

export {
  registerUser,
  verifyUserOtp,
  resendUserOtp,
  loginUser,
  loginWithOtp,
  verifyLoginOtp,
  logoutUser,
  refreshAccessToken,
};
