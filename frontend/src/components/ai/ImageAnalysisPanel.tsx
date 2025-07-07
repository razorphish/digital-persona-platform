import React, { useEffect, useState } from "react";
import apiService from "../../services/api";
import { Persona, MediaFile, ImageAnalysisResult } from "../../types";
import toast from "react-hot-toast";

const ImageAnalysisPanel: React.FC = () => {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<ImageAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [processingStep, setProcessingStep] = useState<string>("");

  useEffect(() => {
    apiService.getPersonas().then(setPersonas);
    apiService.getFiles().then(setMediaFiles);
  }, []);

  const handleAnalyze = async () => {
    if (!selectedImage) return;
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setProgress(0);
    setProcessingStep("Initializing analysis...");

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 500);

      setProcessingStep("Analyzing image content...");
      const result = await apiService.analyzeImage(selectedImage);

      clearInterval(progressInterval);
      setProgress(100);
      setProcessingStep("Analysis complete!");

      setAnalysis(result);
      toast.success("Image analysis completed successfully!");

      // Reset progress after a delay
      setTimeout(() => {
        setProgress(0);
        setProcessingStep("");
      }, 2000);
    } catch (e: any) {
      const errorMessage = e?.response?.data?.detail || "Analysis failed";
      setError(errorMessage);
      toast.error(errorMessage);
      setProgress(0);
      setProcessingStep("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-xl font-bold radiant-text mb-2">Image Analysis</h2>
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
          Select Image
        </label>
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

      {/* Progress Indicator */}
      {loading && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm radiant-text-secondary mb-2">
            <span>{processingStep}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {error && <div className="text-red-600 mt-2">{error}</div>}
      {analysis && (
        <div className="mt-4">
          <h3 className="font-semibold radiant-text mb-1">Analysis Results:</h3>
          <pre className="bg-white/10 p-2 rounded text-sm overflow-x-auto border border-white/20">
            {JSON.stringify(analysis.analysis, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ImageAnalysisPanel;
