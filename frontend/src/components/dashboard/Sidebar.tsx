import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  Users,
  MessageSquare,
  Upload,
  BarChart3,
  Settings,
  Plus,
} from "lucide-react";
import { CreatePersonaRequest, CreateConversationRequest } from "../../types";
import apiService from "../../services/api";
import toast from "react-hot-toast";
import CreatePersonaModal from "../personas/CreatePersonaModal";
import CreateConversationModal from "../conversations/CreateConversationModal";

const Sidebar: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateConversationModal, setShowCreateConversationModal] =
    useState(false);

  const handleCreatePersona = async (personaData: CreatePersonaRequest) => {
    try {
      await apiService.createPersona(personaData);
      toast.success("Persona created successfully!");
      setShowCreateModal(false);
      // Optionally refresh the page or trigger a callback to update the parent
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
      // Optionally refresh the page or trigger a callback to update the parent
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

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <nav className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    isActive
                      ? "bg-primary-100 text-primary-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`
                }
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* Quick Actions */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Quick Actions
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <Plus className="h-5 w-5 mr-3" />
              Create Your Digital Self
            </button>
            <button
              onClick={() => setShowCreateConversationModal(true)}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <Plus className="h-5 w-5 mr-3" />
              New Conversation
            </button>
          </div>
        </div>
      </div>

      {/* Create Persona Modal */}
      {showCreateModal && (
        <CreatePersonaModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreatePersona}
          editingPersona={null}
        />
      )}

      {/* Create Conversation Modal */}
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

export default Sidebar;
