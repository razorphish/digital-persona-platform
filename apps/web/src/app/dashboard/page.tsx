"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { uploadFile, FileUploadResult } from "@/services/fileUpload";
import { AuthUtils } from "@/lib/auth";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { trpc } from "@/lib/trpc";

interface UploadedFile {
  file: File;
  preview?: string;
  type: "image" | "video" | "document" | "audio";
  fileId?: string;
  uploadProgress: number;
  uploadStatus: "pending" | "uploading" | "completed" | "failed";
  s3Url?: string;
  error?: string;
}

function DashboardPageContent() {
  const { user, logout } = useAuth();
  const requestPresignedUrl = trpc.media.requestPresignedUrl.useMutation();
  const updateFileStatus = trpc.media.updateFileStatus.useMutation();
  const router = useRouter();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [message, setMessage] = useState("");

  // Navigation menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [audioUploadProgress, setAudioUploadProgress] = useState<number>(0);
  const [isUploadingAudio, setIsUploadingAudio] = useState<boolean>(false);
  const [uploadedAudioFileId, setUploadedAudioFileId] = useState<string | null>(
    null
  );
  const [isMicTesting, setIsMicTesting] = useState(false);
  const [micTestResult, setMicTestResult] = useState<
    "success" | "failed" | null
  >(null);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(
    null
  );
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [requiresUserInteraction, setRequiresUserInteraction] = useState(false);

  const isRecordingRef = useRef(false);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isMenuOpen && !target.closest(".menu-container")) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  // Navigation items
  const navigationItems = [
    { name: "Dashboard", href: "/dashboard", icon: "🏠" },
    { name: "Personas", href: "/personas", icon: "👤" },
    { name: "Learning", href: "/learning", icon: "📚" },
    { name: "Account", href: "/account", icon: "⚙️" },
    { name: "Analytics", href: "/analytics", icon: "📊" },
  ];

  const handleNavigation = (href: string) => {
    setIsMenuOpen(false);
    router.push(href);
  };

  const handleLogout = () => {
    setIsMenuOpen(false);
    logout();
  };

  // Detect mobile device
  useEffect(() => {
    const checkMobileDevice = () => {
      const userAgent =
        navigator.userAgent || navigator.vendor || (window as any).opera;
      const mobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          userAgent
        );
      setIsMobileDevice(mobile);

      // Check if user interaction is required (Safari on iOS typically requires it)
      const requiresInteraction =
        /iPhone|iPad|iPod/i.test(userAgent) && /Safari/i.test(userAgent);
      setRequiresUserInteraction(requiresInteraction);
    };

    checkMobileDevice();
  }, []);

  // Enhanced audio device diagnostics
  const diagnoseAudioDevices = async () => {
    console.log("🔍 Running comprehensive audio device diagnostics...");

    try {
      // Check if mediaDevices API is available
      if (!navigator.mediaDevices) {
        console.error("❌ navigator.mediaDevices not available");
        return {
          success: false,
          error: "MediaDevices API not supported",
          devices: [],
          recommendations: [
            "Try a different browser",
            "Ensure you're on HTTPS",
          ],
        };
      }

      // Enumerate available devices
      if (!navigator.mediaDevices.enumerateDevices) {
        console.error("❌ enumerateDevices not available");
        return {
          success: false,
          error: "Device enumeration not supported",
          devices: [],
          recommendations: ["Try a different browser"],
        };
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(
        (device) => device.kind === "audioinput"
      );
      const audioOutputs = devices.filter(
        (device) => device.kind === "audiooutput"
      );
      const videoInputs = devices.filter(
        (device) => device.kind === "videoinput"
      );

      console.log("🎤 Audio input devices:", audioInputs);
      console.log("🔊 Audio output devices:", audioOutputs);
      console.log("📹 Video input devices:", videoInputs);

      const recommendations = [];

      if (audioInputs.length === 0) {
        recommendations.push("Connect a microphone to your computer");
        recommendations.push("Check System Preferences → Sound → Input");
        recommendations.push("Restart your browser");
        recommendations.push("Try a different browser to compare");
      }

      if (audioInputs.some((device) => !device.label)) {
        recommendations.push(
          "Grant microphone permissions to see device labels"
        );
      }

      return {
        success: audioInputs.length > 0,
        error: audioInputs.length === 0 ? "No audio input devices found" : null,
        devices: {
          audioInputs: audioInputs.map((d) => ({
            deviceId: d.deviceId,
            label: d.label || "Unknown device",
            groupId: d.groupId,
          })),
          audioOutputs: audioOutputs.length,
          videoInputs: videoInputs.length,
        },
        recommendations,
      };
    } catch (error) {
      console.error("❌ Device enumeration failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        devices: [],
        recommendations: [
          "Check browser permissions",
          "Try refreshing the page",
          "Restart your browser",
          "Try a different browser",
        ],
      };
    }
  };

  // Request microphone permissions
  const requestMicrophonePermission = useCallback(async () => {
    if (permissionGranted === true) {
      console.log("Microphone permission already granted");
      return true;
    }

    try {
      console.log("🎤 Requesting microphone permission...");
      setIsRequestingPermission(true);
      setRecordingError(null);

      // Run comprehensive audio device diagnostics
      const diagnostics = await diagnoseAudioDevices();

      if (!diagnostics.success) {
        console.error("❌ Audio diagnostics failed:", diagnostics);
        if (diagnostics.error === "No audio input devices found") {
          throw new Error("NO_AUDIO_DEVICES_FOUND");
        }
      } else {
        console.log("✅ Audio diagnostics passed:", diagnostics);
      }

      // Try modern API first
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        console.log("🔄 Trying modern mediaDevices.getUserMedia API...");
        try {
          return await requestWithModernAPI();
        } catch (modernError) {
          console.warn("❌ Modern API failed completely:", modernError);
        }
      }

      // Fallback to legacy API
      console.log("🔄 Falling back to legacy getUserMedia API...");
      return await requestWithLegacyAPI();
    } catch (error) {
      console.error("❌ All microphone permission methods failed:", error);

      let errorMessage = "Could not access microphone.";

      if (error instanceof Error) {
        if (error.message === "NO_AUDIO_DEVICES_FOUND") {
          errorMessage = isMobileDevice
            ? "🎤 No microphone detected. Please check that your mobile device's microphone is working and not muted. Try restarting your browser."
            : "🎤 No microphone devices found. Please:\n• Connect a microphone to your computer\n• Check System Preferences → Sound → Input\n• Ensure your microphone isn't being used by another app\n• Try restarting your browser";
        } else if (error.name === "NotAllowedError") {
          if (isMobileDevice) {
            errorMessage = requiresUserInteraction
              ? "🚫 Microphone access denied. On mobile Safari, you need to tap a recording button first, then allow microphone access when prompted."
              : "🚫 Microphone access denied. Please check your mobile browser settings: Settings → Website Settings → Microphone → Allow for this site.";
          } else {
            errorMessage =
              "🚫 Microphone access was denied. Please click the microphone icon in your browser's address bar and allow access, then try again.";
          }
        } else if (error.name === "NotFoundError") {
          if (isMobileDevice) {
            errorMessage =
              "🎤 No microphone found. Please check that your mobile device's microphone is working (try recording a voice message in another app) and try again.";
          } else {
            // Enhanced guidance for desktop NotFoundError
            const isFirefox = navigator.userAgent.includes("Firefox");
            errorMessage = isFirefox
              ? "🎤 Firefox can't find your microphone. Please:\n• Check System Preferences → Sound → Input\n• Quit any apps using your microphone (Zoom, Discord, etc.)\n• Try refreshing the page\n• Restart Firefox if the issue persists\n• Try testing in Chrome/Safari to compare"
              : "🎤 No microphone found. Please connect a microphone and try again.";
          }
        } else if (error.name === "NotSupportedError") {
          if (isMobileDevice) {
            errorMessage =
              "❌ Audio recording is not supported in this mobile browser. Try using Chrome, Safari, or Firefox mobile.";
          } else {
            errorMessage =
              "❌ Audio recording is not supported in this browser. Try using Chrome, Firefox, or Safari.";
          }
        } else if (error.name === "OverconstrainedError") {
          errorMessage = isMobileDevice
            ? "⚙️ Microphone settings are not supported on this mobile device. Try using the built-in microphone."
            : "⚙️ Microphone settings are not supported. Try a different microphone.";
        } else if (error.message?.includes("Navigator API not available")) {
          errorMessage =
            "🌐 Browser compatibility issue. This browser doesn't support audio recording.";
        } else if (
          error.message?.includes("object can not be found") ||
          error.message?.includes("object cannot be found")
        ) {
          const isFirefox = navigator.userAgent.includes("Firefox");
          errorMessage = isMobileDevice
            ? "📱 Browser compatibility issue. Try refreshing the page or using a different mobile browser (Chrome, Firefox, Safari)."
            : isFirefox
            ? "🦊 Firefox microphone issue. Please:\n• Check if your microphone works in other apps\n• Go to about:preferences#privacy → Permissions → Camera and Microphone\n• Reset permissions for this site\n• Restart Firefox\n• Try a different browser to compare"
            : "🌐 Browser compatibility issue. Try refreshing the page, using a different browser, or ensure you're on HTTPS.";
        } else {
          errorMessage = `🔧 ${error.message || errorMessage}`;
        }
      }

      setRecordingError(errorMessage);
      setPermissionGranted(false);
      setIsRequestingPermission(false);
      return false;
    }
  }, [permissionGranted, isMobileDevice, requiresUserInteraction]);

  const requestWithModernAPI = async (): Promise<boolean> => {
    const constraints = [
      {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      },
      {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      },
      {
        audio: true,
      },
    ];

    for (let i = 0; i < constraints.length; i++) {
      try {
        console.log(
          `🔄 Attempting modern API with constraint set ${i + 1}:`,
          constraints[i]
        );
        const stream = await navigator.mediaDevices.getUserMedia(
          constraints[i]
        );

        stream.getTracks().forEach((track) => track.stop());

        console.log("✅ Modern API successful!");
        setPermissionGranted(true);
        setIsRequestingPermission(false);
        return true;
      } catch (error) {
        console.warn(`❌ Modern API attempt ${i + 1} failed:`, error);

        if (error instanceof DOMException) {
          console.log("🔍 Error details:", {
            name: error.name,
            message: error.message,
            code: error.code,
            stack: error.stack,
          });
        }

        if (
          error instanceof DOMException &&
          (error.message?.includes("object can not be found") ||
            error.message?.includes("object cannot be found") ||
            (error.name === "NotFoundError" &&
              error.message?.includes("not be found")))
        ) {
          console.warn(
            "🚨 Detected 'object can not be found' error - immediately falling back to legacy API"
          );
          throw new Error("FALLBACK_TO_LEGACY_API");
        }

        if (i === constraints.length - 1) {
          throw error;
        }
      }
    }
    return false;
  };

  const requestWithLegacyAPI = async (): Promise<boolean> => {
    return new Promise<boolean>((resolve, reject) => {
      const getUserMedia =
        (navigator as any).getUserMedia ||
        (navigator as any).webkitGetUserMedia ||
        (navigator as any).mozGetUserMedia ||
        (navigator as any).msGetUserMedia;

      if (!getUserMedia) {
        reject(new Error("No getUserMedia API available"));
        return;
      }

      console.log("🔄 Attempting legacy getUserMedia API...");

      const constraints = { audio: true };

      getUserMedia.call(
        navigator,
        constraints,
        (stream: MediaStream) => {
          console.log("✅ Legacy API successful!");
          stream.getTracks().forEach((track) => track.stop());
          setPermissionGranted(true);
          setIsRequestingPermission(false);
          resolve(true);
        },
        (error: any) => {
          console.error("❌ Legacy API failed:", error);
          reject(error);
        }
      );
    });
  };

  // Audio recording functions
  const startRecording = async () => {
    try {
      setRecordingError(null);
      console.log("Starting recording...");

      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        console.log("Recording cancelled - no microphone permission");
        return;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Audio recording is not supported in this browser");
      }

      console.log("Creating media stream for recording...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateAudioLevel = () => {
        if (isRecordingRef.current) {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel((average / 255) * 100);
          requestAnimationFrame(updateAudioLevel);
        }
      };

      const recorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      const audioChunks: BlobPart[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: "video/webm" }); // Use video/webm for consistency with upload
        setRecordedAudio(audioBlob);
        setAudioLevel(0);

        stream.getTracks().forEach((track) => track.stop());
        audioContext.close();
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      isRecordingRef.current = true;
      updateAudioLevel();

      console.log("Recording started");
    } catch (error) {
      console.error("Error starting recording:", error);

      let errorMessage = "Failed to access microphone.";

      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          errorMessage =
            "Microphone access denied. Please allow microphone permissions and try again.";
        } else if (error.name === "NotFoundError") {
          errorMessage =
            "No microphone found. Please connect a microphone and try again.";
        } else if (error.name === "NotSupportedError") {
          errorMessage = "Audio recording is not supported in this browser.";
        } else {
          errorMessage = error.message || errorMessage;
        }
      }

      setRecordingError(errorMessage);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      isRecordingRef.current = false;
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
      console.log("Recording stopped");
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Upload recorded audio
  const uploadRecordedAudio = async () => {
    if (!recordedAudio) return;

    setIsUploadingAudio(true);
    setAudioUploadProgress(0);
    setUploadedAudioFileId(null);

    try {
      const tokens = AuthUtils.getTokens();
      if (!tokens?.accessToken) {
        throw new Error("No authentication token available");
      }

      // Create a file from the blob
      const audioFile = new File(
        [recordedAudio],
        `recording-${Date.now()}.webm`,
        {
          type: "video/webm", // Use video/webm since server doesn't allow audio/webm
        }
      );

      // Add to uploaded files for UI
      const audioUploadedFile: UploadedFile = {
        file: audioFile,
        type: "audio",
        uploadProgress: 0,
        uploadStatus: "uploading",
      };

      setUploadedFiles((prev) => [...prev, audioUploadedFile]);

      const result = await uploadFile(
        audioFile,
        tokens.accessToken,
        undefined, // conversationId
        undefined, // personaId
        (progress) => {
          setAudioUploadProgress(progress);
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.file.name === audioFile.name
                ? { ...f, uploadProgress: progress }
                : f
            )
          );
        },
        requestPresignedUrl, // Pass the tRPC mutation
        updateFileStatus // Pass the tRPC mutation
      );

      if (result.success) {
        setUploadedAudioFileId(result.fileId || null);
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.file.name === audioFile.name
              ? {
                  ...f,
                  uploadStatus: "completed" as const,
                  fileId: result.fileId,
                  s3Url: result.s3Url,
                  uploadProgress: 100,
                }
              : f
          )
        );
        console.log("Audio uploaded successfully:", result.fileId);
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      console.error("Error uploading audio:", error);
      setRecordingError(
        error instanceof Error ? error.message : "Upload failed"
      );
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.type === "audio" && f.uploadStatus === "uploading"
            ? {
                ...f,
                uploadStatus: "failed" as const,
                error: error instanceof Error ? error.message : "Upload failed",
              }
            : f
        )
      );
    } finally {
      setIsUploadingAudio(false);
      setRecordedAudio(null); // Clear the recorded audio after upload
    }
  };

  // Test microphone functionality
  const testMicrophone = async () => {
    setIsMicTesting(true);
    setMicTestResult(null);
    setRecordingError(null);

    try {
      console.log("🧪 Testing microphone access...");

      const diagnostics = await diagnoseAudioDevices();
      console.log("🔍 Manual diagnostics:", diagnostics);

      if (!diagnostics.success) {
        throw new Error(diagnostics.error || "No audio devices found");
      }

      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        throw new Error("Microphone permission denied");
      }

      // Test recording for 2 seconds
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        console.log("✅ Microphone access granted, testing for 2 seconds...");

        setTimeout(() => {
          stream.getTracks().forEach((track) => track.stop());
          setMicTestResult("success");
          setIsMicTesting(false);
          console.log("✅ Microphone test completed successfully");
        }, 2000);
      } else {
        throw new Error("MediaDevices API not available");
      }
    } catch (error) {
      console.error("❌ Microphone test failed:", error);
      setMicTestResult("failed");
      setIsMicTesting(false);

      if (error instanceof Error) {
        setRecordingError(error.message);
      }
    }
  };

  // File handling functions
  const handleFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newFiles: UploadedFile[] = [];

    fileArray.forEach((file) => {
      const fileType = file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
        ? "video"
        : file.type.startsWith("audio/")
        ? "audio"
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
            },
            requestPresignedUrl, // Pass the tRPC mutation
            updateFileStatus // Pass the tRPC mutation
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
              <div className="relative menu-container">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
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
                      d="M4 6h16M4 12h16m-7 6h7"
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.name}
                      </p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>

                    {navigationItems.map((item) => (
                      <button
                        key={item.name}
                        onClick={() => handleNavigation(item.href)}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <span className="mr-3">{item.icon}</span>
                        {item.name}
                      </button>
                    ))}

                    <hr className="my-2 border-gray-100" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <svg
                        className="w-4 h-4 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
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

          {/* Learning Session Encouragement Section */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-purple-900 mb-2">
                    🚀 Start Your Learning Journey
                  </h3>
                  <p className="text-purple-700 mb-4">
                    Get the most out of your digital persona by starting with
                    structured learning sessions. These guided conversations
                    help us understand your personality, values, and unique
                    traits more effectively.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => router.push("/learning")}
                      className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      Start Learning Session
                    </button>
                    <button
                      onClick={() =>
                        router.push("/learning?type=interactive_discussion")
                      }
                      className="inline-flex items-center px-4 py-2 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
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
                      Interactive Discussion
                    </button>
                  </div>
                  <div className="mt-3 text-sm text-purple-600">
                    💡 Tip: Learning sessions use both text and audio to create
                    a more natural conversation experience.
                  </div>
                </div>
              </div>
            </div>
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
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  {/* Audio Diagnostics Button */}
                  <button
                    onClick={async () => {
                      const diagnostics = await diagnoseAudioDevices();
                      console.log("🔍 Manual diagnostics:", diagnostics);
                      const audioInputs = Array.isArray(diagnostics.devices)
                        ? []
                        : diagnostics.devices.audioInputs || [];
                      alert(
                        `Audio Device Diagnostics:\n\n${
                          diagnostics.success
                            ? `✅ Found ${
                                audioInputs.length
                              } microphone(s)\n\nDevices:\n${
                                audioInputs
                                  .map((d) => `• ${d.label}`)
                                  .join("\n") || "None"
                              }`
                            : `❌ ${
                                diagnostics.error
                              }\n\nRecommendations:\n${diagnostics.recommendations
                                .map((r) => `• ${r}`)
                                .join("\n")}`
                        }`
                      );
                    }}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    title="Diagnose Audio"
                  >
                    🔍 Audio
                  </button>
                </div>
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
                        <div className="mt-3 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                          <p className="text-blue-800 text-sm">
                            💬 You can respond using text or by recording your
                            voice using the microphone button below!
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Just now</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Input */}
              <div className="border-t border-gray-200 pt-4">
                {/* Recording Error Display */}
                {recordingError && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <svg
                        className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div>
                        <p className="text-sm text-red-800 font-medium">
                          Microphone Error
                        </p>
                        <p className="text-sm text-red-700 mt-1 whitespace-pre-line">
                          {recordingError}
                        </p>
                        <div className="mt-2 flex space-x-2">
                          <button
                            onClick={testMicrophone}
                            disabled={isMicTesting}
                            className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                          >
                            {isMicTesting ? "Testing..." : "🧪 Test Mic"}
                          </button>
                          <button
                            onClick={() => setRecordingError(null)}
                            className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recorded Audio Preview */}
                {recordedAudio && (
                  <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
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
                              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-800">
                            Audio recorded successfully!
                          </p>
                          <audio
                            controls
                            src={URL.createObjectURL(recordedAudio)}
                            className="mt-1"
                            style={{ height: "32px" }}
                          />
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={uploadRecordedAudio}
                          disabled={isUploadingAudio}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          {isUploadingAudio
                            ? `Uploading... ${audioUploadProgress}%`
                            : "Upload & Send"}
                        </button>
                        <button
                          onClick={() => setRecordedAudio(null)}
                          className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                        >
                          Discard
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* File Upload Area */}
                <div className="mb-3">
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
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
                      Support: Images, Videos, Audio, PDFs, Documents
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
                          ) : uploadedFile.type === "audio" ? (
                            <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-green-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
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

                {/* Text Input with Attachment and Audio Buttons */}
                <div className="flex space-x-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                      placeholder="Type your message here..."
                      className="w-full px-4 py-2 pr-32 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    {/* Quick Attachment and Audio Buttons */}
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                      {/* Microphone Recording Button */}
                      <button
                        onClick={toggleRecording}
                        disabled={isUploadingAudio}
                        className={`relative p-2 rounded-full transition-all duration-200 ${
                          isRecording
                            ? "bg-red-500 text-white animate-pulse"
                            : permissionGranted
                            ? "bg-green-100 text-green-600 hover:bg-green-200"
                            : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                        }`}
                        title={
                          isRecording ? "Stop Recording" : "Start Recording"
                        }
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
                            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                          />
                        </svg>
                        {/* Audio Level Indicator */}
                        {isRecording && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-ping"></div>
                        )}
                      </button>

                      {/* Audio Level Visualization */}
                      {isRecording && (
                        <div className="flex items-center space-x-1 px-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div
                              key={i}
                              className={`w-1 bg-red-400 rounded-full transition-all duration-100 ${
                                audioLevel > (i + 1) * 20 ? "h-4" : "h-1"
                              }`}
                            />
                          ))}
                        </div>
                      )}

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

                      {/* Audio File Upload */}
                      <button
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = "audio/*";
                          input.multiple = true;
                          input.onchange = (e) => {
                            const files = (e.target as HTMLInputElement).files;
                            if (files) handleFiles(files);
                          };
                          input.click();
                        }}
                        className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                        title="Upload Audio File"
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
                            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
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
                    disabled={
                      !message.trim() &&
                      uploadedFiles.length === 0 &&
                      !recordedAudio
                    }
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

                {/* Microphone Status */}
                {(permissionGranted !== null || micTestResult) && (
                  <div className="mt-2 flex items-center space-x-4 text-xs">
                    {permissionGranted !== null && (
                      <div
                        className={`flex items-center space-x-1 ${
                          permissionGranted ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d={
                              permissionGranted
                                ? "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                : "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            }
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>
                          {permissionGranted
                            ? "Microphone access granted"
                            : "Microphone access denied"}
                        </span>
                      </div>
                    )}
                    {micTestResult && (
                      <div
                        className={`flex items-center space-x-1 ${
                          micTestResult === "success"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d={
                              micTestResult === "success"
                                ? "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                : "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            }
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>Microphone test {micTestResult}</span>
                      </div>
                    )}
                  </div>
                )}
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
                Continue intelligent conversations with your AI persona
              </p>
              <button
                onClick={() => router.push("/chat")}
                className="text-indigo-600 hover:text-indigo-500 font-medium"
              >
                Continue Chatting →
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mb-4">
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
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Learning Sessions
              </h3>
              <p className="text-gray-600 mb-4">
                Structured conversations to build your digital persona
              </p>
              <button
                onClick={() => router.push("/learning")}
                className="text-purple-600 hover:text-purple-500 font-medium"
              >
                Start Learning →
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
              <div className="mt-4 text-sm text-green-600">
                💡 <strong>Pro tip:</strong> Start with a learning session to
                get the best results, or jump into a general discussion right
                here with voice and text!
              </div>
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
