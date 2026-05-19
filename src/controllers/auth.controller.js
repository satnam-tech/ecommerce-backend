import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  getUserByPhone,
  createUser,
  getUserById,
  logoutAUser,
} from "../services/user.service.js";
import { sendOtp, verifyOtp, canResendOtp } from "../services/otp.service.js";
import {
  generateAccessAndRefreshTokens,
  validateUserToken,
} from "../utils/token.js";

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

  const existedUser = await getUserByPhone(phone);

  if (existedUser) {
    throw new ApiError(409, "User already exists");
  }

  const result = await sendOtp(phone);

  if (result?.status !== "pending")
    throw new ApiError(500, "Otp sending failed");

  const createdUser = await createUser({
    fullName,
    phone,
    password,
    lastOtpSent: new Date(),
  });

  console.log("USER: ", createdUser);

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

  const user = await getUserByPhone(phone);

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

  const verifiedUser = await getUserById(user._id);

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

  const user = await getUserByPhone(phone);

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

  const loggedInUser = await getUserById(user._id, "-password");

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

  const user = await getUserByPhone(phone);

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

  const user = await getUserByPhone(phone);

  if (!user) throw new ApiError(404, "User does not exists");

  const verify = await verifyOtp(phone, code);

  console.log("VERIFY OTP: ", verify);

  if (verify?.status !== "approved") throw new ApiError(400, "Invalid OPT");

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await getUserById(user._id);

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
  const logoutUser = await logoutAUser(req?.user._id);

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
    const decodedToken = await validateUserToken(
      incomingRefreshToken,
      "RefreshToken"
    );

    const user = await getUserById(decodedToken?._id);

    if (!user) throw new ApiError(401, "Invalid refresh token");

    if (incomingRefreshToken !== user?.refreshToken)
      throw new ApiError(401, "Refresh token is expired or used");

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken: newRefreshToken } =
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
    console.log("ERROR: ", error);
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
