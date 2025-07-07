import React, { useState, useEffect } from "react";
import {
  PlusIcon,
  ArrowPathIcon,
  TrashIcon,
  ChartBarIcon,
  EyeIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import api from "../../services/api";
import toast from "react-hot-toast";

interface Integration {
  id: number;
  platform: string;
  platform_user_id: string;
  platform_username: string;
  is_active: boolean;
  last_sync_at: string | null;
  sync_frequency_hours: number;
  platform_metadata: any;
  created_at: string;
  updated_at: string;
}

interface SocialPost {
  id: number;
  platform_post_id: string;
  post_type: string;
  content: string | null;
  media_urls: string[] | null;
  hashtags: string[] | null;
  mentions: string[] | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  engagement_score: number;
  sentiment_score: number | null;
  posted_at: string;
  platform_metadata: any;
}

interface Analytics {
  id: number;
  date: string;
  total_posts: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  avg_engagement_rate: number;
  top_hashtags: [string, number][] | null;
  top_mentions: [string, number][] | null;
  sentiment_distribution: {
    positive: number;
    negative: number;
    neutral: number;
  } | null;
  peak_activity_hours: any;
}

const IntegrationsPage: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIntegration] = useState<Integration | null>(null);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [analytics, setAnalytics] = useState<Analytics[]>([]);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showPostsModal, setShowPostsModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [syncing, setSyncing] = useState<number | null>(null);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const integrations = await api.getIntegrations();
      setIntegrations(integrations);
    } catch (error) {
      toast.error("Failed to fetch integrations");
    } finally {
      setLoading(false);
    }
  };

  const handleConnectAccount = async (platform: string) => {
    try {
      // In a real implementation, this would redirect to OAuth
      // For now, we'll show a placeholder
      toast.success(`Connecting to ${platform}...`);
      setShowConnectModal(false);

      // Simulate connection
      setTimeout(() => {
        fetchIntegrations();
        toast.success(`${platform} account connected successfully!`);
      }, 2000);
    } catch (error) {
      toast.error(`Failed to connect ${platform} account`);
    }
  };

  const handleSync = async (integrationId: number) => {
    setSyncing(integrationId);
    try {
      const response = await api.syncIntegration(integrationId);
      toast.success(
        `Sync completed! ${response.new_posts_count} new posts found.`
      );
      fetchIntegrations();
    } catch (error) {
      toast.error("Sync failed");
    } finally {
      setSyncing(null);
    }
  };

  const handleDeleteIntegration = async (integrationId: number) => {
    if (!window.confirm("Are you sure you want to delete this integration?"))
      return;

    try {
      await api.deleteIntegration(integrationId);
      toast.success("Integration deleted successfully");
      fetchIntegrations();
    } catch (error) {
      toast.error("Failed to delete integration");
    }
  };

  const fetchPosts = async (integrationId: number) => {
    try {
      const posts = await api.getIntegrationPosts(integrationId);
      setPosts(posts);
      setShowPostsModal(true);
    } catch (error) {
      toast.error("Failed to fetch posts");
    }
  };

  const fetchAnalytics = async (integrationId: number) => {
    try {
      const analytics = await api.getIntegrationAnalytics(integrationId);
      setAnalytics(analytics);
      setShowAnalyticsModal(true);
    } catch (error) {
      toast.error("Failed to fetch analytics");
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "twitter":
        return (
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
        );
      case "facebook":
        return (
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">f</span>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">?</span>
          </div>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold radiant-text">Integrations</h1>
          <p className="text-lg radiant-text-secondary mt-2">
            Connect your social media accounts to enhance your persona
          </p>
        </div>
        <button
          onClick={() => setShowConnectModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Connect Account</span>
        </button>
      </div>

      {/* Integrations Grid */}
      {integrations.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <PlusIcon className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold radiant-text mb-2">
            No integrations connected
          </h3>
          <p className="text-gray-400 mb-6">
            Connect your social media accounts to start importing your digital
            footprint
          </p>
          <button
            onClick={() => setShowConnectModal(true)}
            className="btn-primary"
          >
            Connect Your First Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((integration) => (
            <div
              key={integration.id}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getPlatformIcon(integration.platform)}
                  <div>
                    <h3 className="font-semibold radiant-text capitalize">
                      {integration.platform}
                    </h3>
                    <p className="text-sm radiant-text-secondary">
                      @{integration.platform_username}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => fetchPosts(integration.id)}
                    className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    title="View Posts"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => fetchAnalytics(integration.id)}
                    className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    title="View Analytics"
                  >
                    <ChartBarIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteIntegration(integration.id)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete Integration"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="radiant-text-secondary">Status:</span>
                  <span
                    className={
                      integration.is_active ? "text-green-400" : "text-red-400"
                    }
                  >
                    {integration.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="radiant-text-secondary">Last Sync:</span>
                  <span className="radiant-text">
                    {integration.last_sync_at
                      ? formatDate(integration.last_sync_at)
                      : "Never"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="radiant-text-secondary">
                    Sync Frequency:
                  </span>
                  <span className="radiant-text">
                    {integration.sync_frequency_hours}h
                  </span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleSync(integration.id)}
                  disabled={syncing === integration.id}
                  className="btn-secondary flex-1 flex items-center justify-center space-x-2"
                >
                  {syncing === integration.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <ArrowPathIcon className="h-4 w-4" />
                  )}
                  <span>
                    {syncing === integration.id ? "Syncing..." : "Sync Now"}
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Connect Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold radiant-text">
                Connect Account
              </h2>
              <button
                onClick={() => setShowConnectModal(false)}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => handleConnectAccount("twitter")}
                className="w-full p-4 bg-blue-500 hover:bg-blue-600 rounded-lg flex items-center justify-center space-x-3 transition-colors"
              >
                <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
                  <span className="text-blue-500 font-bold text-sm">T</span>
                </div>
                <span className="text-white font-medium">Connect Twitter</span>
              </button>

              <button
                onClick={() => handleConnectAccount("facebook")}
                className="w-full p-4 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center space-x-3 transition-colors"
              >
                <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">f</span>
                </div>
                <span className="text-white font-medium">Connect Facebook</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Posts Modal */}
      {showPostsModal && selectedIntegration && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold radiant-text">
                Posts from {selectedIntegration.platform}
              </h2>
              <button
                onClick={() => setShowPostsModal(false)}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white/5 rounded-lg p-4 border border-white/10"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm text-gray-400">
                      {formatDate(post.posted_at)}
                    </span>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span>❤️ {post.likes_count}</span>
                      <span>💬 {post.comments_count}</span>
                      <span>🔄 {post.shares_count}</span>
                    </div>
                  </div>
                  <p className="radiant-text mb-3">{post.content}</p>
                  {post.hashtags && post.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {post.hashtags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalyticsModal && selectedIntegration && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold radiant-text">
                Analytics for {selectedIntegration.platform}
              </h2>
              <button
                onClick={() => setShowAnalyticsModal(false)}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {analytics.slice(0, 1).map((analytic) => (
                <React.Fragment key={analytic.id}>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h3 className="text-sm font-medium radiant-text-secondary mb-1">
                      Total Posts
                    </h3>
                    <p className="text-2xl font-bold radiant-text">
                      {analytic.total_posts}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h3 className="text-sm font-medium radiant-text-secondary mb-1">
                      Total Likes
                    </h3>
                    <p className="text-2xl font-bold radiant-text">
                      {analytic.total_likes}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h3 className="text-sm font-medium radiant-text-secondary mb-1">
                      Total Comments
                    </h3>
                    <p className="text-2xl font-bold radiant-text">
                      {analytic.total_comments}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h3 className="text-sm font-medium radiant-text-secondary mb-1">
                      Avg Engagement
                    </h3>
                    <p className="text-2xl font-bold radiant-text">
                      {analytic.avg_engagement_rate.toFixed(1)}%
                    </p>
                  </div>
                </React.Fragment>
              ))}
            </div>

            {analytics.length > 0 && analytics[0].top_hashtags && (
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-lg font-semibold radiant-text mb-4">
                  Top Hashtags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {analytics[0].top_hashtags
                    .slice(0, 10)
                    .map(([tag, count], index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm"
                      >
                        #{tag} ({count})
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegrationsPage;
