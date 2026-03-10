const Product = require("../models/productModel");

// Hiển thị danh sách tất cả sản phẩm (có phân trang)
exports.getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 6; // Hiển thị 6 sản phẩm mỗi trang

    const allProducts = await Product.getAll();
    const totalProducts = allProducts.length;
    const totalPages = Math.ceil(totalProducts / limit);

    // Tính toán index bắt đầu và kết thúc
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const products = allProducts.slice(startIndex, endIndex);

    res.render("products/index", {
      products,
      searchTerm: "",
      message: req.query.message || null,
      currentPage: page,
      totalPages: totalPages,
      totalProducts: totalProducts,
    });
  } catch (error) {
    console.error("Error in getProducts:", error);
    res.status(500).render("error", {
      message: "Không thể tải danh sách sản phẩm",
      error: error,
    });
  }
};

// Hiển thị form thêm sản phẩm
exports.getCreateForm = (req, res) => {
  res.render("products/create", { error: null });
};

// Xử lý thêm sản phẩm mới
exports.createProduct = async (req, res) => {
  try {
    const { name, price, quantity } = req.body;

    // Validate dữ liệu chi tiết
    if (!name || name.trim() === "") {
      return res.render("products/create", {
        error: "Tên sản phẩm không được để trống",
      });
    }

    if (!price || isNaN(price) || parseFloat(price) <= 0) {
      return res.render("products/create", {
        error: "Giá sản phẩm phải lớn hơn 0",
      });
    }

    if (!quantity || isNaN(quantity) || parseInt(quantity) < 0) {
      return res.render("products/create", {
        error: "Số lượng phải lớn hơn hoặc bằng 0",
      });
    }

    let imageUrl = "";

    // Upload ảnh lên S3 nếu có
    if (req.file) {
      try {
        imageUrl = await Product.uploadImage(req.file);
      } catch (uploadError) {
        return res.render("products/create", {
          error: "Lỗi khi upload ảnh: " + uploadError.message,
        });
      }
    }

    // Tạo sản phẩm mới
    const productData = {
      name: name.trim(),
      price,
      quantity,
      image: imageUrl,
    };

    await Product.create(productData);
    res.redirect("/products?message=Thêm sản phẩm thành công");
  } catch (error) {
    console.error("Error in createProduct:", error);
    res.render("products/create", {
      error: "Lỗi khi thêm sản phẩm: " + error.message,
    });
  }
};

// Hiển thị chi tiết sản phẩm
exports.getProductDetail = async (req, res) => {
  try {
    const product = await Product.getById(req.params.id);

    if (!product) {
      return res.status(404).render("error", {
        message: "Không tìm thấy sản phẩm",
        error: { status: 404 },
      });
    }

    res.render("products/detail", { product });
  } catch (error) {
    console.error("Error in getProductDetail:", error);
    res.status(500).render("error", {
      message: "Không thể tải thông tin sản phẩm",
      error: error,
    });
  }
};

// Hiển thị form sửa sản phẩm
exports.getEditForm = async (req, res) => {
  try {
    const product = await Product.getById(req.params.id);

    if (!product) {
      return res.status(404).render("error", {
        message: "Không tìm thấy sản phẩm",
        error: { status: 404 },
      });
    }

    res.render("products/edit", { product, error: null });
  } catch (error) {
    console.error("Error in getEditForm:", error);
    res.status(500).render("error", {
      message: "Không thể tải form chỉnh sửa",
      error: error,
    });
  }
};

// Xử lý cập nhật sản phẩm
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, quantity } = req.body;

    // Lấy thông tin sản phẩm cũ
    const oldProduct = await Product.getById(id);

    if (!oldProduct) {
      return res.status(404).render("error", {
        message: "Không tìm thấy sản phẩm",
        error: { status: 404 },
      });
    }

    // Validate dữ liệu chi tiết
    if (!name || name.trim() === "") {
      return res.render("products/edit", {
        product: oldProduct,
        error: "Tên sản phẩm không được để trống",
      });
    }

    if (!price || isNaN(price) || parseFloat(price) <= 0) {
      return res.render("products/edit", {
        product: oldProduct,
        error: "Giá sản phẩm phải lớn hơn 0",
      });
    }

    if (!quantity || isNaN(quantity) || parseInt(quantity) < 0) {
      return res.render("products/edit", {
        product: oldProduct,
        error: "Số lượng phải lớn hơn hoặc bằng 0",
      });
    }

    let imageUrl = oldProduct.image; // Giữ ảnh cũ mặc định

    // Nếu có upload ảnh mới
    if (req.file) {
      try {
        // Xóa ảnh cũ trên S3 (nếu có)
        if (oldProduct.image) {
          await Product.deleteImage(oldProduct.image);
        }

        // Upload ảnh mới
        imageUrl = await Product.uploadImage(req.file);
      } catch (uploadError) {
        return res.render("products/edit", {
          product: oldProduct,
          error: "Lỗi khi upload ảnh: " + uploadError.message,
        });
      }
    }

    // Cập nhật sản phẩm
    const productData = {
      name: name.trim(),
      price,
      quantity,
      image: imageUrl,
    };

    await Product.update(id, productData);
    res.redirect("/products?message=Cập nhật sản phẩm thành công");
  } catch (error) {
    console.error("Error in updateProduct:", error);
    const product = await Product.getById(req.params.id);
    res.render("products/edit", {
      product,
      error: "Lỗi khi cập nhật sản phẩm: " + error.message,
    });
  }
};

// Xóa sản phẩm
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Lấy thông tin sản phẩm để xóa ảnh
    const product = await Product.getById(id);

    if (!product) {
      return res.redirect("/products?message=Không tìm thấy sản phẩm");
    }

    // Xóa ảnh trên S3 (nếu có)
    if (product.image) {
      await Product.deleteImage(product.image);
    }

    // Xóa sản phẩm khỏi DynamoDB
    await Product.delete(id);

    res.redirect("/products?message=Xóa sản phẩm thành công");
  } catch (error) {
    console.error("Error in deleteProduct:", error);
    res.redirect("/products?message=Lỗi khi xóa sản phẩm");
  }
};

// Tìm kiếm sản phẩm (có phân trang)
exports.searchProducts = async (req, res) => {
  try {
    const searchTerm = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 6; // Hiển thị 6 sản phẩm mỗi trang

    let allProducts;
    if (searchTerm) {
      allProducts = await Product.search(searchTerm);
    } else {
      allProducts = await Product.getAll();
    }

    const totalProducts = allProducts.length;
    const totalPages = Math.ceil(totalProducts / limit);

    // Tính toán index bắt đầu và kết thúc
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const products = allProducts.slice(startIndex, endIndex);

    res.render("products/index", {
      products,
      searchTerm,
      message: null,
      currentPage: page,
      totalPages: totalPages,
      totalProducts: totalProducts,
    });
  } catch (error) {
    console.error("Error in searchProducts:", error);
    res.status(500).render("error", {
      message: "Lỗi khi tìm kiếm sản phẩm",
      error: error,
    });
  }
};
