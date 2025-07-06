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
    relation_type: "friend",
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
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingPersona ? "Edit Persona" : "Create New Persona"}
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
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
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
              className="block text-sm font-medium text-gray-700 mb-1"
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
              className="block text-sm font-medium text-gray-700 mb-1"
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
