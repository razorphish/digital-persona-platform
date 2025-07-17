// Media Types for Next.js Migration
export interface MediaFile {
  id: number;
  file_id: string; // UUID for S3 key generation
  filename: string;
  original_filename: string;
  file_path: string; // Legacy field for local storage
  s3_key?: string;
  s3_bucket?: string;
  s3_url?: string;
  file_size: number;
  mime_type: string;
  media_type: string; // 'image', 'video', 'other'
  upload_method?: string; // 'simple', 'multipart', 'presigned'
  is_s3_stored: boolean;
  persona_id: number;
  user_id: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface MediaFileCreate {
  file_id: string;
  filename: string;
  original_filename: string;
  s3_key: string;
  s3_bucket: string;
  s3_url: string;
  file_size: number;
  mime_type: string;
  media_type: string;
  upload_method: string;
  persona_id: number;
  description?: string;
}

export interface MediaFileResponse {
  id: number;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  media_type: string;
  persona_id: number;
  user_id: number;
  description?: string;
  created_at: string;
  updated_at: string;
  download_url?: string;
  s3_url?: string;
}

export interface UploadRequest {
  persona_id: number;
  description?: string;
}

export interface PresignedUploadRequest {
  filename: string;
  mime_type: string;
  persona_id: number;
}

export interface PresignedUploadResponse {
  upload_url: string;
  s3_key: string;
  file_id: string;
  bucket: string;
  expires_in: number;
}

export interface RegisterFileRequest {
  file_id: string;
  filename: string;
  original_filename: string;
  s3_key: string;
  file_size: number;
  mime_type: string;
  upload_method: string;
  description?: string;
}

export interface S3UploadResult {
  file_id: string;
  s3_key: string;
  bucket: string;
  public_url: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  media_type: string;
  user_id: number;
  persona_id: number;
  description?: string;
  upload_method: string;
  status: string;
}

export interface MediaFileListRequest {
  persona_id?: number;
  media_type?: string;
  limit?: number;
  offset?: number;
}

// File upload configuration
export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
]);

export const ALLOWED_VIDEO_TYPES = new Set(["video/mp4"]);

export const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".mp4"]);

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
export const MULTIPART_THRESHOLD = 5 * 1024 * 1024; // 5MB

export function getMediaTypeFromMime(mimeType: string): string {
  if (ALLOWED_IMAGE_TYPES.has(mimeType)) {
    return "image";
  } else if (ALLOWED_VIDEO_TYPES.has(mimeType)) {
    return "video";
  } else {
    return "other";
  }
}

export function validateFileType(mimeType: string): boolean {
  return ALLOWED_IMAGE_TYPES.has(mimeType) || ALLOWED_VIDEO_TYPES.has(mimeType);
}

export function validateFileSize(fileSize: number, mediaType: string): boolean {
  if (mediaType === "image") {
    return fileSize <= MAX_IMAGE_SIZE;
  } else if (mediaType === "video") {
    return fileSize <= MAX_VIDEO_SIZE;
  }
  return fileSize <= MAX_FILE_SIZE;
}
