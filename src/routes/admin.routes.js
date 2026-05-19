import { Router } from "express";
import {
  addNewSubImage,
  adminLogin,
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  removeASubImage,
  getAllCategories,
  getOrdersById,
  getOrdersList,
  logoutAdmin,
  updateCategory,
  updateMainImage,
  updateOrderStatus,
  updateProduct,
  dashboardStats,
} from "../controllers/admin.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  ensureAuthenticated,
  restrictToRole,
} from "../middlewares/auth.middleware.js";
import {
  validateCreateProduct,
  validateUpdateCategory,
  validateUpdateProduct,
} from "../middlewares/validation.middleware.js";

const router = Router();

const adminRestrictMiddleware = restrictToRole("ADMIN");

router.route("/login").post(adminLogin);
router
  .route("/logout")
  .post(ensureAuthenticated, adminRestrictMiddleware, logoutAdmin);

// Product routes
router.route("/products").post(
  ensureAuthenticated,
  adminRestrictMiddleware,
  upload.fields([
    {
      name: "mainImage",
      maxCount: 1,
    },
    {
      name: "subImages",
      maxCount: 4,
    },
  ]),

  validateCreateProduct,
  createProduct
);
router
  .route("/products/:productId")
  .patch(
    ensureAuthenticated,
    adminRestrictMiddleware,
    validateUpdateProduct,
    updateProduct
  );
router
  .route("/products/:productId")
  .delete(ensureAuthenticated, adminRestrictMiddleware, deleteProduct);

router
  .route("/products/:productId/main-image")
  .patch(
    ensureAuthenticated,
    adminRestrictMiddleware,
    upload.fields([{ name: "mainImage", maxCount: 1 }]),
    updateMainImage
  );

router
  .route("/products/:productId/sub-images")
  .patch(
    ensureAuthenticated,
    adminRestrictMiddleware,
    upload.fields([{ name: "subImages", maxCount: 4 }]),
    addNewSubImage
  );

router
  .route("/products/:productId/sub-images")
  .delete(ensureAuthenticated, adminRestrictMiddleware, removeASubImage);

// Category routes
router
  .route("/category")
  .post(ensureAuthenticated, adminRestrictMiddleware, createCategory);
router
  .route("/category")
  .get(ensureAuthenticated, adminRestrictMiddleware, getAllCategories);
router
  .route("/category/:categoryId")
  .patch(ensureAuthenticated, adminRestrictMiddleware, validateUpdateCategory, updateCategory);
router
  .route("/category/:categoryId")
  .delete(ensureAuthenticated, adminRestrictMiddleware, deleteCategory);

// Order routes
router
  .route("/orders")
  .get(ensureAuthenticated, adminRestrictMiddleware, getOrdersList);
router
  .route("/orders/:orderId")
  .get(ensureAuthenticated, adminRestrictMiddleware, getOrdersById);
router
  .route("/orders/:orderId/status")
  .patch(ensureAuthenticated, adminRestrictMiddleware, updateOrderStatus);
router
  .route("/admin/dashboard/stats")
  .patch(ensureAuthenticated, adminRestrictMiddleware, dashboardStats);

export default router;
