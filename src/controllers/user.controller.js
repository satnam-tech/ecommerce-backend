import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { sendOtp, verifyOtp } from "../services/otp.service.js";
import { getUserById, updateUserById } from "../services/user.service.js";
import { isValidObjectId } from "mongoose";
import {
  getAllUserOrders,
  getTotalOrdersCount,
} from "../services/order.service.js";
import {
  CreateAddress,
  deleteAddressById,
  getAllAddresses,
  getTotalAddressesCount,
  updateAddressById,
} from "../services/address.service.js";

const currentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { userProfile: req.user },
        "Current user fetched successfully"
      )
    );
});

const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const { id } = req.params;

  if (!isValidObjectId(id)) throw new ApiError(400, "Invalid user id");

  if (!role && role !== "admin")
    throw new ApiError(400, "Invalid role or role is required");

  const user = await getUserById(id);

  if (!user) throw new ApiError(404, "User does not exists");

  user.role = role;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        id: user._id,
        role: user.role,
      },
      "User role updated successfully"
    )
  );
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const { fullName } = req.body;

  if (!fullName) throw new ApiError(400, "fullName is required");

  const user = await updateUserById(req?.user._id, { fullName });

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User profile updated successfully"));
});

const updateUserPhone = asyncHandler(async (req, res) => {
  const { newPhone } = req.body;

  if (!newPhone) throw new ApiError(400, "phone number is required");

  const result = await sendOtp(newPhone);

  if (result?.status !== "pending")
    throw new ApiError(500, "Otp sending failed");

  await updateUserById(req?.user._id, { lastOtpSent: new Date() });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "OTP successfully sent on phone"));
});

const updatePhoneVerify = asyncHandler(async (req, res) => {
  const { newPhone, code } = req.body;

  // Validate number is correct, valid format or not (Later: joi or express validator)

  if (!(newPhone || code))
    throw new ApiError(400, "phone and code are required");

  const verify = await verifyOtp(newPhone, code);

  if (verify?.status !== "approved") throw new ApiError(400, "Invalid OPT");

  const user = await updateUserById(req?.user._id, { phone: newPhone });

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User Phone updated successfully"));
});

// Later test when we writing Order creation controller: DONE tested: 05-04-2026
const getUserOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const orders = await getAllUserOrders(req?.user._id, page, limit);

  if (!orders) throw new ApiError(404, "No orders found with the provided ID.");

  const totalOrders = await getTotalOrdersCount(req?.user._id);

  const totalPages = Math.ceil(totalOrders / limit);

  return res.status(200).json(
    new ApiResponse(200, {
      orders,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      page,
      limit,
      totalOrders,
      totalPages,
    })
  );

  /* Later we using Mongo Aggregation pipeline beacuse its more efficient and execute in one pipeline Not in multiple queries like populate chain: DONE LEAR MONGO AGGREGATION PIPELINE: 10-04-2026 & IMPLEMENTD 26-04-2026
  {
  "data": {
    "page": 1,
    "limit": 10,
    "totalOrders": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false,
    "nextPage": null,
    "prevPage": null,
    "orders": [
      {
        "_id": "...",
        "address": { ... },
        "customer": { ... },
        "orderPrice": 1014,
        "discountedOrderPrice": 1014,
        "paymentProvider": "PAYPAL",
        "status": "CANCELLED",
        "createdAt": "..."
      }
    ]
  },
  "message": "Orders fetched successfully",
  "statusCode": 200,
  "success": true
}
  */
});

const getUserAddresses = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const addresses = await getAllAddresses(req?.user._id, page, limit);

  console.log(addresses);

  const totalAddresses = await getTotalAddressesCount(req?.user._id);

  const totalPages = Math.ceil(totalAddresses / limit);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        addresses: addresses,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        page,
        limit,
        totalAddresses,
        totalPages,
      },
      "Addresses fetched successfully"
    )
  );
});

const addUserAddress = asyncHandler(async (req, res) => {
  const address = await CreateAddress(req?.user._id, req.body.address);

  return res
    .status(201)
    .json(new ApiResponse(201, address, "Address created successfully"));
});

const updateUserAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;

  const updatedAddress = await updateAddressById(addressId, req.body.address);

  return res
    .status(200)
    .json(new ApiResponse(200, updatedAddress, "Address updated successfully"));
});

const deleteUserAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;

  const deletedAddress = await deleteAddressById(addressId);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        deletedAddress,
      },
      "Address deleted successfully"
    )
  );
});

export {
  currentUser,
  updateUserRole,
  updateUserProfile,
  updateUserPhone,
  updatePhoneVerify,
  getUserOrders,
  getUserAddresses,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
};
