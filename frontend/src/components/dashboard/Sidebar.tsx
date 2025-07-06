import React from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  Users,
  MessageSquare,
  Upload,
  BarChart3,
  Settings,
  Plus,
} from "lucide-react";

const Sidebar: React.FC = () => {
  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Personas", href: "/dashboard/personas", icon: Users },
    {
      name: "Conversations",
      href: "/dashboard/conversations",
      icon: MessageSquare,
    },
    { name: "File Upload", href: "/dashboard/upload", icon: Upload },
    { name: "Statistics", href: "/dashboard/stats", icon: BarChart3 },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <nav className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    isActive
                      ? "bg-primary-100 text-primary-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`
                }
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* Quick Actions */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Quick Actions
          </h3>
          <div className="space-y-2">
            <button className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200">
              <Plus className="h-5 w-5 mr-3" />
              New Persona
            </button>
            <button className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200">
              <Plus className="h-5 w-5 mr-3" />
              New Conversation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
