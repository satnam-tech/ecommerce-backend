import { Router } from "express";
import {
  addNewSubImage,
  adminLogin,
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  deleteSubImage,
  getAllCategories,
  logoutAdmin,
  updateCategory,
  updateMainImage,
  updateProduct,
} from "../controllers/admin.controller.js";
import { checkAdmin } from "../middlewares/admin.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
const router = Router();

router.route("/login").post(adminLogin);
router.route("/logout").post(checkAdmin, logoutAdmin);

router.route("/products").post(
  checkAdmin,
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

  createProduct
);
router.route("/products/:productId").patch(checkAdmin, updateProduct);
router.route("/products/:productId").delete(checkAdmin, deleteProduct);

router
  .route("/products/:productId/main-image")
  .patch(
    checkAdmin,
    upload.fields([{ name: "mainImage", maxCount: 1 }]),
    updateMainImage
  );

router
  .route("/products/:productId/sub-images")
  .patch(
    checkAdmin,
    upload.fields([{ name: "subImages", maxCount: 4 }]),
    addNewSubImage
  );

router
  .route("/products/:productId/sub-images")
  .delete(checkAdmin, deleteSubImage);

// Category routes
router.route("/category").post(checkAdmin, createCategory);
router.route("/category").get(checkAdmin, getAllCategories);
router.route("/category/:categoryId").patch(checkAdmin, updateCategory);
router.route("/category/:categoryId").delete(checkAdmin, deleteCategory);

export default router;
