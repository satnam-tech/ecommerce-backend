import { Router } from "express";
import { getAllProducts, getProductById } from "../controllers/product.controller.js";

const router = Router();

router.route("/").get(getAllProducts)
router.route("/:productId").get(getProductById)

export default router