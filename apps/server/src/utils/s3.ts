import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

// AWS S3 Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const S3_BUCKET = process.env.S3_BUCKET || "digital-persona-uploads";

export interface FileUploadParams {
  fileName: string;
  fileType: string;
  fileSize: number;
  userId: string;
  conversationId?: string;
  personaId?: string;
}

export interface PresignedUrlResponse {
  fileId: string;
  presignedUrl: string;
  s3Key: string;
  s3Url: string;
  expiresIn: number;
}

export async function generatePresignedUrl(
  params: FileUploadParams
): Promise<PresignedUrlResponse> {
  const fileId = uuidv4();
  const sanitizedFileName = params.fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const s3Key = `uploads/${params.userId}/${fileId}/${sanitizedFileName}`;

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key,
    ContentType: params.fileType,
    ContentLength: params.fileSize,
    Metadata: {
      userId: params.userId,
      fileId: fileId,
      originalFileName: params.fileName,
      ...(params.conversationId && { conversationId: params.conversationId }),
      ...(params.personaId && { personaId: params.personaId }),
    },
  });

  const expiresIn = 300; // 5 minutes
  const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn });

  const s3Url = `https://${S3_BUCKET}.s3.${
    process.env.AWS_REGION || "us-east-1"
  }.amazonaws.com/${s3Key}`;

  return {
    fileId,
    presignedUrl,
    s3Key,
    s3Url,
    expiresIn,
  };
}

export function getMediaType(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.includes("pdf")) return "pdf";
  if (mimeType.includes("document") || mimeType.includes("word"))
    return "document";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
    return "spreadsheet";
  return "other";
}

export function validateFileUpload(file: {
  size: number;
  type: string;
  name: string;
}): { valid: boolean; error?: string } {
  // File size limit: 100MB
  const MAX_FILE_SIZE = 100 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "File size exceeds 100MB limit" };
  }

  // Allowed file types
  const allowedTypes = [
    // Images
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    // Videos
    "video/mp4",
    "video/avi",
    "video/mov",
    "video/wmv",
    "video/webm",
    "video/quicktime",
    // Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "text/csv",
  ];

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: "File type not supported" };
  }

  return { valid: true };
}
