import { Router } from "express";
import { ensureAuthenticated } from "../middlewares/auth.middleware.js";

import {
  addItemToCart,
  getUserCart,
  RemoveItemFromCart,
} from "../controllers/cart.controller.js";

const router = Router();

router.route("/").get(ensureAuthenticated, getUserCart);
router.route("/items/:productId").post(ensureAuthenticated, addItemToCart);
router.route("/items/:productId").delete(ensureAuthenticated, RemoveItemFromCart);

export default router;
