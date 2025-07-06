import React, { useEffect, useState } from "react";
import apiService from "../../services/api";
import { Persona, MediaFile, ImageAnalysisResult } from "../../types";

const ImageAnalysisPanel: React.FC = () => {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<ImageAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiService.getPersonas().then(setPersonas);
    apiService.getFiles().then(setMediaFiles);
  }, []);

  const handleAnalyze = async () => {
    if (!selectedImage) return;
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const result = await apiService.analyzeImage(selectedImage);
      setAnalysis(result);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-2">Image Analysis</h2>
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
      <div className="mb-4">
        <label className="block mb-1 font-semibold">Select Image</label>
        <select
          className="w-full border rounded p-2"
          value={selectedImage ?? ""}
          onChange={(e) => setSelectedImage(Number(e.target.value) || null)}
        >
          <option value="">-- Select Image --</option>
          {mediaFiles
            .filter((f) => f.file_type.startsWith("image"))
            .map((f) => (
              <option key={f.id} value={f.id}>
                {f.filename}
              </option>
            ))}
        </select>
      </div>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        onClick={handleAnalyze}
        disabled={!selectedImage || loading}
      >
        {loading ? "Analyzing..." : "Analyze Image"}
      </button>
      {error && <div className="text-red-600 mt-2">{error}</div>}
      {analysis && (
        <div className="mt-4">
          <h3 className="font-semibold mb-1">Analysis Results:</h3>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
            {JSON.stringify(analysis.analysis, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ImageAnalysisPanel;
