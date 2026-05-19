import { Router } from "express";
import { ensureAuthenticated, restrictToRole } from "../middlewares/auth.middleware.js";
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
  deleteUserAddress,
} from "../controllers/user.controller.js";
import {
  validateCreateAddress,
  validateUpdateAddress,
} from "../middlewares/validation.middleware.js";

const router = Router();

const adminRestrictMiddleware = restrictToRole("ADMIN");

router.route("/current-user").get(ensureAuthenticated, currentUser);
router.route("/:id/role").post(adminRestrictMiddleware, updateUserRole);
router.route("/update-account").patch(ensureAuthenticated, updateUserProfile);
router.route("/update-phone").patch(ensureAuthenticated, updateUserPhone);
router.route("/update-phone/verify").patch(ensureAuthenticated, updatePhoneVerify);
router.route("/orders").get(ensureAuthenticated, getUserOrders);
router.route("/addresses").get(ensureAuthenticated, getUserAddresses);
router
  .route("/addresses")
  .post(ensureAuthenticated, validateCreateAddress, addUserAddress);
router
  .route("/addresses/:addressId")
  .patch(ensureAuthenticated, validateUpdateAddress, updateUserAddress);
router.route("/addresses/:addressId").delete(ensureAuthenticated, deleteUserAddress);

export default router;
