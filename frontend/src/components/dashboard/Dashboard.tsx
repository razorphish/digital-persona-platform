import React, { useState, lazy, Suspense } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Sidebar from "./Sidebar";
import Header from "./Header";

// Lazy load AI panels
const ImageAnalysisPanel = lazy(() => import("../ai/ImageAnalysisPanel"));
const VoiceSynthesisPanel = lazy(() => import("../ai/VoiceSynthesisPanel"));
const MemoryPanel = lazy(() => import("../ai/MemoryPanel"));

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("main");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={handleLogout} />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-6">
          {/* AI Capabilities Tabs */}
          <div className="mb-6">
            <div className="flex space-x-4 border-b">
              <button
                data-tab="main"
                className={`py-2 px-4 ${
                  activeTab === "main"
                    ? "border-b-2 border-primary-500 text-primary-600"
                    : "text-gray-600"
                }`}
                onClick={() => setActiveTab("main")}
              >
                Main Dashboard
              </button>
              <button
                data-tab="image"
                className={`py-2 px-4 ${
                  activeTab === "image"
                    ? "border-b-2 border-primary-500 text-primary-600"
                    : "text-gray-600"
                }`}
                onClick={() => setActiveTab("image")}
              >
                Image Analysis
              </button>
              <button
                data-tab="voice"
                className={`py-2 px-4 ${
                  activeTab === "voice"
                    ? "border-b-2 border-primary-500 text-primary-600"
                    : "text-gray-600"
                }`}
                onClick={() => setActiveTab("voice")}
              >
                Voice Synthesis
              </button>
              <button
                data-tab="memory"
                className={`py-2 px-4 ${
                  activeTab === "memory"
                    ? "border-b-2 border-primary-500 text-primary-600"
                    : "text-gray-600"
                }`}
                onClick={() => setActiveTab("memory")}
              >
                Memory Management
              </button>
            </div>
          </div>

          {/* Content Area */}
          {activeTab === "main" && <Outlet />}
          {activeTab === "image" && (
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
              }
            >
              <ImageAnalysisPanel />
            </Suspense>
          )}
          {activeTab === "voice" && (
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
              }
            >
              <VoiceSynthesisPanel />
            </Suspense>
          )}
          {activeTab === "memory" && (
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
              }
            >
              <MemoryPanel />
            </Suspense>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
