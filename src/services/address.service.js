import { Address } from "../models/address.model.js";
import { ApiError } from "../utils/ApiError.js";

export async function getAllAddresses(userId, page, limit) {
  try {
    const addresses = await Address.find({ owner: userId })
      .skip((page - 1) * limit)
      .limit(limit);

    if (!addresses)
      throw new ApiError(404, "No Addresses found with the provided ID.");

    return addresses;
  } catch (error) {
    console.log("Get User Addresses failed: ", error);
    throw new ApiError(
      500,
      "Something went wrong while Fetching the user Addresses"
    );
  }
}

export async function getTotalAddressesCount(userId) {
  const totalAddresses = await Address.countDocuments({
    owner: userId,
  });

  return totalAddresses;
}

export async function CreateAddress(userId, addressData) {
  try {
    const address = await Address.create({
      ...addressData,
      owner: userId,
    });

    return address;
  } catch (error) {
    console.log("Create User Address failed: ", error);
    throw new ApiError(
      500,
      "Something went wrong while Creating the user Addresses"
    );
  }
}

export async function updateAddressById(addressId, updateData) {
  try {
    const updatedAddress = await Address.findByIdAndUpdate(
      addressId,
      {
        $set: updateData,
      },
      { returnDocument: "after", runValidators: false }
    );

    if (!updatedAddress)
      throw new ApiError(404, "No Address found with the provided ID.");

    return updatedAddress;
  } catch (error) {
    console.log("Update User Address failed: ", error);
    throw new ApiError(
      500,
      "Something went wrong while Updating the user Addresses"
    );
  }
}

export async function deleteAddressById(addressId) {
  try {
    const deletedAddress = await Address.findByIdAndDelete(addressId);

    if (!deletedAddress) {
      throw new ApiError(404, "No Address found with the provided ID.");
    }
    return deletedAddress;
  } catch (error) {
    console.log("Update User Address failed: ", error);
    throw new ApiError(
      500,
      "Something went wrong while Updating the user Addresses"
    );
  }
}
