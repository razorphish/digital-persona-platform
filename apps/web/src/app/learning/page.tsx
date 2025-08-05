"use client";

import React, { useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import MainNavigation from "@/components/navigation/MainNavigation";

interface LearningModule {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  progress: number;
  thumbnail: string;
}

function LearningPageContent() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const learningModules: LearningModule[] = [
    {
      id: "1",
      title: "Building Your First Persona",
      description:
        "Learn the fundamentals of creating an engaging AI persona that represents you authentically.",
      category: "Getting Started",
      duration: "15 min",
      difficulty: "Beginner",
      progress: 80,
      thumbnail: "🤖",
    },
    {
      id: "2",
      title: "Monetization Strategies",
      description:
        "Discover effective ways to generate income from your digital personas and content.",
      category: "Business",
      duration: "25 min",
      difficulty: "Intermediate",
      progress: 30,
      thumbnail: "💰",
    },
    {
      id: "3",
      title: "Advanced Conversation Techniques",
      description:
        "Master the art of creating compelling and natural conversations with your personas.",
      category: "Advanced",
      duration: "35 min",
      difficulty: "Advanced",
      progress: 0,
      thumbnail: "💬",
    },
    {
      id: "4",
      title: "Building Your Audience",
      description:
        "Learn proven strategies to grow your subscriber base and increase engagement.",
      category: "Marketing",
      duration: "20 min",
      difficulty: "Intermediate",
      progress: 60,
      thumbnail: "📈",
    },
    {
      id: "5",
      title: "Safety and Privacy Best Practices",
      description:
        "Understand how to protect yourself and your content while building your digital presence.",
      category: "Safety",
      duration: "18 min",
      difficulty: "Beginner",
      progress: 100,
      thumbnail: "🛡️",
    },
    {
      id: "6",
      title: "Analytics and Performance Tracking",
      description:
        "Learn to interpret your persona's performance data and optimize for better results.",
      category: "Analytics",
      duration: "30 min",
      difficulty: "Intermediate",
      progress: 15,
      thumbnail: "📊",
    },
  ];

  const categories = [
    "all",
    "Getting Started",
    "Business",
    "Advanced",
    "Marketing",
    "Safety",
    "Analytics",
  ];

  const filteredModules =
    selectedCategory === "all"
      ? learningModules
      : learningModules.filter(
          (module) => module.category === selectedCategory
        );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-100 text-green-800";
      case "Intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "Advanced":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavigation />

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Learning Center
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Master the art of digital persona creation and monetization
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                }`}
              >
                {category === "all" ? "All Courses" : category}
              </button>
            ))}
          </div>
        </div>

        {/* Learning Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModules.map((module) => (
            <div
              key={module.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Module Header */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl">{module.thumbnail}</div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
                      module.difficulty
                    )}`}
                  >
                    {module.difficulty}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {module.title}
                </h3>

                <p className="text-gray-600 text-sm mb-4">
                  {module.description}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>📚 {module.category}</span>
                  <span>⏱️ {module.duration}</span>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Progress</span>
                    <span className="text-gray-900 font-medium">
                      {module.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${module.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Action Button */}
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                  {module.progress === 0
                    ? "Start Learning"
                    : module.progress === 100
                    ? "Review"
                    : "Continue"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {learningModules.filter((m) => m.progress === 100).length}
            </div>
            <div className="text-gray-600">Completed Courses</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-green-600 mb-2">
              {
                learningModules.filter(
                  (m) => m.progress > 0 && m.progress < 100
                ).length
              }
            </div>
            <div className="text-gray-600">In Progress</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-purple-600 mb-2">
              {Math.round(
                learningModules.reduce((acc, m) => acc + m.progress, 0) /
                  learningModules.length
              )}
              %
            </div>
            <div className="text-gray-600">Overall Progress</div>
          </div>
        </div>

        {/* Recommended Next Steps */}
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🎯 Recommended Next Steps
          </h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span className="text-gray-700">
                Complete "Building Your First Persona" to unlock advanced
                features
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span className="text-gray-700">
                Explore monetization strategies to start earning from your
                personas
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span className="text-gray-700">
                Join our community discord to connect with other creators
              </span>
            </div>
          </div>
        </div>
      </div>
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
