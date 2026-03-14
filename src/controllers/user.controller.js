import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Address } from "../models/address.model.js";
import { ApiError } from "../utils/ApiError.js";
import { sendOtp, verifyOtp } from "../services/otp.service.js";

const currentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { userProfile: req?.user },
        "Current user fetched successfully"
      )
    );
});

const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const { id } = req.params;

  if (!role && role !== "admin")
    throw new ApiError(400, "Invalid role or role is required");

  const user = await User.findById(id);

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

  const user = await User.findByIdAndUpdate(
    req?.user._id,
    {
      $set: {
        fullName,
      },
    },
    { returnDocument: "after" }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User profile updated successfully"));
});

const updateUserPhone = asyncHandler(async (req, res) => {
  const { newPhone } = req.body;

  // Validate number is correct, valid format or not (Later: joi or express validator)

  if (!newPhone) throw new ApiError(400, "phone number is required");

  const result = await sendOtp(newPhone);

  if (result?.status !== "pending")
    throw new ApiError(500, "Otp sending failed");

  await User.findByIdAndUpdate(req?.user._id, {
    $set: {
      lastOtpSent: new Date(),
    },
  });

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

  const user = await User.findByIdAndUpdate(
    req?.user._id,
    {
      $set: {
        phone: newPhone,
      },
    },
    { returnDocument: "after" }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User Phone updated successfully"));
});

// Later test when we writing Order creation controller
const getUserOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const orders = await Order.find({ owner: req?.user._id })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("addressId", "-fullAddress") // 2nd parameter: hide sensitive fields, Use minus - inpopulate.
    .populate("owner", "fullName phone") // 2nd parameter: we want only some user fields
    .skip((page - 1) * limit)
    .limit(limit);

  if (!orders) throw new ApiError(404, "No orders found with the provided ID.");

  // adding totalorderitems in order document
  const finalOrder = await Promise.all(
    orders.map(async (order) => {
      const totalOrderItems = await OrderItem.countDocuments({
        order: order._id,
      });

      return {
        ...order.toObject(),
        totalOrderItems,
      };
    })
  );

  const totalOrders = await Order.countDocuments({
    owner: req?.user._id,
  });

  const totalPages = Math.ceil(totalOrders / limit);

  return res.status(200).json(
    new ApiResponse(200, {
      orders: finalOrder,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      page,
      limit,
      totalOrders,
      totalPages,
    })
  );

  /* Later we using Mongo Aggregation pipeline beacuse its more efficient and execute in one pipeline Not in multiple queries like populate chain:
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

  const addresses = await Address.find({ owner: req?.user._id })
    .skip((page - 1) * limit)
    .limit(limit);

  console.log(addresses);

  if (!addresses)
    throw new ApiError(404, "No Addresses found with the provided ID.");

  const totalAddresses = await Address.countDocuments({
    owner: req?.user._id,
  });

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
  const { fullName, phone, addressLine1, city, state, pincode, country } =
    req.body.address;

  // Later validate data using joe or express validator

  if (
    [fullName, phone, addressLine1, city, state, pincode, country].some(
      (field) => field?.trim() === ""
    )
  )
    throw new ApiError(400, "All fields are required");

  const address = await Address.create({
    ...req.body.address,
    owner: req?.user._id,
  });

  await address.save({ validateBeforeSave: false });

  return res
    .status(201)
    .json(new ApiResponse(201, address, "Address created successfully"));
});

const updateUserAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;

  if (!addressId) throw new ApiError(400, "Address id is required");

  const {
    fullName,
    phone,
    addressLine1,
    addressLine2,
    landmark,
    city,
    state,
    pincode,
    country,
  } = req.body.address;

  const updates = {
    fullName,
    phone,
    addressLine1,
    addressLine2,
    landmark,
    city,
    state,
    pincode,
    country,
  };

  Object.keys(updates).forEach((key) => {
    if (updates[key] === undefined || updates[key] === "") {
      delete updates[key];
    }
  });

  const updatedAddress = await Address.findByIdAndUpdate(
    addressId,
    {
      $set: updates,
    },
    { returnDocument: "after", runValidators: false }
  );

  if (!updatedAddress)
    throw new ApiError(404, "No Address found with the provided ID.");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedAddress, "Address updated successfully"));
});

const deleteUserAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;

  if (!addressId) throw new ApiError(400, "Address id is required");

  const deletedAddress = await Address.findByIdAndDelete(addressId);

  if (!deletedAddress)
    throw new ApiError(404, "No Address found with the provided ID.");

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
