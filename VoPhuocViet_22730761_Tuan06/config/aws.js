require("dotenv").config();
const AWS = require("aws-sdk");

// Cấu hình AWS SDK
AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// Khởi tạo DynamoDB client
const dynamodb = new AWS.DynamoDB.DocumentClient();

// Khởi tạo S3 client
const s3 = new AWS.S3();

// Tên bảng DynamoDB
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;

// Tên S3 bucket
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;

module.exports = {
  dynamodb,
  s3,
  TABLE_NAME,
  S3_BUCKET_NAME,
};
