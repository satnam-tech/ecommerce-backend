import { Router } from "express";
import { razorpayWebhookHandler, verifyPayment } from "../controllers/payment.controller.js";
import {verifyJWT} from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/verify").post(verifyPayment);
router.route("/webhooks/razorpay").post(razorpayWebhookHandler);

export default router