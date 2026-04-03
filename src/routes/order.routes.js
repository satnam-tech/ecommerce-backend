import Router from "express"
import { createOrder, getOrderDetails, placeOrder } from "../controllers/order.controller.js";
import {verifyJWT} from "../middlewares/auth.middleware.js"
import { isOwner } from "../middlewares/order.midlleware.js";

const router = Router();

router.route("/").post(verifyJWT, createOrder);
router.route("/:orderId").get(verifyJWT, isOwner, getOrderDetails);
router.route("/:orderId/place-order").post( placeOrder);

export default router;