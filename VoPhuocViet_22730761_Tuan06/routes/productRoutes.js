const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const upload = require("../config/multer");

// Route hiển thị danh sách sản phẩm (trang chủ)
router.get("/", productController.getProducts);

// Route tìm kiếm sản phẩm
router.get("/search", productController.searchProducts);

// Route hiển thị form thêm sản phẩm
router.get("/create", productController.getCreateForm);

// Route xử lý thêm sản phẩm mới
router.post("/create", upload.single("image"), productController.createProduct);

// Route hiển thị chi tiết sản phẩm
router.get("/:id", productController.getProductDetail);

// Route hiển thị form sửa sản phẩm
router.get("/:id/edit", productController.getEditForm);

// Route xử lý cập nhật sản phẩm
router.post(
  "/:id/edit",
  upload.single("image"),
  productController.updateProduct,
);

// Route xóa sản phẩm
router.post("/:id/delete", productController.deleteProduct);

module.exports = router;
