import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Persona, CreatePersonaRequest } from "../../types";

interface CreatePersonaModalProps {
  onClose: () => void;
  onSubmit: (data: CreatePersonaRequest) => Promise<void>;
  editingPersona?: Persona | null;
}

const CreatePersonaModal: React.FC<CreatePersonaModalProps> = ({
  onClose,
  onSubmit,
  editingPersona,
}) => {
  console.log("CreatePersonaModal rendered, editingPersona:", editingPersona);
  const [formData, setFormData] = useState<CreatePersonaRequest>({
    name: "",
    description: "",
    relation_type: "self",
    // AI Capabilities
    image_analysis_enabled: true,
    voice_synthesis_enabled: true,
    memory_enabled: true,
    learning_enabled: true,
  });

  useEffect(() => {
    if (editingPersona) {
      setFormData({
        name: editingPersona.name,
        description: editingPersona.description || "",
        relation_type: editingPersona.relation_type,
      });
    }
  }, [editingPersona]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 w-full max-w-md mx-4 border border-white/20">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold radiant-text">
            {editingPersona ? "Edit Persona" : "Create New Persona"}
          </h2>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium radiant-text mb-1"
            >
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter persona name"
            />
          </div>

          <div>
            <label
              htmlFor="relation_type"
              className="block text-sm font-medium radiant-text mb-1"
            >
              Relation Type *
            </label>
            <select
              id="relation_type"
              name="relation_type"
              required
              value={formData.relation_type}
              onChange={handleChange}
              className="input-field"
            >
              <option value="self">Self (Your Digital Persona)</option>
              <option value="parent">Parent</option>
              <option value="spouse">Spouse</option>
              <option value="child">Child</option>
              <option value="sibling">Sibling</option>
              <option value="friend">Friend</option>
              <option value="colleague">Colleague</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium radiant-text mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="input-field"
              placeholder="Describe the persona's personality, background, and characteristics..."
            />
          </div>

          {/* AI Capabilities Section */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium radiant-text mb-3">
              AI Capabilities
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium radiant-text">
                    Image Analysis
                  </label>
                  <p className="text-xs radiant-text-secondary">
                    Analyze uploaded images for context
                  </p>
                </div>
                <input
                  type="checkbox"
                  name="image_analysis_enabled"
                  checked={formData.image_analysis_enabled}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      image_analysis_enabled: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium radiant-text">
                    Voice Synthesis
                  </label>
                  <p className="text-xs radiant-text-secondary">
                    Convert messages to speech
                  </p>
                </div>
                <input
                  type="checkbox"
                  name="voice_synthesis_enabled"
                  checked={formData.voice_synthesis_enabled}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      voice_synthesis_enabled: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium radiant-text">
                    Memory System
                  </label>
                  <p className="text-xs radiant-text-secondary">
                    Remember conversations and preferences
                  </p>
                </div>
                <input
                  type="checkbox"
                  name="memory_enabled"
                  checked={formData.memory_enabled}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      memory_enabled: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium radiant-text">
                    Learning
                  </label>
                  <p className="text-xs radiant-text-secondary">
                    Learn from interactions to improve responses
                  </p>
                </div>
                <input
                  type="checkbox"
                  name="learning_enabled"
                  checked={formData.learning_enabled}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      learning_enabled: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              {editingPersona ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePersonaModal;
