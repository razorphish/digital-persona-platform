"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { trpc } from "@/lib/trpc";

// Types for learning interviews (matching backend response)
interface LearningInterview {
  id: string;
  personaId?: string;
  sessionType?:
    | "initial"
    | "simple_questions"
    | "complex_questions"
    | "scenario_questions"
    | "social_integration";
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
  type: "simple" | "complex" | "scenario" | "choice" | "media";
  question: string;
  options?: string[];
  description?: string;
  requiresMedia?: boolean;
  estimatedTime?: number;
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
  >("simple_questions");
  const [currentInterview, setCurrentInterview] =
    useState<LearningInterview | null>(null);
  const [currentResponse, setCurrentResponse] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  // tRPC queries
  const { data: personas } = trpc.personas.list.useQuery();
  const { data: mainPersona } = trpc.personas.getMain.useQuery();

  // tRPC mutations
  const startInterviewMutation = trpc.learning.startInterview.useMutation();

  const answerQuestionMutation = trpc.learning.answerQuestion.useMutation();

  // Initialize with main persona
  useEffect(() => {
    if (mainPersona && !selectedPersonaId) {
      setSelectedPersonaId(mainPersona.id);
    }
  }, [mainPersona, selectedPersonaId]);

  const handleStartInterview = async () => {
    if (!selectedPersonaId) return;

    try {
      await startInterviewMutation.mutateAsync({
        personaId: selectedPersonaId,
        sessionType: selectedSessionType,
      });
    } catch (error) {
      console.error("Failed to start interview:", error);
    }
  };

  const handleAnswerQuestion = async (skipQuestion = false) => {
    if (!currentInterview || currentInterview.questions.length === 0) return;

    const currentQuestion =
      currentInterview.questions[
        currentInterview.progress.currentQuestionIndex
      ];

    try {
      await answerQuestionMutation.mutateAsync({
        interviewId: currentInterview.id,
        questionId: currentQuestion.id,
        response: skipQuestion ? undefined : currentResponse,
        mediaFiles: uploadedFiles,
        skipQuestion,
      });
    } catch (error) {
      console.error("Failed to answer question:", error);
    }
  };

  const getCurrentQuestion = (): InterviewQuestion | null => {
    if (!currentInterview || currentInterview.questions.length === 0)
      return null;
    return (
      currentInterview.questions[
        currentInterview.progress.currentQuestionIndex
      ] || null
    );
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
    };
    return types[type as keyof typeof types] || types.simple_questions;
  };

  const currentQuestion = getCurrentQuestion();
  const progress = currentInterview?.progress;
  const progressPercentage = progress
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
          {currentQuestion ? (
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isRecording ? "bg-red-500" : "bg-gray-300"
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
                          Record your answer for better personality analysis
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsRecording(!isRecording)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        isRecording
                          ? "bg-red-600 text-white hover:bg-red-700"
                          : "bg-purple-600 text-white hover:bg-purple-700"
                      }`}
                    >
                      {isRecording ? "Stop Recording" : "Start Recording"}
                    </button>
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
                    !currentResponse.trim() && currentQuestion.type !== "choice"
                  }
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {progress?.currentQuestionIndex ===
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
              disabled={!selectedPersonaId || startInterviewMutation.isLoading}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-lg font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {startInterviewMutation.isLoading
                ? "Starting Session..."
                : "Begin Learning Session"}
            </button>
            <p className="text-sm text-gray-600 mt-3">
              Sessions are adaptive and can be paused at any time
            </p>
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
