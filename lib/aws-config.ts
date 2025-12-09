import { S3Client } from "@aws-sdk/client-s3";

export function getBucketConfig() {
  return {
    bucketName: process.env.AWS_S3_BUCKET || "",
    folderPrefix: process.env.AWS_FOLDER_PREFIX || "",
    region: process.env.AWS_REGION || "eu-west-1",
  };
}

export function createS3Client() {
  const { region } = getBucketConfig();

  return new S3Client({
    region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
  });
}
