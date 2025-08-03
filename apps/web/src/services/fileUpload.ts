import { trpc } from "@/lib/trpc";

export interface FileUploadRequest {
  fileName: string;
  fileType: string;
  fileSize: number;
  conversationId?: string;
  personaId?: string;
}

export interface PresignedUrlResponse {
  fileId: string;
  presignedUrl: string;
  s3Key: string;
  expiresIn: number;
}

export interface FileUploadResult {
  fileId: string;
  s3Url: string;
  success: boolean;
  error?: string;
}

// Upload file directly to S3
export async function uploadFileToS3(
  file: File,
  presignedUrl: string
): Promise<boolean> {
  try {
    const response = await fetch(presignedUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    return response.ok;
  } catch (error) {
    console.error("S3 upload error:", error);
    return false;
  }
}

// Complete file upload process using tRPC mutations
export async function uploadFile(
  file: File,
  token: string,
  conversationId?: string,
  personaId?: string,
  onProgress?: (progress: number) => void,
  requestPresignedUrlMutation?: any,
  updateFileStatusMutation?: any
): Promise<FileUploadResult> {
  try {
    if (!requestPresignedUrlMutation || !updateFileStatusMutation) {
      throw new Error("tRPC mutations are required for file uploads");
    }

    // Step 1: Request presigned URL using tRPC
    onProgress?.(10);
    const presignedData = await requestPresignedUrlMutation.mutateAsync({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      conversationId,
      personaId,
    });

    // Step 2: Upload to S3
    onProgress?.(30);
    const uploadSuccess = await uploadFileToS3(
      file,
      presignedData.presignedUrl
    );

    // Step 3: Update status using tRPC
    onProgress?.(80);
    const status = uploadSuccess ? "completed" : "failure";
    await updateFileStatusMutation.mutateAsync({
      fileId: presignedData.fileId,
      status,
      uploadedAt: status === "completed" ? new Date() : undefined,
    });

    onProgress?.(100);

    return {
      fileId: presignedData.fileId,
      s3Url: `https://local-mars-dpp-uploads.s3.us-west-1.amazonaws.com/${presignedData.s3Key}`,
      success: uploadSuccess,
      error: uploadSuccess ? undefined : "Upload to S3 failed",
    };
  } catch (error) {
    console.error("File upload error:", error);
    return {
      fileId: "",
      s3Url: "",
      success: false,
      error: error instanceof Error ? error.message : "Unknown upload error",
    };
  }
}