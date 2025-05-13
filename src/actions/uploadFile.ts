"use server";
import { s3Client } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@/env";

export async function uploadFile(file: File): Promise<string> {
  const uniqueKey = `${Date.now()}-${file.name}`;

  try {
    const command = new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET_NAME,
      Key: uniqueKey,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: file.type,
    });
    await s3Client.send(command);
    return uniqueKey; // Return the unique key for the uploaded file
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error("File upload failed");
  }
}
