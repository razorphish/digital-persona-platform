import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, X, Check } from "lucide-react";
import { MediaFile } from "../../types";
import apiService from "../../services/api";
import toast from "react-hot-toast";

const UploadPage: React.FC = () => {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);

    for (const file of acceptedFiles) {
      try {
        setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));

        const uploadedFile = await apiService.uploadFile(file);
        setFiles((prev) => [...prev, uploadedFile]);
        setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));

        toast.success(`${file.name} uploaded successfully!`);
      } catch (error: any) {
        toast.error(
          `Failed to upload ${file.name}: ${
            error.response?.data?.detail || "Unknown error"
          }`
        );
      }
    }

    setUploading(false);
    setUploadProgress({});
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
      "video/*": [".mp4", ".avi", ".mov", ".wmv"],
      "audio/*": [".mp3", ".wav", ".flac", ".aac"],
      "application/pdf": [".pdf"],
      "text/*": [".txt", ".md", ".json", ".csv"],
    },
    multiple: true,
  });

  const handleDeleteFile = async (fileId: number) => {
    try {
      await apiService.deleteFile(fileId);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      toast.success("File deleted successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to delete file");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return "🖼️";
    if (fileType.startsWith("video/")) return "🎥";
    if (fileType.startsWith("audio/")) return "🎵";
    if (fileType.includes("pdf")) return "📄";
    return "📁";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">File Upload</h1>
        <p className="text-gray-600">
          Upload files to share with your AI personas
        </p>
      </div>

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
          isDragActive
            ? "border-primary-400 bg-primary-50"
            : "border-gray-300 hover:border-primary-400 hover:bg-gray-50"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        {isDragActive ? (
          <p className="text-lg text-primary-600">Drop the files here...</p>
        ) : (
          <div>
            <p className="text-lg text-gray-900 mb-2">
              Drag & drop files here, or click to select files
            </p>
            <p className="text-sm text-gray-500">
              Supports images, videos, audio, PDFs, and text files
            </p>
          </div>
        )}
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Uploading Files...
          </h3>
          <div className="space-y-3">
            {Object.entries(uploadProgress).map(([fileName, progress]) => (
              <div key={fileName} className="flex items-center space-x-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {fileName}
                    </span>
                    <span className="text-sm text-gray-500">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
                {progress === 100 && (
                  <Check className="h-5 w-5 text-green-500" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Uploaded Files */}
      {files.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Uploaded Files
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file) => (
              <div
                key={file.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <span className="text-2xl">
                      {getFileIcon(file.file_type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.filename}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.file_size)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(file.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteFile(file.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors duration-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File Type Info */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Supported File Types
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl mb-2">🖼️</div>
            <h4 className="font-medium text-gray-900">Images</h4>
            <p className="text-sm text-gray-600">JPEG, PNG, GIF, WebP</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl mb-2">🎥</div>
            <h4 className="font-medium text-gray-900">Videos</h4>
            <p className="text-sm text-gray-600">MP4, AVI, MOV, WMV</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl mb-2">🎵</div>
            <h4 className="font-medium text-gray-900">Audio</h4>
            <p className="text-sm text-gray-600">MP3, WAV, FLAC, AAC</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl mb-2">📄</div>
            <h4 className="font-medium text-gray-900">Documents</h4>
            <p className="text-sm text-gray-600">PDF, TXT, MD, JSON</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
