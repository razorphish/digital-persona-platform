import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, MessageSquare } from "lucide-react";
import { Persona, CreatePersonaRequest } from "../../types";
import apiService from "../../services/api";
import toast from "react-hot-toast";
import CreatePersonaModal from "./CreatePersonaModal";

const PersonasPage: React.FC = () => {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Debug modal state
  useEffect(() => {
    console.log("showCreateModal state changed to:", showCreateModal);
  }, [showCreateModal]);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);

  useEffect(() => {
    fetchPersonas();
  }, []);

  const fetchPersonas = async () => {
    try {
      const data = await apiService.getPersonas();
      setPersonas(data);
    } catch (error) {
      toast.error("Failed to load personas");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePersona = async (personaData: CreatePersonaRequest) => {
    console.log("PersonasPage: handleCreatePersona called with:", personaData);
    try {
      const result = await apiService.createPersona(personaData);
      console.log("PersonasPage: Persona created successfully:", result);
      toast.success("Persona created successfully!");
      setShowCreateModal(false);
      fetchPersonas();
    } catch (error: any) {
      console.error("PersonasPage: Error creating persona:", error);
      console.error("PersonasPage: Error response:", error.response?.data);
      toast.error(error.response?.data?.detail || "Failed to create persona");
    }
  };

  const handleDeletePersona = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this persona?")) {
      try {
        await apiService.deletePersona(id);
        toast.success("Persona deleted successfully!");
        fetchPersonas();
      } catch (error: any) {
        toast.error(error.response?.data?.detail || "Failed to delete persona");
      }
    }
  };

  const getRelationTypeColor = (type: string) => {
    const colors = {
      self: "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 font-semibold",
      parent: "bg-blue-100 text-blue-800",
      spouse: "bg-pink-100 text-pink-800",
      child: "bg-green-100 text-green-800",
      sibling: "bg-purple-100 text-purple-800",
      friend: "bg-yellow-100 text-yellow-800",
      colleague: "bg-gray-100 text-gray-800",
      other: "bg-indigo-100 text-indigo-800",
    };
    return colors[type as keyof typeof colors] || colors.other;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Your Digital Personas
          </h1>
          <p className="text-gray-600">
            Create and manage your digital self and other AI personas
          </p>
        </div>
        <button
          onClick={() => {
            console.log("Create Persona button clicked");
            setShowCreateModal(true);
            console.log("showCreateModal set to true");
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Persona
        </button>
      </div>

      {personas.length === 0 ? (
        <div className="card text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Plus className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No personas yet
          </h3>
          <p className="text-gray-600 mb-6">
            Start by creating your digital self to capture your personality,
            memories, and unique characteristics.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            Create Your Digital Self
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {personas.map((persona) => (
            <div
              key={persona.id}
              className="card hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {persona.name}
                  </h3>
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getRelationTypeColor(
                      persona.relation_type
                    )}`}
                  >
                    {persona.relation_type}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingPersona(persona)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePersona(persona.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {persona.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {persona.description}
                </p>
              )}

              {/* AI Capabilities Status */}
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-700 mb-2">
                  AI Capabilities
                </h4>
                <div className="flex flex-wrap gap-1">
                  {persona.image_analysis_enabled && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Image Analysis
                    </span>
                  )}
                  {persona.voice_synthesis_enabled && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Voice
                    </span>
                  )}
                  {persona.memory_enabled && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Memory
                    </span>
                  )}
                  {persona.learning_enabled && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      Learning
                    </span>
                  )}
                  {!persona.image_analysis_enabled &&
                    !persona.voice_synthesis_enabled &&
                    !persona.memory_enabled &&
                    !persona.learning_enabled && (
                      <span className="text-xs text-gray-500">
                        No AI capabilities enabled
                      </span>
                    )}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>
                  Created {new Date(persona.created_at).toLocaleDateString()}
                </span>
                <button className="flex items-center text-primary-600 hover:text-primary-700">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Chat
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <>
          {console.log("Rendering CreatePersonaModal")}
          <CreatePersonaModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreatePersona}
            editingPersona={editingPersona}
          />
        </>
      )}
    </div>
  );
};

export default PersonasPage;
