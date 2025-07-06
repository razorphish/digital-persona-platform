import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Conversation, CreateConversationRequest, Persona } from "../../types";
import apiService from "../../services/api";

interface CreateConversationModalProps {
  onClose: () => void;
  onSubmit: (data: CreateConversationRequest) => Promise<void>;
  editingConversation?: Conversation | null;
}

const CreateConversationModal: React.FC<CreateConversationModalProps> = ({
  onClose,
  onSubmit,
  editingConversation,
}) => {
  const [formData, setFormData] = useState<CreateConversationRequest>({
    title: "",
    persona_id: 0,
  });
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPersonas = async () => {
      try {
        const data = await apiService.getPersonas();
        setPersonas(data);
        if (data.length > 0 && !editingConversation) {
          setFormData((prev) => ({ ...prev, persona_id: data[0].id }));
        }
      } catch (error) {
        console.error("Failed to load personas:", error);
      }
    };

    fetchPersonas();
  }, [editingConversation]);

  useEffect(() => {
    if (editingConversation) {
      setFormData({
        title: editingConversation.title,
        persona_id: editingConversation.persona_id,
      });
    }
  }, [editingConversation]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]:
        e.target.name === "persona_id"
          ? parseInt(e.target.value)
          : e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert("Please enter a conversation title");
      return;
    }
    if (!formData.persona_id) {
      alert("Please select a persona");
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingConversation
              ? "Edit Conversation"
              : "Create New Conversation"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Conversation Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter conversation title"
            />
          </div>

          <div>
            <label
              htmlFor="persona_id"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Select Persona *
            </label>
            <select
              id="persona_id"
              name="persona_id"
              required
              value={formData.persona_id}
              onChange={handleChange}
              className="input-field"
            >
              <option value="">Select a persona...</option>
              {personas.map((persona) => (
                <option key={persona.id} value={persona.id}>
                  {persona.name} ({persona.relation_type})
                </option>
              ))}
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={loading}
            >
              {loading
                ? "Creating..."
                : editingConversation
                ? "Update"
                : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateConversationModal;
