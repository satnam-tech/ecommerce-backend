import { Router } from "express";
import {
  registerUser,
  verifyUserOtp,
  resendUserOtp,
  loginUser,
  loginWithOtp,
  verifyLoginOtp,
  logoutUser,
  refreshAccessToken,
} from "../controllers/auth.controller.js";
import { ensureAuthenticated } from "../middlewares/auth.middleware.js";
import { validateRegisterUser } from "../middlewares/validation.middleware.js";

const router = Router();

router.route("/register").post(validateRegisterUser, registerUser);
router.route("/otp-verify").post(verifyUserOtp);
router.route("/resend-otp").post(resendUserOtp);
router.route("/login").post(loginUser);
router.route("/login-otp").post(loginWithOtp);
router.route("/verify-login-otp").post(verifyLoginOtp);
router.route("/logout").post(ensureAuthenticated, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
export default router;
