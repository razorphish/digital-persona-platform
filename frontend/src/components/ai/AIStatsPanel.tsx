import React, { useEffect, useState } from "react";
import { BarChart3, Eye, Volume2, Brain, Zap, TrendingUp } from "lucide-react";
// import apiService from "../../services/api"; // Will be used when backend endpoint is ready
import toast from "react-hot-toast";

interface AIStats {
  total_analyses: number;
  total_syntheses: number;
  total_memories: number;
  total_learning_events: number;
  processing_time_avg: number;
  success_rate: number;
  cost_estimate: number;
}

const AIStatsPanel: React.FC = () => {
  const [stats, setStats] = useState<AIStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAIStats();
  }, []);

  const fetchAIStats = async () => {
    try {
      setLoading(true);
      // This would be a new endpoint in the backend
      // const result = await apiService.getAIStats();
      // setStats(result);

      // Mock data for now
      setStats({
        total_analyses: 24,
        total_syntheses: 156,
        total_memories: 89,
        total_learning_events: 45,
        processing_time_avg: 2.3,
        success_rate: 98.5,
        cost_estimate: 0.15,
      });
    } catch (e: any) {
      const errorMessage =
        e?.response?.data?.detail || "Failed to load AI statistics";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-2">Failed to load statistics</div>
        <button
          onClick={fetchAIStats}
          className="text-primary-600 hover:text-primary-700"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: "Image Analyses",
      value: stats.total_analyses,
      icon: Eye,
      color: "text-green-400",
      bgColor: "bg-green-500/20",
    },
    {
      title: "Voice Syntheses",
      value: stats.total_syntheses,
      icon: Volume2,
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
    },
    {
      title: "Memories Stored",
      value: stats.total_memories,
      icon: Brain,
      color: "text-purple-400",
      bgColor: "bg-purple-500/20",
    },
    {
      title: "Learning Events",
      value: stats.total_learning_events,
      icon: Zap,
      color: "text-orange-400",
      bgColor: "bg-orange-500/20",
    },
  ];

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold radiant-text">
          AI Capabilities Statistics
        </h2>
        <button
          onClick={fetchAIStats}
          className="text-purple-400 hover:text-purple-300 text-sm"
        >
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center">
              <div className={`p-2 ${stat.bgColor} rounded-lg`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium radiant-text-secondary">
                  {stat.title}
                </p>
                <p className="text-2xl font-semibold radiant-text">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium radiant-text-secondary">
                Avg Processing Time
              </p>
              <p className="text-2xl font-semibold radiant-text">
                {stats.processing_time_avg}s
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium radiant-text-secondary">
                Success Rate
              </p>
              <p className="text-2xl font-semibold radiant-text">
                {stats.success_rate}%
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium radiant-text-secondary">
                Estimated Cost
              </p>
              <p className="text-2xl font-semibold radiant-text">
                ${stats.cost_estimate}
              </p>
            </div>
            <div className="text-purple-400 text-sm font-medium">
              This Month
            </div>
          </div>
        </div>
      </div>

      {/* Usage Chart Placeholder */}
      <div className="card">
        <h3 className="text-lg font-semibold radiant-text mb-4">
          Usage Over Time
        </h3>
        <div className="h-64 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
          <div className="text-center radiant-text-secondary">
            <BarChart3 className="h-12 w-12 mx-auto mb-2" />
            <p>Usage chart will be displayed here</p>
            <p className="text-sm">Shows daily/weekly AI capability usage</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIStatsPanel;
