import { S3Client } from "@aws-sdk/client-s3";
import { env } from "@/env";

const s3Client = new S3Client({
  endpoint: env.AWS_S3_ENDPOINT,
  region: env.AWS_S3_REGION,
  credentials: {
    accessKeyId: env.AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true, // Needed for MinIO
});

export { s3Client };
