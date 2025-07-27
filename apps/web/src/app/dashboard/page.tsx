"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { uploadFile, FileUploadResult } from "@/services/fileUpload";
import { AuthUtils } from "@/lib/auth";
import { AuthGuard } from "@/components/auth/AuthGuard";

interface UploadedFile {
  file: File;
  preview?: string;
  type: "image" | "video" | "document";
  fileId?: string;
  uploadProgress: number;
  uploadStatus: "pending" | "uploading" | "completed" | "failed";
  s3Url?: string;
  error?: string;
}

function DashboardPageContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [message, setMessage] = useState("");

  // File handling functions
  const handleFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newFiles: UploadedFile[] = [];

    fileArray.forEach((file) => {
      const fileType = file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
        ? "video"
        : "document";

      const uploadedFile: UploadedFile = {
        file,
        type: fileType,
        uploadProgress: 0,
        uploadStatus: "pending",
      };

      // Create preview for images
      if (fileType === "image") {
        const reader = new FileReader();
        reader.onload = (e) => {
          uploadedFile.preview = e.target?.result as string;
          setUploadedFiles((prev) => [
            ...prev.filter((f) => f.file.name !== file.name),
            uploadedFile,
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        newFiles.push(uploadedFile);
      }
    });

    if (newFiles.length > 0) {
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (fileName: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.file.name !== fileName));
  };

  const sendMessage = async () => {
    if (message.trim() || uploadedFiles.length > 0) {
      // Upload any pending files first
      const pendingFiles = uploadedFiles.filter(
        (f) => f.uploadStatus === "pending"
      );

      for (const file of pendingFiles) {
        const tokens = AuthUtils.getTokens();
        if (tokens?.accessToken) {
          // Update status to uploading
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.file.name === file.file.name
                ? { ...f, uploadStatus: "uploading" as const }
                : f
            )
          );

          // Upload file
          const result = await uploadFile(
            file.file,
            tokens.accessToken,
            undefined, // conversationId - would come from chat context
            undefined, // personaId - would come from user context
            (progress) => {
              setUploadedFiles((prev) =>
                prev.map((f) =>
                  f.file.name === file.file.name
                    ? { ...f, uploadProgress: progress }
                    : f
                )
              );
            }
          );

          // Update final status
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.file.name === file.file.name
                ? {
                    ...f,
                    uploadStatus: result.success
                      ? ("completed" as const)
                      : ("failed" as const),
                    fileId: result.fileId,
                    s3Url: result.s3Url,
                    error: result.error,
                    uploadProgress: 100,
                  }
                : f
            )
          );
        }
      }

      // Here you would send the message with file references to your chat system
      console.log("Sending message:", message);
      console.log(
        "With files:",
        uploadedFiles.filter((f) => f.uploadStatus === "completed")
      );

      // Clear the input
      setMessage("");
      setUploadedFiles([]);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Digital Persona Platform
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.name}!</span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
            <p className="mt-2 text-gray-600">
              Manage your digital persona and AI interactions
            </p>
          </div>

          {/* Chat Window */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 shadow-lg">
            <div className="flex flex-col h-96">
              {/* Chat Header */}
              <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Airica (Erica)
                    </h3>
                    <p className="text-sm text-gray-500">
                      Your AI Persona Companion
                    </p>
                  </div>
                </div>
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto mb-4">
                <div className="space-y-4">
                  {/* AI Greeting Message */}
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-100 rounded-lg p-4 max-w-lg">
                        <p className="text-gray-800">
                          Hello{" "}
                          <span className="font-semibold text-indigo-600">
                            {user?.name}
                          </span>
                          ! 👋 I'm{" "}
                          <span className="font-semibold text-purple-600">
                            Airica (Erica)
                          </span>
                          , your AI companion.
                        </p>
                        <p className="text-gray-800 mt-3">
                          I'm here to help you create and develop your digital
                          persona through our conversations. As we chat, I'll
                          learn about your personality, interests, values, and
                          unique traits to build an authentic digital
                          representation of who you are.
                        </p>
                        <p className="text-gray-800 mt-3">
                          This platform combines AI-powered conversations with
                          social media integration to understand your
                          communication style and preferences. Together, we'll
                          craft a digital persona that truly reflects your
                          authentic self.
                        </p>
                        <p className="text-gray-800 mt-3 font-medium">
                          So tell me, what makes you uniquely you? What are your
                          passions, goals, or something interesting about
                          yourself? ✨
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Just now</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Input */}
              <div className="border-t border-gray-200 pt-4">
                {/* File Upload Area */}
                <div className="mb-3">
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    accept="image/*,video/*,.pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        handleFiles(e.target.files);
                      }
                    }}
                  />
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-indigo-400 transition-colors cursor-pointer"
                    onClick={() =>
                      document.getElementById("file-upload")?.click()
                    }
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add(
                        "border-indigo-400",
                        "bg-indigo-50"
                      );
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove(
                        "border-indigo-400",
                        "bg-indigo-50"
                      );
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove(
                        "border-indigo-400",
                        "bg-indigo-50"
                      );
                      handleFiles(e.dataTransfer.files);
                    }}
                  >
                    <div className="flex items-center justify-center space-x-2 text-gray-500">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                        />
                      </svg>
                      <span className="text-sm">
                        Drag & drop files or{" "}
                        <span className="text-indigo-600 font-medium">
                          click to upload
                        </span>
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Support: Images, Videos, PDFs, Documents
                    </p>
                  </div>
                </div>

                {/* File Previews */}
                {uploadedFiles.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-2">
                      {uploadedFiles.map((uploadedFile, index) => (
                        <div
                          key={index}
                          className="relative bg-gray-100 rounded-lg p-2 flex items-center space-x-2"
                        >
                          {/* File Icon/Preview */}
                          {uploadedFile.type === "image" &&
                          uploadedFile.preview ? (
                            <Image
                              src={uploadedFile.preview || ""}
                              alt={uploadedFile.file.name}
                              width={32}
                              height={32}
                              className="w-8 h-8 object-cover rounded"
                            />
                          ) : uploadedFile.type === "video" ? (
                            <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-purple-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                          ) : (
                            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                            </div>
                          )}

                          {/* File Name and Status */}
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-gray-700 truncate block">
                              {uploadedFile.file.name}
                            </span>

                            {/* Upload Progress */}
                            {uploadedFile.uploadStatus === "uploading" && (
                              <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                                <div
                                  className="bg-indigo-600 h-1 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${uploadedFile.uploadProgress}%`,
                                  }}
                                ></div>
                              </div>
                            )}

                            {/* Status Indicators */}
                            {uploadedFile.uploadStatus === "completed" && (
                              <span className="text-xs text-green-600 font-medium">
                                ✓ Uploaded
                              </span>
                            )}
                            {uploadedFile.uploadStatus === "failed" && (
                              <span className="text-xs text-red-600 font-medium">
                                ✗ Failed
                              </span>
                            )}
                            {uploadedFile.uploadStatus === "pending" && (
                              <span className="text-xs text-gray-500">
                                Pending...
                              </span>
                            )}
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() => removeFile(uploadedFile.file.name)}
                            className="w-4 h-4 text-gray-400 hover:text-red-500 transition-colors ml-2"
                            disabled={uploadedFile.uploadStatus === "uploading"}
                          >
                            <svg
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Text Input with Attachment Buttons */}
                <div className="flex space-x-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                      placeholder="Type your message here..."
                      className="w-full px-4 py-2 pr-20 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    {/* Quick Attachment Buttons */}
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                      {/* Image Upload */}
                      <button
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = "image/*";
                          input.multiple = true;
                          input.onchange = (e) => {
                            const files = (e.target as HTMLInputElement).files;
                            if (files) handleFiles(files);
                          };
                          input.click();
                        }}
                        className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                        title="Upload Image"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </button>
                      {/* Video Upload */}
                      <button
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = "video/*";
                          input.multiple = true;
                          input.onchange = (e) => {
                            const files = (e.target as HTMLInputElement).files;
                            if (files) handleFiles(files);
                          };
                          input.click();
                        }}
                        className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                        title="Upload Video"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={sendMessage}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                AI Chat
              </h3>
              <p className="text-gray-600 mb-4">
                Engage in intelligent conversations with your AI persona
              </p>
              <button
                onClick={() => router.push("/chat")}
                className="text-indigo-600 hover:text-indigo-500 font-medium"
              >
                Continue Chatting →
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Personas
              </h3>
              <p className="text-gray-600 mb-4">
                Create and manage your digital personas
              </p>
              <button
                onClick={() => router.push("/personas")}
                className="text-indigo-600 hover:text-indigo-500 font-medium"
              >
                Manage Personas →
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Analytics
              </h3>
              <p className="text-gray-600 mb-4">
                View insights about your personality and preferences
              </p>
              <button
                onClick={() => router.push("/analytics")}
                className="text-indigo-600 hover:text-indigo-500 font-medium"
              >
                View Analytics →
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                File Management
              </h3>
              <p className="text-gray-600 mb-4">
                Manage your uploaded files and view AI processing insights
              </p>
              <button
                onClick={() => router.push("/files")}
                className="text-indigo-600 hover:text-indigo-500 font-medium"
              >
                Manage Files →
              </button>
            </div>
          </div>

          {/* Welcome Message */}
          <div className="mt-8 text-center">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                🎉 Welcome to Digital Persona Platform!
              </h3>
              <p className="text-green-700">
                Your account has been successfully created and you're now ready
                to start building your digital persona. Explore the features
                above to get started with AI-powered conversations and
                personality insights.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardPageContent />
    </AuthGuard>
  );
}
