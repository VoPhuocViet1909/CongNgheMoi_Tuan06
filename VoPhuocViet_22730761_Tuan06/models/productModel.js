const { dynamodb, TABLE_NAME, s3, S3_BUCKET_NAME } = require("../config/aws");
const { v4: uuidv4 } = require("uuid");

class Product {
  // Lấy tất cả sản phẩm
  static async getAll() {
    const params = {
      TableName: TABLE_NAME,
    };

    try {
      const data = await dynamodb.scan(params).promise();
      return data.Items;
    } catch (error) {
      console.error("Error getting all products:", error);
      throw error;
    }
  }

  // Lấy sản phẩm theo ID
  static async getById(id) {
    const params = {
      TableName: TABLE_NAME,
      Key: { ID: id },
    };

    try {
      const data = await dynamodb.get(params).promise();
      return data.Item;
    } catch (error) {
      console.error("Error getting product by ID:", error);
      throw error;
    }
  }

  // Tạo sản phẩm mới
  static async create(productData) {
    const id = uuidv4();
    const product = {
      ID: id,
      name: productData.name,
      image: productData.image || "",
      price: parseFloat(productData.price),
      quantity: parseInt(productData.quantity),
      createdAt: new Date().toISOString(),
    };

    const params = {
      TableName: TABLE_NAME,
      Item: product,
    };

    try {
      await dynamodb.put(params).promise();
      return product;
    } catch (error) {
      console.error("Error creating product:", error);
      throw error;
    }
  }

  // Cập nhật sản phẩm
  static async update(id, productData) {
    const params = {
      TableName: TABLE_NAME,
      Key: { ID: id },
      UpdateExpression:
        "set #name = :name, #image = :image, #price = :price, #quantity = :quantity, #updatedAt = :updatedAt",
      ExpressionAttributeNames: {
        "#name": "name",
        "#image": "image",
        "#price": "price",
        "#quantity": "quantity",
        "#updatedAt": "updatedAt",
      },
      ExpressionAttributeValues: {
        ":name": productData.name,
        ":image": productData.image,
        ":price": parseFloat(productData.price),
        ":quantity": parseInt(productData.quantity),
        ":updatedAt": new Date().toISOString(),
      },
      ReturnValues: "ALL_NEW",
    };

    try {
      const data = await dynamodb.update(params).promise();
      return data.Attributes;
    } catch (error) {
      console.error("Error updating product:", error);
      throw error;
    }
  }

  // Xóa sản phẩm
  static async delete(id) {
    const params = {
      TableName: TABLE_NAME,
      Key: { ID: id },
      ReturnValues: "ALL_OLD",
    };

    try {
      const data = await dynamodb.delete(params).promise();
      return data.Attributes;
    } catch (error) {
      console.error("Error deleting product:", error);
      throw error;
    }
  }

  // Tìm kiếm sản phẩm theo tên
  // Helper: Loại bỏ dấu tiếng Việt
  static removeVietnameseTones(str) {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D");
  }

  // Tìm kiếm gần đúng
  static async search(searchTerm) {
    const params = {
      TableName: TABLE_NAME,
    };

    try {
      const data = await dynamodb.scan(params).promise();

      if (!searchTerm || searchTerm.trim() === "") {
        return data.Items;
      }

      // Chuẩn hóa từ khóa tìm kiếm
      const normalizedSearchTerm = this.removeVietnameseTones(
        searchTerm.toLowerCase().trim(),
      );
      const searchWords = normalizedSearchTerm.split(/\s+/); // Tách thành các từ

      // Lọc và tính điểm phù hợp
      const scoredProducts = data.Items.map((product) => {
        const normalizedName = this.removeVietnameseTones(
          product.name.toLowerCase(),
        );

        let score = 0;

        // Điểm cho khớp chính xác toàn bộ cụm từ
        if (normalizedName === normalizedSearchTerm) {
          score += 100;
        }

        // Điểm cho chứa toàn bộ cụm từ
        if (normalizedName.includes(normalizedSearchTerm)) {
          score += 50;
        }

        // Điểm cho bắt đầu bằng từ khóa
        if (normalizedName.startsWith(normalizedSearchTerm)) {
          score += 30;
        }

        // Điểm cho từng từ trong tên
        searchWords.forEach((word) => {
          if (normalizedName.includes(word)) {
            score += 10;
          }
          if (normalizedName.startsWith(word)) {
            score += 5;
          }
        });

        return { product, score };
      });

      // Lọc các sản phẩm có điểm > 0 và sắp xếp theo điểm giảm dần
      const filteredProducts = scoredProducts
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((item) => item.product);

      return filteredProducts;
    } catch (error) {
      console.error("Error searching products:", error);
      throw error;
    }
  }

  // Upload ảnh lên S3
  static async uploadImage(file) {
    const fileExtension = file.originalname.split(".").pop();
    const fileName = `${uuidv4()}.${fileExtension}`;

    const params = {
      Bucket: S3_BUCKET_NAME,
      Key: `products/${fileName}`,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    try {
      const data = await s3.upload(params).promise();
      return data.Location; // URL của ảnh trên S3
    } catch (error) {
      console.error("Error uploading image to S3:", error);
      throw error;
    }
  }

  // Xóa ảnh trên S3
  static async deleteImage(imageUrl) {
    if (!imageUrl) return;

    try {
      // Lấy key từ URL
      const key = imageUrl.split(".com/")[1];

      const params = {
        Bucket: S3_BUCKET_NAME,
        Key: key,
      };

      await s3.deleteObject(params).promise();
    } catch (error) {
      console.error("Error deleting image from S3:", error);
      throw error;
    }
  }
}

module.exports = Product;
