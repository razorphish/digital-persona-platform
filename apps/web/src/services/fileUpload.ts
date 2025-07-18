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

// Get presigned URL from backend
export async function requestPresignedUrl(
  fileData: FileUploadRequest,
  token: string
): Promise<PresignedUrlResponse> {
  const response = await fetch(
    "http://localhost:4001/api/trpc/media.requestPresignedUrl",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(fileData),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get presigned URL: ${response.statusText}`);
  }

  const result = await response.json();
  return result.result.data;
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

// Update file status in backend
export async function updateFileStatus(
  fileId: string,
  status: "completed" | "failure",
  token: string
): Promise<boolean> {
  try {
    const response = await fetch(
      "http://localhost:4001/api/trpc/media.updateFileStatus",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fileId,
          status,
          uploadedAt: status === "completed" ? new Date() : undefined,
        }),
      }
    );

    return response.ok;
  } catch (error) {
    console.error("Status update error:", error);
    return false;
  }
}

// Complete file upload process
export async function uploadFile(
  file: File,
  token: string,
  conversationId?: string,
  personaId?: string,
  onProgress?: (progress: number) => void
): Promise<FileUploadResult> {
  try {
    // Step 1: Request presigned URL
    onProgress?.(10);
    const presignedData = await requestPresignedUrl(
      {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        conversationId,
        personaId,
      },
      token
    );

    // Step 2: Upload to S3
    onProgress?.(30);
    const uploadSuccess = await uploadFileToS3(
      file,
      presignedData.presignedUrl
    );

    // Step 3: Update status
    onProgress?.(80);
    const status = uploadSuccess ? "completed" : "failure";
    await updateFileStatus(presignedData.fileId, status, token);

    onProgress?.(100);

    return {
      fileId: presignedData.fileId,
      s3Url: `https://digital-persona-uploads.s3.us-east-1.amazonaws.com/${presignedData.s3Key}`,
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
