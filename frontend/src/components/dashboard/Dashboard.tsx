import React, { useState, lazy, Suspense } from "react";
import { useNavigate, Outlet, NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  Home,
  Users,
  MessageSquare,
  Upload,
  BarChart3,
  Settings,
  Plus,
  User,
  LogOut,
  Bell,
  Menu,
  X,
  Sparkles,
  Brain,
  Mic,
  Image,
  Activity,
} from "lucide-react";
import { CreatePersonaRequest, CreateConversationRequest } from "../../types";
import apiService from "../../services/api";
import toast from "react-hot-toast";
import CreatePersonaModal from "../personas/CreatePersonaModal";
import CreateConversationModal from "../conversations/CreateConversationModal";

// Lazy load AI panels
const ImageAnalysisPanel = lazy(() => import("../ai/ImageAnalysisPanel"));
const VoiceSynthesisPanel = lazy(() => import("../ai/VoiceSynthesisPanel"));
const MemoryPanel = lazy(() => import("../ai/MemoryPanel"));
const AIStatsPanel = lazy(() => import("../ai/AIStatsPanel"));

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("main");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateConversationModal, setShowCreateConversationModal] =
    useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleCreatePersona = async (personaData: CreatePersonaRequest) => {
    try {
      await apiService.createPersona(personaData);
      toast.success("Persona created successfully!");
      setShowCreateModal(false);
      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to create persona");
    }
  };

  const handleCreateConversation = async (
    conversationData: CreateConversationRequest
  ) => {
    try {
      await apiService.createConversation(conversationData);
      toast.success("Conversation created successfully!");
      setShowCreateConversationModal(false);
      window.location.reload();
    } catch (error: any) {
      toast.error(
        error.response?.data?.detail || "Failed to create conversation"
      );
    }
  };

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Personas", href: "/dashboard/personas", icon: Users },
    {
      name: "Conversations",
      href: "/dashboard/conversations",
      icon: MessageSquare,
    },
    { name: "File Upload", href: "/dashboard/upload", icon: Upload },
    { name: "Statistics", href: "/dashboard/stats", icon: BarChart3 },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const aiTabs = [
    { id: "main", name: "Main Dashboard", icon: Sparkles },
    { id: "image", name: "Image Analysis", icon: Image },
    { id: "voice", name: "Voice Synthesis", icon: Mic },
    { id: "memory", name: "Memory Management", icon: Brain },
    { id: "stats", name: "AI Statistics", icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white/10 backdrop-blur-xl border-r border-white/20 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">DPP</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 text-white/70 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-white/20 text-white shadow-lg"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`
                  }
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>

          {/* Quick Actions */}
          <div className="p-4 border-t border-white/10">
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3 px-2">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full flex items-center px-4 py-3 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white rounded-xl transition-all duration-200"
              >
                <Plus className="h-5 w-5 mr-3" />
                Create Digital Self
              </button>
              <button
                onClick={() => setShowCreateConversationModal(true)}
                className="w-full flex items-center px-4 py-3 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white rounded-xl transition-all duration-200"
              >
                <Plus className="h-5 w-5 mr-3" />
                New Conversation
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-xl border-b border-white/20">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-white/70 hover:text-white mr-4"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-semibold text-white">Hibiji</h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200">
                <Bell className="h-5 w-5" />
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/10 transition-all duration-200"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-white hidden sm:block">
                    {user?.username || user?.email}
                  </span>
                </button>

                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur-xl rounded-xl shadow-lg py-1 z-50 border border-white/20">
                    <div className="px-4 py-2 text-sm text-white border-b border-white/10">
                      <div className="font-medium">
                        {user?.full_name || user?.username}
                      </div>
                      <div className="text-white/70">{user?.email}</div>
                    </div>

                    <button className="w-full text-left px-4 py-2 text-sm text-white/70 hover:bg-white/10 flex items-center">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-white/70 hover:bg-white/10 flex items-center"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          {/* AI Capabilities Tabs */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-2">
              {aiTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-4 py-2 rounded-xl transition-all duration-200 ${
                      activeTab === tab.id
                        ? "bg-white/20 text-white shadow-lg"
                        : "bg-white/10 text-white/70 hover:bg-white/15 hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Area */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            {activeTab === "main" && <Outlet />}
            {activeTab === "image" && (
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                  </div>
                }
              >
                <MemoryPanel />
              </Suspense>
            )}
            {activeTab === "stats" && (
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                  </div>
                }
              >
                <AIStatsPanel />
              </Suspense>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreatePersonaModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreatePersona}
          editingPersona={null}
        />
      )}

      {showCreateConversationModal && (
        <CreateConversationModal
          onClose={() => setShowCreateConversationModal(false)}
          onSubmit={handleCreateConversation}
          editingConversation={null}
        />
      )}
    </div>
  );
};

export default Dashboard;
