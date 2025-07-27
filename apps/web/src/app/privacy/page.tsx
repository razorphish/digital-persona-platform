"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { trpc } from "@/lib/trpc";

// Types for privacy settings
interface GuardRails {
  allowedUsers: string[];
  blockedUsers: string[];
  allowedTopics: string[];
  blockedTopics: string[];
  maxInteractionDepth: number;
}

interface ContentFilter {
  allowExplicit: boolean;
  allowPersonalInfo: boolean;
  allowSecrets: boolean;
  allowPhotos: boolean;
  allowVideos: boolean;
  customRules: string[];
}

interface PersonaPrivacySettings {
  id: string;
  name: string;
  privacyLevel: "public" | "friends" | "subscribers" | "private";
  guardRails: GuardRails;
  contentFilter: ContentFilter;
  accessPermissions: {
    friends: {
      canViewProfile: boolean;
      canSendMessages: boolean;
      canViewMedia: boolean;
      canViewPersonalInfo: boolean;
    };
    subscribers: {
      canViewProfile: boolean;
      canSendMessages: boolean;
      canViewMedia: boolean;
      canViewPersonalInfo: boolean;
    };
    public: {
      canViewProfile: boolean;
      canSendMessages: boolean;
      canViewMedia: boolean;
      canViewPersonalInfo: boolean;
    };
  };
}

function PrivacyPageContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<
    "guard-rails" | "content-filter" | "access-permissions" | "privacy-levels"
  >("guard-rails");
  const [isDirty, setIsDirty] = useState(false);

  // tRPC queries
  const { data: personas } = trpc.personas.list.useQuery();
  const { data: mainPersona } = trpc.personas.getMain.useQuery();

  // Privacy settings state
  const [privacySettings, setPrivacySettings] =
    useState<PersonaPrivacySettings>({
      id: "",
      name: "",
      privacyLevel: "friends",
      guardRails: {
        allowedUsers: [],
        blockedUsers: [],
        allowedTopics: [],
        blockedTopics: [],
        maxInteractionDepth: 10,
      },
      contentFilter: {
        allowExplicit: false,
        allowPersonalInfo: true,
        allowSecrets: false,
        allowPhotos: true,
        allowVideos: true,
        customRules: [],
      },
      accessPermissions: {
        friends: {
          canViewProfile: true,
          canSendMessages: true,
          canViewMedia: true,
          canViewPersonalInfo: true,
        },
        subscribers: {
          canViewProfile: true,
          canSendMessages: true,
          canViewMedia: true,
          canViewPersonalInfo: true,
        },
        public: {
          canViewProfile: true,
          canSendMessages: false,
          canViewMedia: false,
          canViewPersonalInfo: false,
        },
      },
    });

  // Initialize with main persona
  useEffect(() => {
    if (mainPersona && !selectedPersonaId) {
      setSelectedPersonaId(mainPersona.id);
      loadPersonaPrivacySettings(mainPersona.id);
    }
  }, [mainPersona, selectedPersonaId]);

  const loadPersonaPrivacySettings = (personaId: string) => {
    // Mock implementation - would load from tRPC
    const persona = personas?.find((p) => p.id === personaId);
    if (persona) {
      setPrivacySettings({
        id: persona.id,
        name: persona.name,
        privacyLevel: (persona as any).privacyLevel || "friends",
        guardRails: (persona.traits as any)?.guardRails || {
          allowedUsers: [],
          blockedUsers: [],
          allowedTopics: [],
          blockedTopics: [],
          maxInteractionDepth: 10,
        },
        contentFilter: (persona.traits as any)?.contentFilter || {
          allowExplicit: false,
          allowPersonalInfo: true,
          allowSecrets: false,
          allowPhotos: true,
          allowVideos: true,
          customRules: [],
        },
        accessPermissions: {
          friends: {
            canViewProfile: true,
            canSendMessages: true,
            canViewMedia: true,
            canViewPersonalInfo: true,
          },
          subscribers: {
            canViewProfile: true,
            canSendMessages: true,
            canViewMedia: true,
            canViewPersonalInfo: true,
          },
          public: {
            canViewProfile: true,
            canSendMessages: false,
            canViewMedia: false,
            canViewPersonalInfo: false,
          },
        },
      });
    }
  };

  const handlePersonaChange = (personaId: string) => {
    setSelectedPersonaId(personaId);
    loadPersonaPrivacySettings(personaId);
    setIsDirty(false);
  };

  const updateGuardRails = (key: keyof GuardRails, value: any) => {
    setPrivacySettings((prev) => ({
      ...prev,
      guardRails: { ...prev.guardRails, [key]: value },
    }));
    setIsDirty(true);
  };

  const updateContentFilter = (key: keyof ContentFilter, value: any) => {
    setPrivacySettings((prev) => ({
      ...prev,
      contentFilter: { ...prev.contentFilter, [key]: value },
    }));
    setIsDirty(true);
  };

  const updateAccessPermissions = (
    level: keyof PersonaPrivacySettings["accessPermissions"],
    permission: string,
    value: boolean
  ) => {
    setPrivacySettings((prev) => ({
      ...prev,
      accessPermissions: {
        ...prev.accessPermissions,
        [level]: { ...prev.accessPermissions[level], [permission]: value },
      },
    }));
    setIsDirty(true);
  };

  const addBlockedUser = (username: string) => {
    if (
      username.trim() &&
      !privacySettings.guardRails.blockedUsers.includes(username.trim())
    ) {
      updateGuardRails("blockedUsers", [
        ...privacySettings.guardRails.blockedUsers,
        username.trim(),
      ]);
    }
  };

  const removeBlockedUser = (username: string) => {
    updateGuardRails(
      "blockedUsers",
      privacySettings.guardRails.blockedUsers.filter((u) => u !== username)
    );
  };

  const addBlockedTopic = (topic: string) => {
    if (
      topic.trim() &&
      !privacySettings.guardRails.blockedTopics.includes(topic.trim())
    ) {
      updateGuardRails("blockedTopics", [
        ...privacySettings.guardRails.blockedTopics,
        topic.trim(),
      ]);
    }
  };

  const removeBlockedTopic = (topic: string) => {
    updateGuardRails(
      "blockedTopics",
      privacySettings.guardRails.blockedTopics.filter((t) => t !== topic)
    );
  };

  const addCustomRule = (rule: string) => {
    if (
      rule.trim() &&
      !privacySettings.contentFilter.customRules.includes(rule.trim())
    ) {
      updateContentFilter("customRules", [
        ...privacySettings.contentFilter.customRules,
        rule.trim(),
      ]);
    }
  };

  const removeCustomRule = (rule: string) => {
    updateContentFilter(
      "customRules",
      privacySettings.contentFilter.customRules.filter((r) => r !== rule)
    );
  };

  const savePrivacySettings = async () => {
    // Mock implementation - would use tRPC mutation
    console.log("Saving privacy settings:", privacySettings);
    setIsDirty(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/personas")}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Privacy Control Center
                </h1>
                <p className="text-sm text-gray-600">
                  Configure guard rails and access permissions
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isDirty && (
                <button
                  onClick={savePrivacySettings}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Save Changes
                </button>
              )}
              <span className="text-gray-700">Welcome, {user?.name}!</span>
              <button
                onClick={() => logout()}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Persona Selection */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">
              Configure Privacy for:
            </label>
            <select
              value={selectedPersonaId}
              onChange={(e) => handlePersonaChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {personas?.map((persona) => (
                <option key={persona.id} value={persona.id}>
                  {persona.name} {persona.isDefault ? "(Main)" : ""}
                </option>
              ))}
            </select>
            {privacySettings.name && (
              <div className="flex items-center space-x-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    privacySettings.privacyLevel === "public"
                      ? "bg-green-100 text-green-800"
                      : privacySettings.privacyLevel === "friends"
                      ? "bg-blue-100 text-blue-800"
                      : privacySettings.privacyLevel === "subscribers"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {privacySettings.privacyLevel} access
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              {
                id: "guard-rails",
                label: "Guard Rails",
                icon: "🛡️",
                desc: "Control who can interact and on what topics",
              },
              {
                id: "content-filter",
                label: "Content Filter",
                icon: "🔍",
                desc: "Configure what information to share",
              },
              {
                id: "access-permissions",
                label: "Access Permissions",
                icon: "🔐",
                desc: "Set permissions for different user types",
              },
              {
                id: "privacy-levels",
                label: "Privacy Levels",
                icon: "🔒",
                desc: "Overall visibility and access settings",
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-orange-500 text-orange-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span>{tab.icon}</span>
                  <div className="text-left">
                    <div>{tab.label}</div>
                    <div className="text-xs text-gray-500">{tab.desc}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Guard Rails Tab */}
        {activeTab === "guard-rails" && (
          <div className="space-y-8">
            {/* Blocked Users */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Blocked Users
              </h3>
              <p className="text-gray-600 mb-4">
                Prevent specific users from interacting with this persona
              </p>

              <div className="space-y-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Enter username to block..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        addBlockedUser(e.currentTarget.value);
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const input =
                        e.currentTarget.parentElement?.querySelector(
                          "input"
                        ) as HTMLInputElement;
                      if (input) {
                        addBlockedUser(input.value);
                        input.value = "";
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Block User
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {privacySettings.guardRails.blockedUsers.map((user) => (
                    <span
                      key={user}
                      className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                    >
                      {user}
                      <button
                        onClick={() => removeBlockedUser(user)}
                        className="ml-2 text-red-600 hover:text-red-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {privacySettings.guardRails.blockedUsers.length === 0 && (
                    <p className="text-gray-500 text-sm">No users blocked</p>
                  )}
                </div>
              </div>
            </div>

            {/* Blocked Topics */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Blocked Topics
              </h3>
              <p className="text-gray-600 mb-4">
                Prevent conversations about specific topics
              </p>

              <div className="space-y-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Enter topic to block (e.g., politics, religion)..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        addBlockedTopic(e.currentTarget.value);
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const input =
                        e.currentTarget.parentElement?.querySelector(
                          "input"
                        ) as HTMLInputElement;
                      if (input) {
                        addBlockedTopic(input.value);
                        input.value = "";
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Block Topic
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {privacySettings.guardRails.blockedTopics.map((topic) => (
                    <span
                      key={topic}
                      className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                    >
                      {topic}
                      <button
                        onClick={() => removeBlockedTopic(topic)}
                        className="ml-2 text-red-600 hover:text-red-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {privacySettings.guardRails.blockedTopics.length === 0 && (
                    <p className="text-gray-500 text-sm">No topics blocked</p>
                  )}
                </div>
              </div>
            </div>

            {/* Interaction Limits */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Interaction Limits
              </h3>
              <p className="text-gray-600 mb-4">
                Control the depth and intensity of conversations
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Interaction Depth:{" "}
                    {privacySettings.guardRails.maxInteractionDepth}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={privacySettings.guardRails.maxInteractionDepth}
                    onChange={(e) =>
                      updateGuardRails(
                        "maxInteractionDepth",
                        parseInt(e.target.value)
                      )
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Shallow (1)</span>
                    <span>Moderate (25)</span>
                    <span>Deep (50)</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Higher values allow for more detailed and personal
                    conversations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Filter Tab */}
        {activeTab === "content-filter" && (
          <div className="space-y-8">
            {/* Basic Content Filters */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Content Sharing Preferences
              </h3>
              <p className="text-gray-600 mb-6">
                Configure what types of content this persona can share
              </p>

              <div className="space-y-4">
                {[
                  {
                    key: "allowPersonalInfo" as keyof ContentFilter,
                    label: "Personal Information",
                    desc: "Name, age, location, contacts",
                  },
                  {
                    key: "allowPhotos" as keyof ContentFilter,
                    label: "Photos & Images",
                    desc: "Profile pictures, personal photos",
                  },
                  {
                    key: "allowVideos" as keyof ContentFilter,
                    label: "Videos",
                    desc: "Video content and recordings",
                  },
                  {
                    key: "allowSecrets" as keyof ContentFilter,
                    label: "Private/Secret Information",
                    desc: "Sensitive personal details",
                  },
                  {
                    key: "allowExplicit" as keyof ContentFilter,
                    label: "Explicit Content",
                    desc: "Adult or mature content",
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {item.label}
                      </h4>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={
                          privacySettings.contentFilter[item.key] as boolean
                        }
                        onChange={(e) =>
                          updateContentFilter(item.key, e.target.checked)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Rules */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Custom Content Rules
              </h3>
              <p className="text-gray-600 mb-4">
                Add specific rules for content filtering
              </p>

              <div className="space-y-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Enter custom rule (e.g., 'Never share work details')..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        addCustomRule(e.currentTarget.value);
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const input =
                        e.currentTarget.parentElement?.querySelector(
                          "input"
                        ) as HTMLInputElement;
                      if (input) {
                        addCustomRule(input.value);
                        input.value = "";
                      }
                    }}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Add Rule
                  </button>
                </div>

                <div className="space-y-2">
                  {privacySettings.contentFilter.customRules.map(
                    (rule, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <span className="text-gray-900">{rule}</span>
                        <button
                          onClick={() => removeCustomRule(rule)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    )
                  )}
                  {privacySettings.contentFilter.customRules.length === 0 && (
                    <p className="text-gray-500 text-sm">
                      No custom rules defined
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Access Permissions Tab */}
        {activeTab === "access-permissions" && (
          <div className="space-y-8">
            {["public", "friends", "subscribers"].map((level) => (
              <div key={level} className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
                  {level} Access Permissions
                </h3>
                <p className="text-gray-600 mb-6">
                  Configure what {level} users can access and do
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      key: "canViewProfile",
                      label: "View Profile",
                      desc: "See persona description and basic info",
                    },
                    {
                      key: "canSendMessages",
                      label: "Send Messages",
                      desc: "Start conversations with this persona",
                    },
                    {
                      key: "canViewMedia",
                      label: "View Media",
                      desc: "Access photos, videos, and files",
                    },
                    {
                      key: "canViewPersonalInfo",
                      label: "View Personal Info",
                      desc: "See detailed personal information",
                    },
                  ].map((permission) => (
                    <div
                      key={permission.key}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {permission.label}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {permission.desc}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={
                            privacySettings.accessPermissions[
                              level as keyof PersonaPrivacySettings["accessPermissions"]
                            ][
                              permission.key as keyof PersonaPrivacySettings["accessPermissions"]["public"]
                            ]
                          }
                          onChange={(e) =>
                            updateAccessPermissions(
                              level as keyof PersonaPrivacySettings["accessPermissions"],
                              permission.key,
                              e.target.checked
                            )
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Privacy Levels Tab */}
        {activeTab === "privacy-levels" && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Overall Privacy Level
            </h3>
            <p className="text-gray-600 mb-6">
              Choose the overall privacy level for this persona. This affects
              visibility and default permissions.
            </p>

            <div className="space-y-4">
              {[
                {
                  value: "public",
                  label: "Public",
                  desc: "Visible to everyone, discoverable in search",
                  icon: "🌍",
                  color: "bg-green-100 text-green-800 border-green-300",
                },
                {
                  value: "friends",
                  label: "Friends Only",
                  desc: "Only connected friends can access",
                  icon: "👥",
                  color: "bg-blue-100 text-blue-800 border-blue-300",
                },
                {
                  value: "subscribers",
                  label: "Subscribers Only",
                  desc: "Paid subscribers can access premium features",
                  icon: "💎",
                  color: "bg-purple-100 text-purple-800 border-purple-300",
                },
                {
                  value: "private",
                  label: "Private",
                  desc: "Only you can access this persona",
                  icon: "🔒",
                  color: "bg-gray-100 text-gray-800 border-gray-300",
                },
              ].map((level) => (
                <label key={level.value} className="block cursor-pointer">
                  <div
                    className={`p-4 border-2 rounded-lg transition-colors ${
                      privacySettings.privacyLevel === level.value
                        ? level.color
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="privacyLevel"
                        value={level.value}
                        checked={privacySettings.privacyLevel === level.value}
                        onChange={(e) => {
                          setPrivacySettings((prev) => ({
                            ...prev,
                            privacyLevel: e.target.value as any,
                          }));
                          setIsDirty(true);
                        }}
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                      />
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{level.icon}</span>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {level.label}
                          </h4>
                          <p className="text-sm text-gray-600">{level.desc}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Save Button */}
        {isDirty && (
          <div className="fixed bottom-6 right-6">
            <button
              onClick={savePrivacySettings}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg shadow-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Save Privacy Settings</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <AuthGuard>
      <PrivacyPageContent />
    </AuthGuard>
  );
}
