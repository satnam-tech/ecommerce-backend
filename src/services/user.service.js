import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";

export async function getUserByPhone(phone) {
  const existingUser = await User.findOne({ phone });

  return existingUser;
}

export async function getUserById(id, select) {
  let user;
  if (select) {
    user = await User.findById(id).select(select);
  } else {
    user = await User.findById(id);
  }

  return user;
}

export async function createUser(userPayload) {
  try {
    const user = await User.create(userPayload);

    // const createdUser = await User.findById(user._id);

    return user;
  } catch (error) {
    console.log("User registeration failed: ", error);
    throw new ApiError(500, "Something went wrong while registering the user");
  }
}

export async function logoutAUser(userId) {
  try {
    await User.findByIdAndUpdate(userId, {
      $unset: {
        refreshToken: 1, // removes the field from document
      },
    });
  } catch (error) {
    console.log("Logout failed: ", error);
    throw new ApiError(500, "Something went wrong while Logout the user");
  }
}

export async function updateUserById(id, payload) {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        $set: payload,
      },
      { returnDocument: "after" }
    );

    return updatedUser;
  } catch (error) {
    console.log("Update User failed: ", error);
    throw new ApiError(500, "Something went wrong while Updating the user");
  }
}
