import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  MessageSquare,
  Upload,
  BarChart3,
  Plus,
  Eye,
  Volume2,
  Brain,
  Zap,
  Sparkles,
  TrendingUp,
  Clock,
} from "lucide-react";
import { Persona, Conversation, ChatStats } from "../../types";
import apiService from "../../services/api";
import toast from "react-hot-toast";

const HomePage: React.FC = () => {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [stats, setStats] = useState<ChatStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [personasData, conversationsData, statsData] = await Promise.all([
          apiService.getPersonas(),
          apiService.getConversations(),
          apiService.getChatStats(),
        ]);

        setPersonas(personasData);
        setConversations(conversationsData);
        setStats(statsData);
      } catch (error) {
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-4">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome to Digital Persona Platform
            </h1>
            <p className="text-white/80 text-lg">
              Create your digital self and build AI personas that represent you.
            </p>
          </div>
        </div>
        <p className="text-white/70">
          Start by creating your own digital persona to capture your
          personality, memories, and unique characteristics. Your AI companions
          are ready to learn from you.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
          <div className="flex items-center">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <Users className="h-6 w-6 text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-white/70">Persona</p>
              <p className="text-2xl font-bold text-white">1</p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
          <div className="flex items-center">
            <div className="p-3 bg-green-500/20 rounded-xl">
              <MessageSquare className="h-6 w-6 text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-white/70">Conversations</p>
              <p className="text-2xl font-bold text-white">
                {conversations.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
          <div className="flex items-center">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <BarChart3 className="h-6 w-6 text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-white/70">
                Total Messages
              </p>
              <p className="text-2xl font-bold text-white">
                {stats?.total_messages || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
          <div className="flex items-center">
            <div className="p-3 bg-pink-500/20 rounded-xl">
              <Upload className="h-6 w-6 text-pink-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-white/70">
                Files Uploaded
              </p>
              <p className="text-2xl font-bold text-white">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <div className="flex items-center mb-6">
            <TrendingUp className="h-5 w-5 text-purple-400 mr-2" />
            <h3 className="text-xl font-semibold text-white">Quick Actions</h3>
          </div>
          <div className="space-y-3">
            <Link
              to="/dashboard/personas"
              className="flex items-center p-4 text-white/80 hover:bg-white/10 rounded-xl transition-all duration-200 group"
            >
              <div className="p-2 bg-purple-500/20 rounded-lg mr-3 group-hover:bg-purple-500/30 transition-all duration-200">
                <Plus className="h-5 w-5 text-purple-400" />
              </div>
              <span className="font-medium">View Persona</span>
            </Link>
            <Link
              to="/dashboard/conversations"
              className="flex items-center p-4 text-white/80 hover:bg-white/10 rounded-xl transition-all duration-200 group"
            >
              <div className="p-2 bg-green-500/20 rounded-lg mr-3 group-hover:bg-green-500/30 transition-all duration-200">
                <MessageSquare className="h-5 w-5 text-green-400" />
              </div>
              <span className="font-medium">Start New Conversation</span>
            </Link>
            <Link
              to="/dashboard/upload"
              className="flex items-center p-4 text-white/80 hover:bg-white/10 rounded-xl transition-all duration-200 group"
            >
              <div className="p-2 bg-blue-500/20 rounded-lg mr-3 group-hover:bg-blue-500/30 transition-all duration-200">
                <Upload className="h-5 w-5 text-blue-400" />
              </div>
              <span className="font-medium">Upload Files</span>
            </Link>
          </div>

          {/* AI Capabilities Quick Actions */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <h4 className="text-sm font-medium text-white/70 mb-4 uppercase tracking-wider">
              AI Capabilities
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  // Switch to Image Analysis tab in Dashboard
                  const dashboard = document.querySelector(
                    '[data-tab="image"]'
                  ) as HTMLElement;
                  if (dashboard) dashboard.click();
                }}
                className="flex items-center p-3 text-white/70 hover:bg-white/10 rounded-xl transition-all duration-200 text-left group"
              >
                <Eye className="h-4 w-4 mr-2 text-green-400 group-hover:text-green-300" />
                <span className="text-sm">Analyze Images</span>
              </button>
              <button
                onClick={() => {
                  // Switch to Voice Synthesis tab in Dashboard
                  const dashboard = document.querySelector(
                    '[data-tab="voice"]'
                  ) as HTMLElement;
                  if (dashboard) dashboard.click();
                }}
                className="flex items-center p-3 text-white/70 hover:bg-white/10 rounded-xl transition-all duration-200 text-left group"
              >
                <Volume2 className="h-4 w-4 mr-2 text-blue-400 group-hover:text-blue-300" />
                <span className="text-sm">Voice Synthesis</span>
              </button>
              <button
                onClick={() => {
                  // Switch to Memory Management tab in Dashboard
                  const dashboard = document.querySelector(
                    '[data-tab="memory"]'
                  ) as HTMLElement;
                  if (dashboard) dashboard.click();
                }}
                className="flex items-center p-3 text-white/70 hover:bg-white/10 rounded-xl transition-all duration-200 text-left group"
              >
                <Brain className="h-4 w-4 mr-2 text-purple-400 group-hover:text-purple-300" />
                <span className="text-sm">Memory Management</span>
              </button>
              <button
                onClick={() => {
                  // Switch to main dashboard
                  const dashboard = document.querySelector(
                    '[data-tab="main"]'
                  ) as HTMLElement;
                  if (dashboard) dashboard.click();
                }}
                className="flex items-center p-3 text-white/70 hover:bg-white/10 rounded-xl transition-all duration-200 text-left group"
              >
                <Zap className="h-4 w-4 mr-2 text-orange-400 group-hover:text-orange-300" />
                <span className="text-sm">AI Learning</span>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <div className="flex items-center mb-6">
            <Clock className="h-5 w-5 text-purple-400 mr-2" />
            <h3 className="text-xl font-semibold text-white">
              Recent Activity
            </h3>
          </div>
          {conversations.length > 0 ? (
            <div className="space-y-3">
              {conversations.slice(0, 3).map((conversation) => (
                <div
                  key={conversation.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-200"
                >
                  <div>
                    <p className="font-medium text-white">
                      {conversation.title}
                    </p>
                    <p className="text-sm text-white/60">
                      {new Date(conversation.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Link
                    to={`/dashboard/conversations/${conversation.id}`}
                    className="text-purple-400 hover:text-purple-300 text-sm font-medium px-3 py-1 bg-purple-500/20 rounded-lg hover:bg-purple-500/30 transition-all duration-200"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-white/30 mx-auto mb-4" />
              <p className="text-white/50">No recent conversations</p>
              <p className="text-white/30 text-sm mt-1">
                Start your first conversation to see activity here
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Personas Overview */}
      {personas.length > 0 && (
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-purple-400 mr-2" />
              <h3 className="text-xl font-semibold text-white">
                Your Personas
              </h3>
            </div>
            <Link
              to="/dashboard/personas"
              className="text-purple-400 hover:text-purple-300 text-sm font-medium px-4 py-2 bg-purple-500/20 rounded-lg hover:bg-purple-500/30 transition-all duration-200"
            >
              View All
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {personas.slice(0, 6).map((persona) => (
              <div
                key={persona.id}
                className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-200 group"
              >
                <h4 className="font-medium text-white mb-1 group-hover:text-purple-300 transition-colors duration-200">
                  {persona.name}
                </h4>
                <p className="text-sm text-white/60 mb-2">
                  {persona.relation_type}
                </p>
                {persona.description && (
                  <p className="text-sm text-white/70 line-clamp-2">
                    {persona.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
