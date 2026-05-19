import Router from "express";
import {
  createCoupon,
  getAvailableCoupons,
  applyCouponToCart,
  updateCoupon,
  removeCouponFromCart,
  deleteCoupon,
  updateCouponStatus,
  getAllCoupons,
} from "../controllers/coupon.controller.js";
import {
  ensureAuthenticated,
  restrictToRole,
} from "../middlewares/auth.middleware.js";
import {
  validateCreateCoupon,
  validateUpdateCoupon,
} from "../middlewares/validation.middleware.js";

const router = Router();

const adminRestrictMiddleware = restrictToRole("ADMIN");

router
  .route("/")
  .post(
    ensureAuthenticated,
    adminRestrictMiddleware,
    validateCreateCoupon,
    createCoupon
  );

router
  .route("/")
  .get(ensureAuthenticated, adminRestrictMiddleware, getAllCoupons);

router
  .route("/customer/available")
  .get(ensureAuthenticated, getAvailableCoupons);

router.route("/customer/apply").post(ensureAuthenticated, applyCouponToCart);

router.route("/customer/remove").patch(ensureAuthenticated, removeCouponFromCart);

router
  .route("/:couponId")
  .patch(
    ensureAuthenticated,
    adminRestrictMiddleware,
    validateUpdateCoupon,
    updateCoupon
  );

router
  .route("/status/:couponId")
  .patch(ensureAuthenticated, adminRestrictMiddleware, updateCouponStatus);

router
  .route("/:couponId")
  .delete(ensureAuthenticated, adminRestrictMiddleware, deleteCoupon);

export default router;
