const multer = require("multer");
const path = require("path");

// Cấu hình multer để xử lý file upload
const storage = multer.memoryStorage(); // Lưu file vào memory để upload lên S3

const fileFilter = (req, file, cb) => {
  // Chỉ chấp nhận file ảnh
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Chỉ chấp nhận file ảnh (jpeg, jpg, png, gif, webp)!"));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
  fileFilter: fileFilter,
});

module.exports = upload;
