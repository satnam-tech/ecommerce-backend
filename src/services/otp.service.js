import { client } from "../config/twilio.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";

const formatPhone = (mobile) => {
  const phone = mobile.replace(/\D/g, "");
  return `+91${phone.slice(-10)}`;
};

export const sendOtp = async (mobile) => {
  try {
    const formattedMobile = formatPhone(mobile);

    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({
        channel: "sms",
        to: formattedMobile,
      });

    return verification;
  } catch (error) {
    console.log(error);
    console.error("Sending Otp failed, Error:", error.message);

    throw new ApiError(
      error.status || 500,
      error.message || "Sending Otp failed"
    );
  }
};

export const verifyOtp = async (mobile, code) => {
  try {
    const formattedMobile = formatPhone(mobile);

    const result = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({
        code: code,
        to: formattedMobile,
      });

    return result;
  } catch (error) {
    console.error("Verify Otp failed, Error:", error);
    console.error("Verify Otp failed, Error:", error?.code);

    const message = handleOtpError(error);

    throw new ApiError(
      error?.status || 500,
      message || "Verify Otp failed"
    );
  }
};

export const handleOtpError = (err) => {
  switch (err?.code) {
    case 60200:
      return "Invalid OTP entered.";

    case 60202:
      return "Too many wrong OTP attempts. Please try again later.";

    case 60203:
      return "OTP expired. Please request a new OTP.";

    case 60204:
      return "Maximum OTP verification attempts reached.";

    case 20404:
      return "Verfication Check not found or otp expired.";
    
    case 20429:
      return "Too many OTP requests. Please wait before trying again.";

    case 21614:
      return "Invalid phone number.";

    default:
      return "OTP verification failed. Please try again.";
  }
};

export const canResendOtp = async (mobile) => {
  const user = await User.findOne({ phone: mobile });

  console.log("USER: ", user);

  if (!user) throw new ApiError(400, "User don't exists");

  const now = new Date();

  const diffInSeconds = (now - user.lastOtpSent) / 1000;

  if (diffInSeconds < 60) {
    throw new ApiError(429, "Please wait 60s to send OTP again");
  }

  // Resend OTP
  const result = await sendOtp(mobile);

  if (result?.status !== "pending")
    throw new ApiError(500, "Resend OTP failed");

  user.lastOtpSent = now;
  await user.save();

  return result;
};

/*
now = current time
lastSent = user.lastOtpSentAt

IF lastSent exists AND now - lastSent < 60 seconds
   → return false
ELSE
   → update lastOtpSentAt = now
   → return true
   
*/
