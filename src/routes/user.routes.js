import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  currentUser,
  updateUserRole,
  updateUserProfile,
  updateUserPhone,
  updatePhoneVerify,
  getUserOrders,
  getUserAddresses,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress
} from "../controllers/user.controller.js";
import { checkAdmin } from "../middlewares/admin.middleware.js";

const router = Router();

router.route("/current-user").get(verifyJWT, currentUser);
router.route("/:id/role").post(checkAdmin, updateUserRole);
router.route("/update-account").patch(verifyJWT, updateUserProfile);
router.route("/update-phone").patch(verifyJWT, updateUserPhone);
router.route("/update-phone/verify").patch(verifyJWT, updatePhoneVerify);
router.route("/orders").get(verifyJWT, getUserOrders);
router.route("/addresses").get(verifyJWT, getUserAddresses);
router.route("/addresses").post(verifyJWT, addUserAddress);
router.route("/addresses/:addressId").patch(verifyJWT, updateUserAddress);
router.route("/addresses/:addressId").delete(verifyJWT, deleteUserAddress);

export default router;
