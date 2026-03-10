require("dotenv").config();
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const expressLayouts = require("express-ejs-layouts");

// Import routes
const productRoutes = require("./routes/productRoutes");

// Khởi tạo Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Template engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layout");

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/products", productRoutes);

// Root route - redirect to products
app.get("/", (req, res) => {
  res.redirect("/products");
});

// 404 handler
app.use((req, res) => {
  res.status(404).render("error", {
    message: "Trang không tồn tại",
    error: { status: 404 },
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).render("error", {
    message: err.message || "Đã xảy ra lỗi",
    error: err,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║   🚀 Product Management App is running!           ║
║   📍 Server: http://localhost:${PORT}              ║
║   👤 Author: Võ Phước Việt - 22730761             ║
╚════════════════════════════════════════════════════╝
    `);
  console.log("📌 Available Routes:");
  console.log("   GET  /products           - Danh sách sản phẩm");
  console.log("   GET  /products/search    - Tìm kiếm sản phẩm");
  console.log("   GET  /products/create    - Form thêm sản phẩm");
  console.log("   POST /products/create    - Xử lý thêm sản phẩm");
  console.log("   GET  /products/:id       - Chi tiết sản phẩm");
  console.log("   GET  /products/:id/edit  - Form sửa sản phẩm");
  console.log("   POST /products/:id/edit  - Xử lý cập nhật sản phẩm");
  console.log("   POST /products/:id/delete- Xóa sản phẩm");
  console.log("\n⚠️  Nhớ cấu hình file .env với thông tin AWS của bạn!\n");
});

module.exports = app;
