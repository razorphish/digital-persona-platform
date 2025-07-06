import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users, MessageSquare, Upload, BarChart3, Plus } from "lucide-react";
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome to Digital Persona Platform
        </h1>
        <p className="text-primary-100">
          Create AI personas, have meaningful conversations, and explore the
          future of digital interaction.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Users className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Personas
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {personas.length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <MessageSquare className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Conversations</p>
              <p className="text-2xl font-semibold text-gray-900">
                {conversations.length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Messages
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.total_messages || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Upload className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Files Uploaded
              </p>
              <p className="text-2xl font-semibold text-gray-900">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <Link
              to="/dashboard/personas"
              className="flex items-center p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
            >
              <Plus className="h-5 w-5 mr-3 text-primary-600" />
              <span>Create New Persona</span>
            </Link>
            <Link
              to="/dashboard/conversations"
              className="flex items-center p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
            >
              <MessageSquare className="h-5 w-5 mr-3 text-green-600" />
              <span>Start New Conversation</span>
            </Link>
            <Link
              to="/dashboard/upload"
              className="flex items-center p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
            >
              <Upload className="h-5 w-5 mr-3 text-blue-600" />
              <span>Upload Files</span>
            </Link>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h3>
          {conversations.length > 0 ? (
            <div className="space-y-3">
              {conversations.slice(0, 3).map((conversation) => (
                <div
                  key={conversation.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {conversation.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(conversation.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Link
                    to={`/dashboard/conversations/${conversation.id}`}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No recent conversations
            </p>
          )}
        </div>
      </div>

      {/* Personas Overview */}
      {personas.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Your Personas
            </h3>
            <Link
              to="/dashboard/personas"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              View All
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {personas.slice(0, 6).map((persona) => (
              <div
                key={persona.id}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200"
              >
                <h4 className="font-medium text-gray-900 mb-1">
                  {persona.name}
                </h4>
                <p className="text-sm text-gray-500 mb-2">
                  {persona.relation_type}
                </p>
                {persona.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
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
