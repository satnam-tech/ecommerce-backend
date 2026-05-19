import Router from "express";
import {
  createOrder,
  downloadInvoice,
  getOrderDetails,
  placeOrder,
} from "../controllers/order.controller.js";
import { ensureAuthenticated } from "../middlewares/auth.middleware.js";
import { isOwner } from "../middlewares/order.midlleware.js";
import { validatePlaceOrder } from "../middlewares/validation.middleware.js";

const router = Router();

router.route("/").post(ensureAuthenticated, createOrder);
router.route("/:orderId").get(ensureAuthenticated, isOwner, getOrderDetails);
router.route("/:orderId/place-order").post(validatePlaceOrder, placeOrder);
router.route("/:orderId/invoice").get(ensureAuthenticated, isOwner, downloadInvoice);

export default router;
