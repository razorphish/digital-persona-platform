"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { trpc } from "@/lib/trpc";
import { uploadFile } from "@/services/fileUpload";
import { AuthUtils } from "@/lib/auth";

// Types for learning interviews (matching backend response)
interface LearningInterview {
  id: string;
  personaId?: string;
  sessionType?:
    | "initial"
    | "simple_questions"
    | "complex_questions"
    | "scenario_questions"
    | "social_integration"
    | "interactive_discussion";
  status: string;
  progress?: {
    currentQuestionIndex: number;
    totalQuestions: number;
    completedQuestions: number;
  };
  questions: any[];
  responses?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

interface InterviewQuestion {
  id: string;
  type: "simple" | "complex" | "scenario" | "choice" | "media" | "discussion";
  question: string;
  options?: string[];
  description?: string;
  requiresMedia?: boolean;
  estimatedTime?: number;
  isOpenEnded?: boolean;
  allowFollowUp?: boolean;
}

// Microphone Setup Instructions Component
function MicrophoneSetupInstructions({
  onTestMicrophone,
  isTesting,
  testResult,
}: {
  onTestMicrophone: () => void;
  isTesting: boolean;
  testResult: "success" | "failed" | null;
}) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
      <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
        Microphone Setup Help
      </h4>

      <div className="space-y-3">
        {/* Browser Permissions */}
        <div>
          <button
            onClick={() => toggleSection("browser")}
            className="flex items-center justify-between w-full text-left text-blue-800 hover:text-blue-900 font-medium"
          >
            <span>🌐 Browser Permissions</span>
            <svg
              className={`w-4 h-4 transform transition-transform ${
                expandedSection === "browser" ? "rotate-180" : ""
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          {expandedSection === "browser" && (
            <div className="mt-2 pl-4 text-blue-700 space-y-2">
              <p>
                <strong>Chrome/Edge:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Click the 🔒 lock icon in the address bar</li>
                <li>Set "Microphone" to "Allow"</li>
                <li>Refresh the page and try again</li>
              </ul>
              <p>
                <strong>Firefox:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Click the shield icon in the address bar</li>
                <li>Click "Turn off Blocking for This Site"</li>
                <li>Allow microphone when prompted</li>
              </ul>
              <p>
                <strong>Safari:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Safari → Preferences → Websites → Microphone</li>
                <li>Set this site to "Allow"</li>
                <li>Refresh the page</li>
              </ul>
            </div>
          )}
        </div>

        {/* macOS Settings */}
        <div>
          <button
            onClick={() => toggleSection("macos")}
            className="flex items-center justify-between w-full text-left text-blue-800 hover:text-blue-900 font-medium"
          >
            <span>🍎 macOS Settings</span>
            <svg
              className={`w-4 h-4 transform transition-transform ${
                expandedSection === "macos" ? "rotate-180" : ""
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          {expandedSection === "macos" && (
            <div className="mt-2 pl-4 text-blue-700 space-y-2">
              <ol className="list-decimal list-inside space-y-1">
                <li>Apple Menu → System Preferences → Security & Privacy</li>
                <li>Click the "Privacy" tab</li>
                <li>Select "Microphone" from the left sidebar</li>
                <li>
                  Check the box next to your browser (Chrome, Firefox, Safari)
                </li>
                <li>If prompted, click "Later" then restart your browser</li>
                <li>
                  Test your microphone in System Preferences → Sound → Input
                </li>
              </ol>
              <p className="text-sm mt-2 p-2 bg-blue-100 rounded">
                <strong>Tip:</strong> Speak into your microphone and watch for
                input level bars in Sound settings
              </p>
            </div>
          )}
        </div>

        {/* Windows Settings */}
        <div>
          <button
            onClick={() => toggleSection("windows")}
            className="flex items-center justify-between w-full text-left text-blue-800 hover:text-blue-900 font-medium"
          >
            <span>🪟 Windows Settings</span>
            <svg
              className={`w-4 h-4 transform transition-transform ${
                expandedSection === "windows" ? "rotate-180" : ""
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          {expandedSection === "windows" && (
            <div className="mt-2 pl-4 text-blue-700 space-y-2">
              <p>
                <strong>Windows 10/11:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Settings → Privacy → Microphone</li>
                <li>Turn on "Allow apps to access your microphone"</li>
                <li>Turn on "Allow desktop apps to access your microphone"</li>
                <li>Scroll down and enable your browser</li>
              </ol>
              <p>
                <strong>Alternative Method:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-1">
                <li>
                  Right-click speaker icon in taskbar → Open Sound settings
                </li>
                <li>Click "Sound Control Panel" → "Recording" tab</li>
                <li>Right-click your microphone → "Enable" if disabled</li>
                <li>Right-click → "Set as Default Device"</li>
                <li>Test by speaking - you should see green bars</li>
              </ol>
            </div>
          )}
        </div>

        {/* Hardware Check */}
        <div>
          <button
            onClick={() => toggleSection("hardware")}
            className="flex items-center justify-between w-full text-left text-blue-800 hover:text-blue-900 font-medium"
          >
            <span>🎤 Hardware Check</span>
            <svg
              className={`w-4 h-4 transform transition-transform ${
                expandedSection === "hardware" ? "rotate-180" : ""
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          {expandedSection === "hardware" && (
            <div className="mt-2 pl-4 text-blue-700 space-y-2">
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <strong>Built-in Microphone:</strong> Usually works
                  automatically on laptops
                </li>
                <li>
                  <strong>External Microphone:</strong> Check USB/3.5mm
                  connection
                </li>
                <li>
                  <strong>Headset:</strong> Ensure mic isn't muted on the
                  headset itself
                </li>
                <li>
                  <strong>Wireless Headphones:</strong> Check Bluetooth
                  connection and pairing
                </li>
              </ul>
              <p className="text-sm mt-2 p-2 bg-blue-100 rounded">
                <strong>Quick Test:</strong> Try recording a voice memo on your
                phone/computer to verify hardware works
              </p>
            </div>
          )}
        </div>

        {/* Permission Request */}
        <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
          <h5 className="font-semibold text-blue-800 mb-2">
            🔐 Request Microphone Permission
          </h5>
          <p className="text-blue-700 text-sm mb-3">
            Click to request microphone access from your browser:
          </p>
          <div className="flex items-center space-x-3">
            <button
              onClick={onTestMicrophone}
              disabled={isTesting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-300"
            >
              {isTesting ? "Requesting..." : "🔓 Request Microphone Access"}
            </button>
          </div>
        </div>

        {/* Microphone Test */}
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
          <h5 className="font-semibold text-yellow-800 mb-2">
            🧪 Test Your Microphone
          </h5>
          <p className="text-yellow-700 text-sm mb-3">
            After granting permission, test if your microphone is working
            properly:
          </p>
          <div className="flex items-center space-x-3">
            <button
              onClick={onTestMicrophone}
              disabled={isTesting}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isTesting
                  ? "bg-yellow-300 text-yellow-800 cursor-not-allowed"
                  : testResult === "success"
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : testResult === "failed"
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-yellow-600 text-white hover:bg-yellow-700"
              }`}
            >
              {isTesting
                ? "Testing..."
                : testResult === "success"
                ? "✅ Test Passed"
                : testResult === "failed"
                ? "❌ Test Failed"
                : "🎤 Test Microphone"}
            </button>
            {testResult === "success" && (
              <span className="text-green-700 text-sm font-medium">
                Microphone is working! You can now record audio.
              </span>
            )}
            {testResult === "failed" && (
              <span className="text-red-700 text-sm font-medium">
                Microphone test failed. Try the steps above.
              </span>
            )}
          </div>
        </div>

        {/* Quick Fixes */}
        <div className="bg-green-50 border border-green-200 rounded p-3">
          <h5 className="font-semibold text-green-800 mb-2">🔧 Quick Fixes</h5>
          <ul className="text-green-700 text-xs space-y-1">
            <li>• Refresh this page after changing settings</li>
            <li>• Try a different browser (Chrome usually works best)</li>
            <li>• Close other apps that might be using your microphone</li>
            <li>• Restart your browser completely</li>
            <li>• Check if antivirus software is blocking microphone access</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function LearningPageContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>("");
  const [selectedSessionType, setSelectedSessionType] = useState<
    | "initial"
    | "simple_questions"
    | "complex_questions"
    | "scenario_questions"
    | "social_integration"
    | "interactive_discussion"
  >("simple_questions");
  const [currentInterview, setCurrentInterview] =
    useState<LearningInterview | null>(null);
  const [currentResponse, setCurrentResponse] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
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
  const [conversationHistory, setConversationHistory] = useState<
    Array<{
      role: "user" | "system";
      content: string;
      audioFileId?: string;
      timestamp: Date;
    }>
  >([]);
  const [isInteractiveSession, setIsInteractiveSession] = useState(false);
  const [isMicTesting, setIsMicTesting] = useState(false);
  const [micTestResult, setMicTestResult] = useState<
    "success" | "failed" | null
  >(null);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(
    null
  );
  const isRecordingRef = useRef(false);

  // tRPC queries
  const {
    data: personas,
    isLoading: personasLoading,
    error: personasError,
  } = trpc.personas.list.useQuery();
  const {
    data: mainPersona,
    isLoading: mainPersonaLoading,
    error: mainPersonaError,
  } = trpc.personas.getMain.useQuery();

  // Debug logging
  React.useEffect(() => {
    console.log("Personas loading:", personasLoading, "Error:", personasError);
    console.log("Personas data:", personas);
    console.log(
      "Main persona loading:",
      mainPersonaLoading,
      "Error:",
      mainPersonaError
    );
    console.log("Main persona data:", mainPersona);
  }, [
    personas,
    personasLoading,
    personasError,
    mainPersona,
    mainPersonaLoading,
    mainPersonaError,
  ]);

  // Cleanup audio recording on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
      }
    };
  }, [mediaRecorder]);

  // tRPC mutations
  const startInterviewMutation = trpc.learning.startInterview.useMutation();

  const answerQuestionMutation = trpc.learning.answerQuestion.useMutation();

  // Initialize with main persona
  useEffect(() => {
    if (mainPersona && !selectedPersonaId) {
      setSelectedPersonaId(mainPersona.id);
    }
  }, [mainPersona, selectedPersonaId]);

  // Automatically request microphone permission when component loads
  useEffect(() => {
    const autoRequestMicPermission = async () => {
      // Only auto-request if we haven't checked yet and user is authenticated
      if (permissionGranted === null && user) {
        console.log("Auto-requesting microphone permission on component load");
        await requestMicrophonePermission();
      }
    };

    // Add a delay to avoid requesting permission immediately on page load
    const timer = setTimeout(autoRequestMicPermission, 1000);
    return () => clearTimeout(timer);
  }, [user, permissionGranted]);

  // Request microphone permissions proactively
  const requestMicrophonePermission = useCallback(async () => {
    if (permissionGranted === true) {
      console.log("Microphone permission already granted");
      return true;
    }

    try {
      console.log("Requesting microphone permission...");
      setIsRequestingPermission(true);
      setRecordingError(null);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Audio recording is not supported in this browser");
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      // Stop the stream immediately - we just wanted to get permission
      stream.getTracks().forEach((track) => track.stop());

      console.log("Microphone permission granted successfully");
      setPermissionGranted(true);
      setIsRequestingPermission(false);
      return true;
    } catch (error) {
      console.error("Microphone permission request failed:", error);

      let errorMessage = "Could not access microphone.";

      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          errorMessage =
            "Microphone access was denied. Please click the microphone icon in your browser's address bar and allow access, then try again.";
        } else if (error.name === "NotFoundError") {
          errorMessage =
            "No microphone found. Please connect a microphone and click 'Test Microphone' below.";
        } else if (error.name === "NotSupportedError") {
          errorMessage =
            "Audio recording is not supported in this browser. Try using Chrome, Firefox, or Safari.";
        } else if (error.name === "OverconstrainedError") {
          errorMessage =
            "Microphone settings are not supported. Try a different microphone.";
        } else {
          errorMessage = error.message || errorMessage;
        }
      }

      setRecordingError(errorMessage);
      setPermissionGranted(false);
      setIsRequestingPermission(false);
      return false;
    }
  }, [permissionGranted]);

  // Audio recording functions
  const startRecording = async () => {
    try {
      setRecordingError(null);
      console.log("Starting recording...");

      // First, ensure we have microphone permission
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        console.log("Recording cancelled - no microphone permission");
        return;
      }

      // Check if mediaDevices is supported
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

      // Create audio context for sound level monitoring
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      // Monitor audio levels
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateAudioLevel = () => {
        if (isRecordingRef.current) {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel((average / 255) * 100); // Convert to percentage
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
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        setRecordedAudio(audioBlob);
        setAudioLevel(0);

        // Stop all tracks to turn off microphone
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

  // Test microphone functionality
  const testMicrophone = async () => {
    setIsMicTesting(true);
    setMicTestResult(null);
    setRecordingError(null);

    try {
      console.log("Testing microphone access...");

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Audio recording is not supported in this browser");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      // Test for 2 seconds
      console.log("Microphone access granted, testing for 2 seconds...");

      setTimeout(() => {
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
        setMicTestResult("success");
        setIsMicTesting(false);
        console.log("Microphone test successful!");
      }, 2000);
    } catch (error) {
      console.error("Microphone test failed:", error);

      let errorMessage = "Microphone test failed.";

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
      setMicTestResult("failed");
      setIsMicTesting(false);
    }
  };

  // Upload recorded audio to S3
  const uploadAudioFile = async (audioBlob: Blob): Promise<string | null> => {
    const tokens = AuthUtils.getTokens();
    if (!tokens?.accessToken) {
      console.error("No authentication token available");
      return null;
    }

    try {
      setIsUploadingAudio(true);
      setAudioUploadProgress(0);

      // Convert blob to File object
      const timestamp = Date.now();
      const audioFile = new File(
        [audioBlob],
        `voice-response-${timestamp}.webm`,
        {
          type: "audio/webm",
          lastModified: timestamp,
        }
      );

      console.log(
        "Uploading audio file:",
        audioFile.name,
        "Size:",
        audioFile.size
      );

      // Upload to S3 using existing file upload service
      const uploadResult = await uploadFile(
        audioFile,
        tokens.accessToken,
        undefined, // conversationId
        selectedPersonaId, // personaId for learning context
        (progress) => setAudioUploadProgress(progress)
      );

      if (uploadResult.success) {
        console.log("Audio uploaded successfully:", uploadResult.fileId);
        setUploadedAudioFileId(uploadResult.fileId);
        return uploadResult.fileId;
      } else {
        console.error("Audio upload failed:", uploadResult.error);
        setRecordingError(`Failed to upload audio: ${uploadResult.error}`);
        return null;
      }
    } catch (error) {
      console.error("Error uploading audio:", error);
      setRecordingError("Failed to upload audio file");
      return null;
    } finally {
      setIsUploadingAudio(false);
      setAudioUploadProgress(0);
    }
  };

  const handleStartInterview = async () => {
    if (!selectedPersonaId) {
      console.log("No persona selected");
      return;
    }

    console.log(
      "Starting interview for persona:",
      selectedPersonaId,
      "Type:",
      selectedSessionType
    );

    try {
      const interview = await startInterviewMutation.mutateAsync({
        personaId: selectedPersonaId,
        sessionType: selectedSessionType,
      });

      console.log("Interview started:", interview);

      // Check if this is an interactive discussion session
      const isInteractive = selectedSessionType === "interactive_discussion";
      setIsInteractiveSession(isInteractive);

      // Set the current interview to start the session
      setCurrentInterview({
        id: interview.id,
        personaId: selectedPersonaId,
        sessionType: selectedSessionType,
        status: interview.status,
        questions: interview.questions,
        progress: {
          currentQuestionIndex: 0,
          totalQuestions: interview.questions.length,
          completedQuestions: 0,
        },
      });

      // For interactive sessions, add the initial system message to conversation history
      if (isInteractive && interview.questions.length > 0) {
        setConversationHistory([
          {
            role: "system",
            content: interview.questions[0].question,
            timestamp: new Date(),
          },
        ]);
      }

      // Clear any previous response
      setCurrentResponse("");
      setConversationHistory([]);
      setIsInteractiveSession(false);
    } catch (error) {
      console.error("Failed to start interview:", error);
      alert("Failed to start learning session. Please try again.");
    }
  };

  const handleAnswerQuestion = async (skipQuestion = false) => {
    if (!currentInterview || currentInterview.questions.length === 0) return;

    const currentQuestion =
      currentInterview.questions[
        currentInterview.progress.currentQuestionIndex
      ];

    try {
      let audioFileId: string | null = null;

      // Upload recorded audio to S3 if available
      if (recordedAudio && !skipQuestion) {
        console.log("Uploading audio for this response:", recordedAudio);
        audioFileId = await uploadAudioFile(recordedAudio);

        if (!audioFileId) {
          // If audio upload fails, warn user but continue with text response
          console.warn(
            "Audio upload failed, continuing with text response only"
          );
        }
      }

      // Include audio file ID in media files if upload was successful
      const allMediaFiles = audioFileId
        ? [...uploadedFiles, audioFileId]
        : uploadedFiles;

      // Handle interactive discussion differently
      if (isInteractiveSession && !skipQuestion) {
        // Add user response to conversation history
        const userMessage = {
          role: "user" as const,
          content: currentResponse,
          audioFileId,
          timestamp: new Date(),
        };

        const newHistory = [...conversationHistory, userMessage];
        setConversationHistory(newHistory);

        // Still send to backend for learning analysis
        await answerQuestionMutation.mutateAsync({
          interviewId: currentInterview.id,
          questionId: currentQuestion.id,
          response: currentResponse,
          mediaFiles: allMediaFiles,
          skipQuestion: false,
        });

        // Generate follow-up response for interactive session
        const followUpResponses = [
          "That's interesting! Can you tell me more about that?",
          "I see. What made you feel that way about it?",
          "How did that experience shape your perspective?",
          "What do you think about when you reflect on that?",
          "That sounds meaningful. Would you like to explore that further?",
          "I'd love to hear more about your thoughts on this.",
          "What's been on your mind lately about this topic?",
        ];

        const randomResponse =
          followUpResponses[
            Math.floor(Math.random() * followUpResponses.length)
          ];

        // Add system follow-up after a short delay
        setTimeout(() => {
          const systemResponse = {
            role: "system" as const,
            content: randomResponse,
            timestamp: new Date(),
          };
          setConversationHistory((prev) => [...prev, systemResponse]);
        }, 1000);

        // Clear current response for next input
        setCurrentResponse("");
        setRecordedAudio(null);
        setRecordingError(null);
        setUploadedAudioFileId(null);
        setAudioUploadProgress(0);
        setIsUploadingAudio(false);

        return; // Don't proceed with normal question progression
      }

      const updatedInterview = await answerQuestionMutation.mutateAsync({
        interviewId: currentInterview.id,
        questionId: currentQuestion.id,
        response: skipQuestion ? undefined : currentResponse,
        mediaFiles: allMediaFiles,
        skipQuestion,
      });

      // Update the interview progress
      const nextQuestionIndex =
        currentInterview.progress.currentQuestionIndex + 1;
      const isCompleted =
        nextQuestionIndex >= currentInterview.questions.length;

      if (isCompleted) {
        // Interview completed - update status but keep interview to show completion screen
        setCurrentInterview({
          ...currentInterview,
          status: "completed",
          progress: {
            currentQuestionIndex: currentInterview.questions.length,
            totalQuestions: currentInterview.questions.length,
            completedQuestions: currentInterview.questions.length,
          },
        });
      } else {
        // Move to next question
        setCurrentInterview({
          ...currentInterview,
          progress: {
            currentQuestionIndex: nextQuestionIndex,
            totalQuestions: currentInterview.questions.length,
            completedQuestions: nextQuestionIndex,
          },
        });
      }

      // Clear response for next question
      setCurrentResponse("");
      setUploadedFiles([]);
      setRecordedAudio(null);
      setRecordingError(null);
      setUploadedAudioFileId(null);
      setAudioUploadProgress(0);
      setIsUploadingAudio(false);
    } catch (error) {
      console.error("Failed to answer question:", error);
    }
  };

  const getCurrentQuestion = (): InterviewQuestion | null => {
    if (!currentInterview || currentInterview.questions.length === 0)
      return null;

    const questionIndex = currentInterview.progress?.currentQuestionIndex ?? 0;

    // If we've reached the end of questions, return null (completed)
    if (questionIndex >= currentInterview.questions.length) {
      return null;
    }

    return currentInterview.questions[questionIndex] || null;
  };

  const getSessionTypeInfo = (type: string) => {
    const types = {
      initial: {
        label: "Initial Assessment",
        desc: "Get started with basic personality mapping",
        icon: "🌟",
        duration: "10-15 min",
      },
      simple_questions: {
        label: "Simple Questions",
        desc: "Quick preferences and basic information",
        icon: "❓",
        duration: "5-10 min",
      },
      complex_questions: {
        label: "Complex Questions",
        desc: "Deep personality exploration with detailed responses",
        icon: "🧠",
        duration: "15-25 min",
      },
      scenario_questions: {
        label: "Scenario Based",
        desc: "Hypothetical situations to gauge reactions",
        icon: "🎭",
        duration: "10-20 min",
      },
      social_integration: {
        label: "Social Integration",
        desc: "Connect and learn from social media patterns",
        icon: "🌐",
        duration: "15-30 min",
      },
      interactive_discussion: {
        label: "Interactive Discussion",
        desc: "Natural conversation about anything you'd like to discuss",
        icon: "💬",
        duration: "10-45 min",
      },
    };
    return types[type as keyof typeof types] || types.simple_questions;
  };

  const currentQuestion = getCurrentQuestion();
  const progress = currentInterview?.progress;
  const progressPercentage =
    progress && progress.totalQuestions > 0
      ? (progress.completedQuestions / progress.totalQuestions) * 100
      : 0;

  if (currentInterview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
        {/* Header */}
        <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setCurrentInterview(null)}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Learning Session
                  </h1>
                  <p className="text-sm text-gray-600">
                    {getSessionTypeInfo(currentInterview.sessionType).label}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Progress</p>
                <p className="text-lg font-semibold text-gray-900">
                  {progress?.completedQuestions || 0} /{" "}
                  {progress?.totalQuestions || 0}
                </p>
              </div>
            </div>
          </div>
        </nav>

        {/* Progress Bar */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-600">
              <span>Started</span>
              <span>{Math.round(progressPercentage)}% Complete</span>
              <span>Finish</span>
            </div>
          </div>
        </div>

        {/* Interview Interface */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isInteractiveSession ? (
            // Interactive Discussion Interface
            <div className="bg-white rounded-xl shadow-lg flex flex-col h-[600px]">
              {/* Chat Header */}
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Interactive Discussion
                </h2>
                <p className="text-gray-600">
                  Have a natural conversation about anything you'd like. Your
                  responses help build a more authentic personality profile.
                </p>
              </div>

              {/* Conversation History */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {conversationHistory.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-sm lg:max-w-md px-4 py-3 rounded-lg ${
                        message.role === "user"
                          ? "bg-purple-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      {message.audioFileId && (
                        <div className="mt-2 flex items-center text-xs opacity-75">
                          <svg
                            className="w-3 h-3 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12a7.971 7.971 0 00-1.343-4.243 1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Voice recorded
                        </div>
                      )}
                      <div className="text-xs opacity-75 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input Area */}
              <div className="p-6 border-t border-gray-200 space-y-4">
                {/* Text Input */}
                <div>
                  <textarea
                    value={currentResponse}
                    onChange={(e) => setCurrentResponse(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    placeholder="Share your thoughts, ask questions, or tell me about anything on your mind..."
                  />
                </div>

                {/* Voice Recording */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                            isRecording
                              ? "bg-red-500 animate-pulse"
                              : "bg-gray-300"
                          }`}
                        >
                          <svg
                            className={`w-5 h-5 ${
                              isRecording ? "text-white" : "text-gray-600"
                            }`}
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
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            Voice Response (Optional)
                          </p>
                          <p className="text-xs text-gray-600">
                            {isRecording
                              ? "Recording... Speak naturally"
                              : isRequestingPermission
                              ? "Requesting microphone permission..."
                              : permissionGranted === false
                              ? "Microphone access denied - check browser settings"
                              : permissionGranted === true
                              ? "Microphone ready - Record your thoughts for richer personality insights"
                              : "Record your thoughts for richer personality insights"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={toggleRecording}
                        disabled={
                          !!recordingError ||
                          isRequestingPermission ||
                          permissionGranted === false
                        }
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          isRecording
                            ? "bg-red-600 text-white hover:bg-red-700"
                            : recordedAudio
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : permissionGranted === false
                            ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                            : isRequestingPermission
                            ? "bg-yellow-500 text-white cursor-wait"
                            : "bg-purple-600 text-white hover:bg-purple-700"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {isRecording
                          ? "🔴 Stop"
                          : isRequestingPermission
                          ? "🔄 Getting Permission..."
                          : permissionGranted === false
                          ? "🚫 Mic Blocked"
                          : recordedAudio
                          ? "🎵 Re-record"
                          : "🎤 Record"}
                      </button>
                    </div>

                    {/* Sound Level Meter */}
                    {isRecording && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>Audio Level</span>
                          <span>{Math.round(audioLevel)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-100 ${
                              audioLevel > 50
                                ? "bg-green-500"
                                : audioLevel > 20
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{
                              width: `${Math.min(audioLevel * 2, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Recording Status */}
                    {recordedAudio && !isRecording && !isUploadingAudio && (
                      <div className="flex items-center space-x-2 text-sm text-green-600">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>
                          Voice recorded! This will be analyzed for personality
                          insights.
                        </span>
                      </div>
                    )}

                    {/* Audio Upload Progress */}
                    {isUploadingAudio && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm text-blue-600">
                          <svg
                            className="w-4 h-4 animate-spin"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4 2a2 2 0 00-2 2v11a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm0 2h12v11H4V4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>
                            Uploading for AI analysis...{" "}
                            {Math.round(audioUploadProgress)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${audioUploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Recording Error */}
                    {recordingError && (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 text-sm text-red-600">
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>{recordingError}</span>
                          <button
                            onClick={() => setRecordingError(null)}
                            className="text-red-800 hover:text-red-900 underline"
                          >
                            Try Again
                          </button>
                        </div>

                        {/* Microphone Setup Instructions */}
                        <MicrophoneSetupInstructions
                          onTestMicrophone={testMicrophone}
                          isTesting={isMicTesting}
                          testResult={micTestResult}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Send Button */}
                <div className="flex space-x-4">
                  <button
                    onClick={() => setCurrentInterview(null)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    End Discussion
                  </button>
                  <button
                    onClick={() => handleAnswerQuestion(false)}
                    disabled={
                      !currentResponse.trim() ||
                      isUploadingAudio ||
                      answerQuestionMutation.isLoading
                    }
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {answerQuestionMutation.isLoading
                      ? "Processing..."
                      : isUploadingAudio
                      ? "Uploading Audio..."
                      : "Share Response"}
                  </button>
                </div>
              </div>
            </div>
          ) : currentQuestion ? (
            <div className="bg-white rounded-xl shadow-lg p-8">
              {/* Question Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-white">
                    {currentQuestion.type === "simple" && "❓"}
                    {currentQuestion.type === "complex" && "🧠"}
                    {currentQuestion.type === "scenario" && "🎭"}
                    {currentQuestion.type === "choice" && "📋"}
                    {currentQuestion.type === "media" && "📸"}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {currentQuestion.question}
                </h2>
                {currentQuestion.description && (
                  <p className="text-gray-600">{currentQuestion.description}</p>
                )}
                {currentQuestion.estimatedTime && (
                  <p className="text-sm text-purple-600 mt-2">
                    ⏱️ Estimated time: {currentQuestion.estimatedTime} minutes
                  </p>
                )}
              </div>

              {/* Question Type Specific UI */}
              <div className="space-y-6">
                {/* Multiple Choice */}
                {currentQuestion.type === "choice" &&
                  currentQuestion.options && (
                    <div className="space-y-3">
                      {currentQuestion.options.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentResponse(option)}
                          className={`w-full p-4 text-left border-2 rounded-lg transition-colors ${
                            currentResponse === option
                              ? "border-purple-500 bg-purple-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center">
                            <div
                              className={`w-4 h-4 rounded-full border-2 mr-3 ${
                                currentResponse === option
                                  ? "border-purple-500 bg-purple-500"
                                  : "border-gray-300"
                              }`}
                            >
                              {currentResponse === option && (
                                <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                              )}
                            </div>
                            <span className="text-gray-900">{option}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                {/* Text Response */}
                {(currentQuestion.type === "simple" ||
                  currentQuestion.type === "complex" ||
                  currentQuestion.type === "scenario") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Response
                    </label>
                    <textarea
                      value={currentResponse}
                      onChange={(e) => setCurrentResponse(e.target.value)}
                      rows={currentQuestion.type === "simple" ? 3 : 6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      placeholder={
                        currentQuestion.type === "simple"
                          ? "Share your thoughts briefly..."
                          : currentQuestion.type === "complex"
                          ? "Take your time to provide a detailed response..."
                          : "How would you handle this situation? What would you think and feel?"
                      }
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      {currentQuestion.type === "complex"
                        ? "Feel free to be detailed - this helps us understand you better"
                        : "A few sentences is perfect"}
                    </p>
                  </div>
                )}

                {/* Media Upload */}
                {currentQuestion.requiresMedia && (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="text-center">
                      <svg
                        className="w-12 h-12 text-gray-400 mx-auto mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <p className="text-gray-600 mb-2">
                        Upload photos or videos to help express your response
                      </p>
                      <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                        Choose Files
                      </button>
                      <p className="text-xs text-gray-500 mt-2">
                        Supports images and videos up to 50MB
                      </p>
                    </div>
                  </div>
                )}

                {/* Voice Recording */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                            isRecording
                              ? "bg-red-500 animate-pulse"
                              : "bg-gray-300"
                          }`}
                        >
                          <svg
                            className={`w-5 h-5 ${
                              isRecording ? "text-white" : "text-gray-600"
                            }`}
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
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            Voice Response (Optional)
                          </p>
                          <p className="text-xs text-gray-600">
                            {isRecording
                              ? "Recording... Speak clearly into your microphone"
                              : isRequestingPermission
                              ? "Requesting microphone permission..."
                              : permissionGranted === false
                              ? "Microphone access denied - check browser settings below"
                              : permissionGranted === true
                              ? "Microphone ready - Record your answer for better personality analysis"
                              : "Record your answer for better personality analysis"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={toggleRecording}
                        disabled={
                          !!recordingError ||
                          isRequestingPermission ||
                          permissionGranted === false
                        }
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          isRecording
                            ? "bg-red-600 text-white hover:bg-red-700"
                            : recordedAudio
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : permissionGranted === false
                            ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                            : isRequestingPermission
                            ? "bg-yellow-500 text-white cursor-wait"
                            : "bg-purple-600 text-white hover:bg-purple-700"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {isRecording
                          ? "🔴 Stop Recording"
                          : isRequestingPermission
                          ? "🔄 Getting Permission..."
                          : permissionGranted === false
                          ? "🚫 Microphone Blocked"
                          : recordedAudio
                          ? "🎵 Re-record"
                          : "🎤 Start Recording"}
                      </button>
                    </div>

                    {/* Sound Level Meter */}
                    {isRecording && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>Audio Level</span>
                          <span>{Math.round(audioLevel)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-100 ${
                              audioLevel > 50
                                ? "bg-green-500"
                                : audioLevel > 20
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{
                              width: `${Math.min(audioLevel * 2, 100)}%`,
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Quiet</span>
                          <span>Good</span>
                          <span>Loud</span>
                        </div>
                      </div>
                    )}

                    {/* Recording Status */}
                    {recordedAudio && !isRecording && !isUploadingAudio && (
                      <div className="flex items-center space-x-2 text-sm text-green-600">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>
                          Audio recorded successfully! This will be uploaded and
                          analyzed for personality insights.
                        </span>
                      </div>
                    )}

                    {/* Audio Upload Progress */}
                    {isUploadingAudio && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm text-blue-600">
                          <svg
                            className="w-4 h-4 animate-spin"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4 2a2 2 0 00-2 2v11a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm0 2h12v11H4V4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>
                            Uploading audio for AI analysis...{" "}
                            {Math.round(audioUploadProgress)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${audioUploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Recording Error */}
                    {recordingError && (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 text-sm text-red-600">
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>{recordingError}</span>
                          <button
                            onClick={() => setRecordingError(null)}
                            className="text-red-800 hover:text-red-900 underline"
                          >
                            Try Again
                          </button>
                        </div>

                        {/* Microphone Setup Instructions */}
                        <MicrophoneSetupInstructions
                          onTestMicrophone={testMicrophone}
                          isTesting={isMicTesting}
                          testResult={micTestResult}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => handleAnswerQuestion(true)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Skip Question
                </button>
                <button
                  onClick={() => handleAnswerQuestion(false)}
                  disabled={
                    (!currentResponse.trim() &&
                      currentQuestion.type !== "choice") ||
                    isUploadingAudio ||
                    answerQuestionMutation.isLoading
                  }
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {answerQuestionMutation.isLoading
                    ? "Processing..."
                    : isUploadingAudio
                    ? "Uploading Audio..."
                    : progress?.currentQuestionIndex ===
                      (progress?.totalQuestions || 0) - 1
                    ? "Complete Session"
                    : "Next Question"}
                </button>
              </div>
            </div>
          ) : (
            // Interview completed
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Session Complete!
              </h2>
              <p className="text-gray-600 mb-8">
                Great job! Your responses have been processed and your persona
                is now more personalized.
              </p>
              <div className="flex space-x-4 justify-center">
                <button
                  onClick={() => router.push("/personas")}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  View Persona
                </button>
                <button
                  onClick={() => setCurrentInterview(null)}
                  className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Start New Session
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Session Selection UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/personas")}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  AI Learning Sessions
                </h1>
                <p className="text-sm text-gray-600">
                  Help your personas learn and grow through interactive
                  questions
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.name}!</span>
              <button
                onClick={() => logout()}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-white"
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
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Choose Your Learning Session
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Select a persona and session type to begin an AI-guided interview
              that will help personalize your digital assistant.
            </p>
          </div>

          {/* Persona Selection */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Persona to Train
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {personas?.map((persona) => (
                <button
                  key={persona.id}
                  onClick={() => setSelectedPersonaId(persona.id)}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    selectedPersonaId === persona.id
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-semibold">
                      {persona.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {persona.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {persona.description || "Main digital persona"}
                      </p>
                      <div className="flex items-center mt-1">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            persona.isDefault
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {persona.isDefault ? "Main" : "Child"}
                        </span>
                        {(persona as any).learningEnabled && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Learning Active
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Session Type Selection */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Choose Session Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                "initial",
                "simple_questions",
                "complex_questions",
                "scenario_questions",
                "social_integration",
                "interactive_discussion",
              ].map((type) => {
                const info = getSessionTypeInfo(type);
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedSessionType(type as any)}
                    className={`p-6 border-2 rounded-lg text-left transition-colors ${
                      selectedSessionType === type
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-3xl mb-3">{info.icon}</div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {info.label}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">{info.desc}</p>
                    <div className="flex items-center text-xs text-purple-600">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {info.duration}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Start Button */}
          <div className="text-center">
            <button
              onClick={handleStartInterview}
              disabled={
                !selectedPersonaId ||
                startInterviewMutation.isLoading ||
                personasLoading
              }
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-lg font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {startInterviewMutation.isLoading
                ? "Starting Session..."
                : personasLoading
                ? "Loading Personas..."
                : "Begin Learning Session"}
            </button>
            <p className="text-sm text-gray-600 mt-3">
              Sessions are adaptive and can be paused at any time
            </p>
            {personasError && (
              <p className="text-sm text-red-600 mt-2">
                Error loading personas: {personasError.message}
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LearningPage() {
  return (
    <AuthGuard>
      <LearningPageContent />
    </AuthGuard>
  );
}
