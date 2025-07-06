import React, { useEffect, useState } from "react";
import apiService from "../../services/api";
import { Persona, PersonaMemory } from "../../types";

const MemoryPanel: React.FC = () => {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<number | null>(null);
  const [memories, setMemories] = useState<PersonaMemory[]>([]);
  const [query, setQuery] = useState("");
  const [newMemory, setNewMemory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiService.getPersonas().then(setPersonas);
  }, []);

  useEffect(() => {
    if (selectedPersona) {
      fetchMemories();
    } else {
      setMemories([]);
    }
    // eslint-disable-next-line
  }, [selectedPersona]);

  const fetchMemories = async () => {
    if (!selectedPersona) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.getPersonaMemories(selectedPersona, query);
      setMemories(res.memories);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to fetch memories");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMemory = async () => {
    if (!selectedPersona || !newMemory) return;
    setLoading(true);
    setError(null);
    try {
      await apiService.storePersonaMemory(
        selectedPersona,
        "note",
        newMemory,
        1.0
      );
      setNewMemory("");
      fetchMemories();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to add memory");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-2">Memory Management</h2>
      <div className="mb-4">
        <label className="block mb-1 font-semibold">Select Persona</label>
        <select
          className="w-full border rounded p-2"
          value={selectedPersona ?? ""}
          onChange={(e) => setSelectedPersona(Number(e.target.value) || null)}
        >
          <option value="">-- Select Persona --</option>
          {personas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-4 flex items-center space-x-2">
        <input
          className="flex-1 border rounded p-2"
          placeholder="Search memories..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          className="bg-gray-200 px-3 py-2 rounded"
          onClick={fetchMemories}
          disabled={loading}
        >
          Search
        </button>
      </div>
      <div className="mb-4 flex items-center space-x-2">
        <input
          className="flex-1 border rounded p-2"
          placeholder="Add new memory..."
          value={newMemory}
          onChange={(e) => setNewMemory(e.target.value)}
        />
        <button
          className="bg-blue-600 text-white px-3 py-2 rounded"
          onClick={handleAddMemory}
          disabled={loading || !newMemory}
        >
          Add
        </button>
      </div>
      {error && <div className="text-red-600 mt-2">{error}</div>}
      <div className="mt-4">
        <h3 className="font-semibold mb-1">Memories:</h3>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <ul className="space-y-2">
            {memories.map((m) => (
              <li key={m.id} className="bg-gray-100 p-2 rounded text-sm">
                <div className="font-semibold">{m.type}</div>
                <div>{m.content}</div>
                <div className="text-xs text-gray-500">
                  Importance: {m.importance} | Last accessed: {m.last_accessed}
                </div>
              </li>
            ))}
            {memories.length === 0 && (
              <li className="text-gray-500">No memories found.</li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default MemoryPanel;
