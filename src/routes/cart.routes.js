import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";

import {
  addItemToCart,
  getUserCart,
  RemoveItemFromCart,
} from "../controllers/cart.controller.js";

const router = Router();

router.route("/").get(verifyJWT, getUserCart);
router.route("/items/:productId").post(verifyJWT, addItemToCart);
router.route("/items/:productId").delete(verifyJWT, RemoveItemFromCart);

export default router;
