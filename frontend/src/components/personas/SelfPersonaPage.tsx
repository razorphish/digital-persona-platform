import React, { useState, useEffect, useCallback } from "react";
import {
  Edit,
  Brain,
  MessageSquare,
  Settings,
  Sparkles,
  Activity,
  Database,
  Zap,
  Calendar,
  Clock,
  Plus,
  Save,
  X,
} from "lucide-react";
import { Persona } from "../../types";
import apiService from "../../services/api";
import toast from "react-hot-toast";

interface PersonaSummary {
  persona_id: number;
  summary: string;
  created_at: string;
  age_days: number;
  interaction_count: number;
}

const SelfPersonaPage: React.FC = () => {
  const [persona, setPersona] = useState<Persona | null>(null);
  const [summary, setSummary] = useState<PersonaSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [addingLearning, setAddingLearning] = useState(false);
  const [learningText, setLearningText] = useState("");
  const [submittingLearning, setSubmittingLearning] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
  });

  const fetchPersonaData = useCallback(async () => {
    try {
      const data = await apiService.getSelfPersona();
      setPersona(data);
      setEditForm({
        name: data.name,
        description: data.description || "",
      });
      await fetchPersonaSummary(data.id);
    } catch (error) {
      toast.error("Failed to load your digital self");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPersonaData();
  }, [fetchPersonaData]);

  const fetchPersonaSummary = async (personaId: number) => {
    setSummaryLoading(true);
    try {
      const data = await apiService.getPersonaSummary(personaId);
      setSummary(data);
    } catch (error) {
      toast.error("Failed to load persona summary");
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleSave = async () => {
    if (!persona) return;

    try {
      const updatedPersona = await apiService.updatePersona(persona.id, {
        name: editForm.name,
        description: editForm.description,
        relation_type: "self",
      });
      setPersona(updatedPersona);
      setEditing(false);
      toast.success("Your digital self updated successfully!");
    } catch (error: any) {
      toast.error(
        error.response?.data?.detail || "Failed to update your digital self"
      );
    }
  };

  const handleAddLearning = async () => {
    if (!persona || !learningText.trim()) return;

    setSubmittingLearning(true);
    try {
      await apiService.addPersonaLearning(persona.id, { text: learningText });
      setLearningText("");
      setAddingLearning(false);
      await fetchPersonaData(); // Refresh data
      toast.success("Learning data added successfully!");
    } catch (error: any) {
      toast.error(
        error.response?.data?.detail || "Failed to add learning data"
      );
    } finally {
      setSubmittingLearning(false);
    }
  };

  const getCapabilityStatus = (enabled: boolean) => {
    return enabled ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
        <Sparkles className="h-3 w-3 mr-1" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/10 text-white/60 border border-white/20">
        Inactive
      </span>
    );
  };

  const formatAge = (days: number) => {
    if (days === 0) return "Today";
    if (days === 1) return "1 day";
    if (days < 7) return `${days} days`;
    if (days < 30) return `${Math.floor(days / 7)} weeks`;
    if (days < 365) return `${Math.floor(days / 30)} months`;
    return `${Math.floor(days / 365)} years`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!persona) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="bg-red-900/80 border border-red-500 rounded-2xl p-8 text-center">
          <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Brain className="h-12 w-12 text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-red-200 mb-2">
            No digital self found
          </h3>
          <p className="text-red-300">
            Something went wrong loading your digital self.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Your Digital Self
          </h1>
          <p className="text-white/70 text-lg">
            Your personal AI persona that learns and adapts to your personality
          </p>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className="bg-white/10 backdrop-blur-xl border border-white/20 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 hover:bg-white/20 flex items-center"
        >
          <Edit className="h-4 w-4 mr-2" />
          {editing ? "Cancel" : "Edit"}
        </button>
      </div>

      {/* First Row - My Digital Self and AI Capabilities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Digital Self Card */}
        <div className="lg:col-span-2">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mr-4">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {persona.name}
                </h2>
                <p className="text-white/60">
                  Created {new Date(persona.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    placeholder="Your digital self's name"
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    rows={4}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    placeholder="Describe your digital self..."
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleSave}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-2 rounded-xl font-medium transition-all duration-200 hover:shadow-lg"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="bg-white/10 backdrop-blur-xl border border-white/20 text-white px-6 py-2 rounded-xl font-medium transition-all duration-200 hover:bg-white/20"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-white/80 mb-6 leading-relaxed">
                  {persona.description ||
                    "Your digital self is ready to learn and grow with you."}
                </p>

                {/* Interaction Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center">
                      <Activity className="h-5 w-5 text-purple-400 mr-2" />
                      <span className="text-white/60 text-sm">
                        Interactions
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {persona.interaction_count}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center">
                      <Database className="h-5 w-5 text-pink-400 mr-2" />
                      <span className="text-white/60 text-sm">Memory</span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {persona.memory_enabled ? "Active" : "Inactive"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Capabilities Card */}
        <div className="lg:col-span-1">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <Zap className="h-5 w-5 mr-2 text-purple-400" />
              AI Capabilities
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-white/80">Memory & Learning</span>
                {getCapabilityStatus(
                  persona.memory_enabled && persona.learning_enabled
                )}
              </div>

              <div className="flex justify-between items-center">
                <span className="text-white/80">Image Analysis</span>
                {getCapabilityStatus(persona.image_analysis_enabled)}
              </div>

              <div className="flex justify-between items-center">
                <span className="text-white/80">Voice Synthesis</span>
                {getCapabilityStatus(persona.voice_synthesis_enabled)}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10">
              <h4 className="text-sm font-medium text-white/60 mb-3">
                Quick Actions
              </h4>
              <div className="space-y-2">
                <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 hover:shadow-lg flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Start Conversation
                </button>
                <button className="w-full bg-white/10 backdrop-blur-xl border border-white/20 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 hover:bg-white/20 flex items-center justify-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row - AI Summary and Learning Data */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Summary Card */}
        <div className="lg:col-span-2">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-purple-700 shadow-xl">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mr-4">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">AI Summary</h2>
                <p className="text-white/60 text-sm">
                  Generated insights about your persona
                </p>
              </div>
            </div>

            {summaryLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
              </div>
            ) : summary ? (
              <div className="space-y-4">
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-white/80 leading-relaxed">
                    {summary.summary}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-3">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-blue-400 mr-2" />
                      <span className="text-white/60 text-sm">Created</span>
                    </div>
                    <p className="text-white font-medium">
                      {new Date(summary.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-purple-400 mr-2" />
                      <span className="text-white/60 text-sm">Age</span>
                    </div>
                    <p className="text-white font-medium">
                      {formatAge(summary.age_days)}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-white/60">No summary available</p>
              </div>
            )}
          </div>
        </div>

        {/* Learning Data Card */}
        <div className="lg:col-span-1">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center mr-4">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Learning Data
                  </h2>
                  <p className="text-white/60 text-sm">
                    Contribute to your persona's AI model
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAddingLearning(!addingLearning)}
                className="bg-white/10 backdrop-blur-xl border border-white/20 text-white px-3 py-2 rounded-xl font-medium transition-all duration-200 hover:bg-white/20 flex items-center"
              >
                {addingLearning ? (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </>
                )}
              </button>
            </div>

            {addingLearning ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Add Learning Text
                  </label>
                  <textarea
                    value={learningText}
                    onChange={(e) => setLearningText(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    placeholder="Share something about yourself, your preferences, memories, or personality traits..."
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleAddLearning}
                    disabled={!learningText.trim() || submittingLearning}
                    className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 hover:shadow-lg flex items-center"
                  >
                    {submittingLearning ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Adding...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Add Learning
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setAddingLearning(false);
                      setLearningText("");
                    }}
                    className="bg-white/10 backdrop-blur-xl border border-white/20 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 hover:bg-white/20"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/80 text-sm">Interactions</span>
                    <Activity className="h-4 w-4 text-purple-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {persona.interaction_count}
                  </p>
                </div>

                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/80 text-sm">
                      Memory Context
                    </span>
                    <Database className="h-4 w-4 text-blue-400" />
                  </div>
                  <p className="text-white/60 text-sm">
                    {persona.memory_context && persona.memory_context.length > 0
                      ? `${persona.memory_context.length} characters of learning data`
                      : "No learning data yet"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Personality Insights */}
      {persona.personality_traits &&
        Object.keys(persona.personality_traits).length > 0 && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">
              Personality Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(persona.personality_traits).map(
                ([trait, value]) => (
                  <div key={trait} className="bg-white/5 rounded-xl p-4">
                    <h4 className="text-white font-medium capitalize">
                      {trait.replace("_", " ")}
                    </h4>
                    <p className="text-white/60 text-sm">{String(value)}</p>
                  </div>
                )
              )}
            </div>
          </div>
        )}
    </div>
  );
};

export default SelfPersonaPage;
