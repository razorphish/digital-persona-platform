import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  HomeIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  CloudArrowUpIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  PuzzlePieceIcon,
} from "@heroicons/react/24/outline";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { name: "Persona", href: "/dashboard/personas", icon: UserGroupIcon },
  {
    name: "Conversations",
    href: "/dashboard/conversations",
    icon: ChatBubbleLeftRightIcon,
  },
  {
    name: "Integrations",
    href: "/dashboard/integrations",
    icon: PuzzlePieceIcon,
  },
  { name: "Upload", href: "/dashboard/upload", icon: CloudArrowUpIcon },
  { name: "Stats", href: "/dashboard/stats", icon: ChartBarIcon },
  { name: "Settings", href: "/dashboard/settings", icon: Cog6ToothIcon },
];

const ModernDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen radiant-bg">
      {/* Top Navigation Bar */}
      <div className="header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold gradient-text">
                  Digital Persona
                </h1>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.username?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium radiant-text">
                    {user?.username}
                  </p>
                  <p className="text-xs radiant-text-secondary">
                    {user?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Logout"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 sidebar min-h-screen">
          <nav className="mt-8 px-4">
            <div className="space-y-2">
              {navigation.map((item) => {
                const isActive =
                  location.pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    location.pathname.startsWith(item.href));

                return (
                  <button
                    key={item.name}
                    onClick={() => navigate(item.href)}
                    className={`nav-item ${isActive ? "active" : ""}`}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 ${
                        isActive ? "text-purple-400" : "text-white/60"
                      }`}
                    />
                    {item.name}
                  </button>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernDashboard;
