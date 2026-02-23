import { client } from "../config/twilio.js";

export const sendOtp = async (mobile) => {
  try {
    const formattedMobile = mobile.startsWith("+") ? mobile : `+91${mobile}`;

    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({
        channel: "sms",
        to: formattedMobile,
      });

    return verification;
  } catch (error) {
    console.log("Error sending OTP:", error.message);

    throw new ApiError(
      error.status || 500,
      error.message || "OTP sending failed"
    );
  }
};

export const verifyOtp = async (mobile, code) => {
  try {
    const formattedMobile = mobile.startsWith("+") ? mobile : `+91${mobile}`;

    const result = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({
        to: formattedMobile,
        code: code,
      });

    return result;
  } catch (error) {
    console.error("Verify OTP Error:", error.message);

    throw new ApiError(
      error.status || 500,
      error.message || "OTP verification failed"
    );
  }
};
