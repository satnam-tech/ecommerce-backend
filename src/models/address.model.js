import mongoose, {Schema} from "mongoose";

const addressSchema = new Schema({
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },

    fullName: {
        type: String,
        trim: true,
        required: [true, "Fullname is required"],
    },

    phone: {
        type: Number,
        unique: true,
        required: [true, "Phone number is required"],
    },

    addressLine1: {
        type: String,
        trim: true,
        required: [true, "AddressLine1 is required"],
    },

    addressLine2: {
        type: String,
        trim: true,
    },

    city: {
        type: String,
        trim: true,
        required: [true, "City is required"],
    },

    state: {
        type: String,
        trim: true,
        required: [true, "State is required"],
    },

    pincode: {
        type: String,
        trim: true,
        required: [true, "Pincode is required"],
    },

    country: {
        type: String,
        trim: true,
        required: [true, "Country is required"],
    },

    landmark: {
        type: String,
        trim: true,
    }

    // fullAddress filed
})

export const Address = mongoose.model("Address", addressSchema)