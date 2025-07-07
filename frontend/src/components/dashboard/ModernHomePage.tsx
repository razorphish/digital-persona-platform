import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  CloudArrowUpIcon,
  ChartBarIcon,
  SparklesIcon,
  RocketLaunchIcon,
  HeartIcon,
  StarIcon,
} from "@heroicons/react/24/outline";

const ModernHomePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: ChatBubbleLeftRightIcon,
      title: "AI Conversations",
      description:
        "Engage in natural conversations with your personalized AI personas",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: UserGroupIcon,
      title: "Persona Management",
      description:
        "Create and manage multiple AI personas with unique personalities",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: CloudArrowUpIcon,
      title: "Media Upload",
      description: "Upload images and videos for AI analysis and context",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: ChartBarIcon,
      title: "Analytics",
      description:
        "Track your conversations and AI interactions with detailed insights",
      color: "from-orange-500 to-red-500",
    },
  ];

  const stats = [
    { label: "Active Personas", value: "3", icon: UserGroupIcon },
    {
      label: "Total Conversations",
      value: "12",
      icon: ChatBubbleLeftRightIcon,
    },
    { label: "Messages Sent", value: "156", icon: SparklesIcon },
    { label: "AI Responses", value: "142", icon: RocketLaunchIcon },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-3xl"></div>
        <div className="relative p-8">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center float">
                  <SparklesIcon className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center pulse-slow">
                  <HeartIcon className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>

            <div>
              <h1 className="text-4xl md:text-6xl font-bold gradient-text mb-4">
                Welcome back, {user?.username || "User"}!
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Ready to continue your conversations with AI personas? Your
                digital companions are waiting to chat with you.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => navigate("/dashboard/conversations")}
                className="btn-primary flex items-center gap-2"
              >
                <ChatBubbleLeftRightIcon className="w-5 h-5" />
                Start Chatting
              </button>
              <button
                onClick={() => navigate("/dashboard/personas")}
                className="btn-secondary flex items-center gap-2"
              >
                <UserGroupIcon className="w-5 h-5" />
                Manage Personas
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="card hover-lift group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold gradient-text">{stat.value}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <stat.icon className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Features Section */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold gradient-text mb-2">
            Platform Features
          </h2>
          <p className="text-gray-600">
            Discover what makes Digital Persona Platform unique
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="card hover-lift group cursor-pointer"
              onClick={() =>
                navigate(
                  `/dashboard/${feature.title.toLowerCase().replace(" ", "")}`
                )
              }
            >
              <div className="flex items-start space-x-4">
                <div
                  className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <StarIcon className="w-5 h-5 text-yellow-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-xl font-semibold gradient-text mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate("/dashboard/conversations")}
            className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200 hover:from-purple-100 hover:to-blue-100 transition-all duration-200 group"
          >
            <ChatBubbleLeftRightIcon className="w-8 h-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform duration-200" />
            <h4 className="font-semibold text-gray-900">New Conversation</h4>
            <p className="text-sm text-gray-600">
              Start chatting with your AI personas
            </p>
          </button>

          <button
            onClick={() => navigate("/dashboard/upload")}
            className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 hover:from-green-100 hover:to-emerald-100 transition-all duration-200 group"
          >
            <CloudArrowUpIcon className="w-8 h-8 text-green-600 mb-2 group-hover:scale-110 transition-transform duration-200" />
            <h4 className="font-semibold text-gray-900">Upload Media</h4>
            <p className="text-sm text-gray-600">
              Share images and videos with AI
            </p>
          </button>

          <button
            onClick={() => navigate("/dashboard/stats")}
            className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200 hover:from-orange-100 hover:to-red-100 transition-all duration-200 group"
          >
            <ChartBarIcon className="w-8 h-8 text-orange-600 mb-2 group-hover:scale-110 transition-transform duration-200" />
            <h4 className="font-semibold text-gray-900">View Analytics</h4>
            <p className="text-sm text-gray-600">
              Check your conversation insights
            </p>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h3 className="text-xl font-semibold gradient-text mb-4">
          Recent Activity
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Conversation with Persona {item}
                </p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModernHomePage;
