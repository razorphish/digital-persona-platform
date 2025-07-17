"use client";

import { useState } from "react";
import { X, AlertTriangle, Trash2 } from "lucide-react";
import { Persona } from "@/types/personas";

interface DeletePersonaModalProps {
  persona: Persona;
  onClose: () => void;
  onPersonaDeleted: (personaId: number) => void;
}

export default function DeletePersonaModal({
  persona,
  onClose,
  onPersonaDeleted,
}: DeletePersonaModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmName, setConfirmName] = useState("");

  const handleDelete = async () => {
    if (confirmName !== persona.name) {
      setError("Please type the persona name exactly to confirm deletion");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/personas/${persona.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete persona");
      }

      onPersonaDeleted(persona.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete persona");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg border border-red-500/30 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-red-500/20">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Delete Persona</h2>
              <p className="text-red-300 text-sm">
                This action cannot be undone
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-white/70" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-red-300 font-medium mb-2">
                  You are about to delete "{persona.name}"
                </h3>
                <p className="text-red-300/80 text-sm">
                  This will permanently delete:
                </p>
                <ul className="text-red-300/80 text-sm mt-2 space-y-1">
                  <li>• All conversation history</li>
                  <li>• Learned personality traits</li>
                  <li>• Memory and interactions</li>
                  <li>• AI capabilities and settings</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">
              Type the persona name to confirm deletion:
            </label>
            <input
              type="text"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={persona.name}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <p className="text-white/60 text-xs mt-1">
              Expected:{" "}
              <span className="text-white font-mono">{persona.name}</span>
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={loading || confirmName !== persona.name}
              className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                "Deleting..."
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete Persona
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
