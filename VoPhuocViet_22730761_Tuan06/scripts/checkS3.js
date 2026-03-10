require("dotenv").config();
const AWS = require("aws-sdk");

// Cấu hình AWS
AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.S3_BUCKET_NAME;

async function checkS3Bucket() {
  try {
    console.log(`🔄 Đang kiểm tra S3 Bucket: ${BUCKET_NAME}...`);

    // Kiểm tra bucket có tồn tại không
    await s3.headBucket({ Bucket: BUCKET_NAME }).promise();
    console.log(`✅ S3 Bucket ${BUCKET_NAME} đã tồn tại và có thể truy cập!`);

    // Test upload một file nhỏ
    const testParams = {
      Bucket: BUCKET_NAME,
      Key: "test/connection-test.txt",
      Body: "Connection test successful!",
      ContentType: "text/plain",
    };

    console.log("🧪 Đang test upload...");
    await s3.upload(testParams).promise();
    console.log("✅ Upload test thành công!");

    // Xóa file test
    await s3
      .deleteObject({
        Bucket: BUCKET_NAME,
        Key: "test/connection-test.txt",
      })
      .promise();
    console.log("🧹 Đã xóa file test");

    console.log(`
╔════════════════════════════════════════════════════╗
║   🎉 S3 Bucket đã sẵn sàng sử dụng!               ║
║   🪣 Bucket: ${BUCKET_NAME.padEnd(35)} ║
║   ✅ Quyền: Read/Write OK                         ║
╚════════════════════════════════════════════════════╝
        `);
  } catch (error) {
    console.error("❌ Lỗi:", error.message);

    if (error.code === "NoSuchBucket") {
      console.log(`
⚠️  Bucket ${BUCKET_NAME} không tồn tại!

Hướng dẫn tạo bucket:
1. Truy cập AWS Console > S3
2. Click "Create bucket"
3. Đặt tên: ${BUCKET_NAME}
4. Chọn Region: ${process.env.AWS_REGION}
5. Tắt "Block all public access"
6. Thêm Bucket Policy để cho phép public read
            `);
    } else if (error.code === "Forbidden") {
      console.log(`
⚠️  Không có quyền truy cập bucket ${BUCKET_NAME}!

Kiểm tra:
1. AWS credentials trong file .env
2. IAM permissions cho S3
            `);
    }

    process.exit(1);
  }
}

// Chạy script
checkS3Bucket();
