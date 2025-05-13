"use server";

import { s3Client } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@/env";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function getFile(fileKey: string): Promise<string> {
  try {
    const fileCmd = new GetObjectCommand({
      Bucket: env.AWS_S3_BUCKET_NAME,
      Key: fileKey,
    });
    const url = await getSignedUrl(s3Client, fileCmd, { expiresIn: 3600 });
    return url;
  } catch (error) {
    console.error("Error retrieving file:", error);
    throw new Error("File retrieval failed");
  }
}
