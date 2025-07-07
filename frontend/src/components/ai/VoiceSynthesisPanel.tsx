import React, { useEffect, useState } from "react";
import apiService from "../../services/api";
import {
  Persona,
  Conversation,
  Message,
  VoiceSynthesisResult,
} from "../../types";

const VoiceSynthesisPanel: React.FC = () => {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<number | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<number | null>(null);
  const [synthesis, setSynthesis] = useState<VoiceSynthesisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiService.getPersonas().then(setPersonas);
  }, []);

  useEffect(() => {
    if (selectedPersona) {
      apiService.getConversations(selectedPersona).then(setConversations);
    } else {
      setConversations([]);
      setMessages([]);
    }
  }, [selectedPersona]);

  useEffect(() => {
    if (conversations.length > 0) {
      apiService.getMessages(conversations[0].id).then((msgs: Message[]) => {
        setMessages(msgs.filter((m: Message) => m.role === "assistant"));
      });
    } else {
      setMessages([]);
    }
  }, [conversations]);

  const handleSynthesize = async () => {
    if (!selectedMessage) return;
    setLoading(true);
    setError(null);
    setSynthesis(null);
    try {
      const result = await apiService.synthesizeVoice(selectedMessage);
      setSynthesis(result);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Synthesis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-xl font-bold radiant-text mb-2">Voice Synthesis</h2>
      <div className="mb-4">
        <label className="block mb-1 font-semibold radiant-text">
          Select Persona
        </label>
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
      <div className="mb-4">
        <label className="block mb-1 font-semibold radiant-text">
          Select Assistant Message
        </label>
        <select
          className="w-full border rounded p-2"
          value={selectedMessage ?? ""}
          onChange={(e) => setSelectedMessage(Number(e.target.value) || null)}
          disabled={messages.length === 0}
        >
          <option value="">-- Select Message --</option>
          {messages.map((m) => (
            <option key={m.id} value={m.id}>
              {m.content.slice(0, 60)}...
            </option>
          ))}
        </select>
      </div>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        onClick={handleSynthesize}
        disabled={!selectedMessage || loading}
      >
        {loading ? "Synthesizing..." : "Synthesize Voice"}
      </button>
      {error && <div className="text-red-600 mt-2">{error}</div>}
      {synthesis && (
        <div className="mt-4">
          <h3 className="font-semibold mb-1">Audio:</h3>
          <audio controls src={synthesis.synthesis.audio_url} />
          <div className="text-sm radiant-text-secondary mt-1">
            Voice: {synthesis.synthesis.voice}, Engine:{" "}
            {synthesis.synthesis.engine}
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceSynthesisPanel;
