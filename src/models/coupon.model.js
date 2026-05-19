import mongoose, {Schema} from "mongoose";

const couponSchema = new Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true
        },

        discount_type: {
            type: String,
            required: true,
            enum: ["PERCENTAGE", "FIXED", "FREE_SHIPPING"]
        },

        minimumCartValue: {
            type: Number,
            default: 0
        },

        discount_value: {
            type: Number,
            required: true,
            min: 0
        },

        is_active: {
            type: Boolean,
            default: true
        },

        startsAt: {
            type: Date,
            required: true
        },

        expirationDate: {
            type: Date,
            required: true
        }
    },
    {
        timestamps: true
    }
);

export const Coupon = mongoose.model("Coupon", couponSchema);               