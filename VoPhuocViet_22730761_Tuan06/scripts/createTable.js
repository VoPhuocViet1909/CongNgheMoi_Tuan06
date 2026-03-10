require("dotenv").config();
const AWS = require("aws-sdk");

// Cấu hình AWS
AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const dynamodb = new AWS.DynamoDB();
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "Products";

async function createTable() {
  const params = {
    TableName: TABLE_NAME,
    KeySchema: [
      { AttributeName: "ID", KeyType: "HASH" }, // Partition key
    ],
    AttributeDefinitions: [{ AttributeName: "ID", AttributeType: "S" }],
    BillingMode: "PAY_PER_REQUEST", // On-demand billing
  };

  try {
    console.log(`🔄 Đang kiểm tra bảng ${TABLE_NAME}...`);

    // Kiểm tra xem bảng đã tồn tại chưa
    try {
      await dynamodb.describeTable({ TableName: TABLE_NAME }).promise();
      console.log(`✅ Bảng ${TABLE_NAME} đã tồn tại!`);
      return;
    } catch (error) {
      if (error.code !== "ResourceNotFoundException") {
        throw error;
      }
    }

    // Tạo bảng mới
    console.log(`📝 Đang tạo bảng ${TABLE_NAME}...`);
    await dynamodb.createTable(params).promise();

    // Đợi bảng active
    console.log("⏳ Đang chờ bảng khả dụng...");
    await dynamodb.waitFor("tableExists", { TableName: TABLE_NAME }).promise();

    console.log(`✅ Tạo bảng ${TABLE_NAME} thành công!`);
    console.log(`
╔════════════════════════════════════════════════════╗
║   🎉 DynamoDB Table đã sẵn sàng sử dụng!          ║
║   📊 Table: ${TABLE_NAME.padEnd(36)} ║
║   🔑 Partition Key: ID (String)                   ║
╚════════════════════════════════════════════════════╝
        `);
  } catch (error) {
    console.error("❌ Lỗi khi tạo bảng:", error.message);
    process.exit(1);
  }
}

// Chạy script
createTable();
