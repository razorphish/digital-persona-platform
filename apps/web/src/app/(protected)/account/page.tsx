"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { trpc } from "@/lib/trpc";

function AccountPageContent() {
  const { user, logout } = useAuth();
  const router = useRouter();

  // tRPC mutations
  const updateProfileMutation = trpc.auth.updateProfile.useMutation();
  const changePasswordMutation = trpc.auth.changePassword.useMutation();

  // Test query to get user data
  const { data: userData, refetch: refetchUser } = trpc.auth.me.useQuery();

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    dateOfBirth: "",
    location: "",
    bio: "",
    allowSocialConnections: true,
    defaultPrivacyLevel: "friends" as
      | "public"
      | "friends"
      | "subscribers"
      | "private",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Navigation items (same as dashboard for consistency)
  const navigationItems = [
    { name: "Feed", href: "/feed", icon: "🏠" },
    { name: "Dashboard", href: "/dashboard", icon: "📊" },
    { name: "Personas", href: "/personas", icon: "👤" },
    { name: "Creator Dashboard", href: "/creator/dashboard", icon: "💰" },
    { name: "Safety", href: "/safety", icon: "🛡️" },
    { name: "Subscriptions", href: "/account/subscriptions", icon: "💳" },
    { name: "Account", href: "/account", icon: "⚙️" },
    { name: "Analytics", href: "/analytics", icon: "📈" },
  ];

  // Initialize form with user data - prioritize tRPC query data over AuthContext
  useEffect(() => {
    console.log("Account page - user data changed:", user);
    console.log("Account page - userData from tRPC:", userData);

    const sourceData = userData || user;
    if (sourceData) {
      const newFormData = {
        name: sourceData.name || "",
        email: sourceData.email || "",
        dateOfBirth: sourceData.dateOfBirth || "",
        location: sourceData.location || "",
        bio: sourceData.bio || "",
        allowSocialConnections: sourceData.allowSocialConnections ?? true,
        defaultPrivacyLevel: sourceData.defaultPrivacyLevel || "friends",
      };
      console.log("Account page - setting form data:", newFormData);
      setFormData(newFormData);
    } else {
      console.log("Account page - no user data available yet");
    }
  }, [user, userData]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isMenuOpen && !target.closest(".menu-container")) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const handleNavigation = (href: string) => {
    setIsMenuOpen(false);
    router.push(href);
  };

  const handleLogout = () => {
    setIsMenuOpen(false);
    logout();
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async () => {
    setSaveMessage("");

    // Check if user data is loaded
    if (!user) {
      setSaveMessage("Please wait for user data to load");
      return;
    }

    // Validate required fields
    if (!formData.name || formData.name.trim().length === 0) {
      setSaveMessage("Name is required");
      return;
    }

    try {
      const updateData = {
        name: formData.name.trim(),
        dateOfBirth: formData.dateOfBirth || undefined,
        location: formData.location || undefined,
        bio: formData.bio || undefined,
        allowSocialConnections: formData.allowSocialConnections,
        defaultPrivacyLevel: formData.defaultPrivacyLevel,
      };

      console.log("Sending profile update data:", updateData);

      const result = await updateProfileMutation.mutateAsync(updateData);

      setSaveMessage("Profile updated successfully!");
      setIsEditing(false);

      // Refresh the user data from the API
      await refetchUser();

      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error: any) {
      setSaveMessage(
        error?.message || "Failed to update profile. Please try again."
      );
      console.error("Profile update error:", error);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage("New passwords do not match.");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordMessage("Password must be at least 8 characters long.");
      return;
    }

    setPasswordMessage("");

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setPasswordMessage("Password changed successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setTimeout(() => setPasswordMessage(""), 3000);
    } catch (error: any) {
      setPasswordMessage(
        error?.message || "Failed to change password. Please try again."
      );
      console.error("Password change error:", error);
    }
  };

  // Debug: Show user data status
  console.log("Account page render - user:", user);
  console.log("Account page render - userData from tRPC:", userData);
  console.log("Account page render - formData:", formData);
  console.log(
    "Account page render - user keys:",
    user ? Object.keys(user) : "no user"
  );
  console.log(
    "Account page render - userData keys:",
    userData ? Object.keys(userData) : "no userData"
  );
  console.log("Account page render - user dateOfBirth:", user?.dateOfBirth);
  console.log(
    "Account page render - userData dateOfBirth:",
    userData?.dateOfBirth
  );
  console.log("Account page render - user bio:", user?.bio);
  console.log("Account page render - userData bio:", userData?.bio);
  console.log("Account page render - user location:", user?.location);
  console.log("Account page render - userData location:", userData?.location);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-md">
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  Account Settings
                </h2>
                <p className="mt-2 text-gray-600">
                  Manage your profile information and account preferences
                </p>
              </div>
              <div className="flex items-center space-x-3">
                {!isEditing ? (
                  <>
                    <button
                      onClick={() => refetchUser()}
                      className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Test API
                    </button>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Edit Profile
                    </button>
                  </>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={
                        updateProfileMutation.isLoading ||
                        !user ||
                        !formData.name.trim()
                      }
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {updateProfileMutation.isLoading
                        ? "Saving..."
                        : "Save Changes"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Save Message */}
            {saveMessage && (
              <div
                className={`mt-4 p-3 rounded-lg ${
                  saveMessage.includes("successfully")
                    ? "bg-green-50 border border-green-200 text-green-800"
                    : "bg-red-50 border border-red-200 text-red-800"
                }`}
              >
                {saveMessage}
              </div>
            )}
          </div>

          {/* Profile Information */}
          <div className="px-8 py-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Profile Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email Address
                    <span className="text-xs text-gray-500 ml-2">
                      (Username - Cannot be changed)
                    </span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>

                {/* Date of Birth */}
                <div>
                  <label
                    htmlFor="dateOfBirth"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                {/* Location */}
                <div>
                  <label
                    htmlFor="location"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="City, Country"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="mt-6">
                <label
                  htmlFor="bio"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  value={formData.bio}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Tell us about yourself..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 resize-none"
                />
              </div>
            </div>

            {/* Privacy Settings */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Privacy Settings
              </h3>
              <div className="space-y-4">
                {/* Social Connections */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      Allow Social Connections
                    </h4>
                    <p className="text-sm text-gray-500">
                      Allow others to connect with you through social media
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="allowSocialConnections"
                      checked={formData.allowSocialConnections}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {/* Default Privacy Level */}
                <div>
                  <label
                    htmlFor="defaultPrivacyLevel"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Default Privacy Level
                  </label>
                  <select
                    id="defaultPrivacyLevel"
                    name="defaultPrivacyLevel"
                    value={formData.defaultPrivacyLevel}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  >
                    <option value="public">Public</option>
                    <option value="friends">Friends Only</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Security Settings */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Security
              </h3>
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-sm font-medium text-gray-900 mb-4">
                  Change Password
                </h4>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="currentPassword"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Current Password
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="newPassword"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        New Password
                      </label>
                      <input
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="confirmPassword"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {passwordMessage && (
                    <div
                      className={`p-3 rounded-lg ${
                        passwordMessage.includes("successfully")
                          ? "bg-green-50 border border-green-200 text-green-800"
                          : "bg-red-50 border border-red-200 text-red-800"
                      }`}
                    >
                      {passwordMessage}
                    </div>
                  )}

                  <button
                    onClick={handleChangePassword}
                    disabled={
                      changePasswordMutation.isLoading ||
                      !passwordData.currentPassword ||
                      !passwordData.newPassword ||
                      !passwordData.confirmPassword
                    }
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {changePasswordMutation.isLoading
                      ? "Changing Password..."
                      : "Change Password"}
                  </button>
                </div>
              </div>
            </div>

            {/* Account Actions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Account Actions
              </h3>
              <div className="bg-red-50 rounded-lg p-6">
                <h4 className="text-sm font-medium text-red-900 mb-2">
                  Danger Zone
                </h4>
                <p className="text-sm text-red-700 mb-4">
                  These actions are irreversible. Please be certain before
                  proceeding.
                </p>
                <div className="flex space-x-3">
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                    Delete Account
                  </button>
                  <button className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors">
                    Export Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AccountPage() {
  return (
    <AuthGuard>
      <AccountPageContent />
    </AuthGuard>
  );
}
