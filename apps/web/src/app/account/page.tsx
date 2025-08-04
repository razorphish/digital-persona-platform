"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";

function AccountPageContent() {
  const { user, logout } = useAuth();
  const router = useRouter();

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    dateOfBirth: "",
    location: "",
    bio: "",
    allowSocialConnections: true,
    defaultPrivacyLevel: "friends",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Navigation items (same as dashboard for consistency)
  const navigationItems = [
    { name: "Dashboard", href: "/dashboard", icon: "🏠" },
    { name: "Personas", href: "/personas", icon: "👤" },
    { name: "Creator Dashboard", href: "/creator/dashboard", icon: "💰" },
    { name: "Subscriptions", href: "/account/subscriptions", icon: "💳" },
    { name: "Account", href: "/account", icon: "⚙️" },
    { name: "Analytics", href: "/analytics", icon: "📊" },
  ];

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        dateOfBirth: "", // We'll need to add this to user object
        location: "", // We'll need to add this to user object
        bio: "", // We'll need to add this to user object
        allowSocialConnections: true,
        defaultPrivacyLevel: "friends",
      });
    }
  }, [user]);

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
    setIsSaving(true);
    setSaveMessage("");

    try {
      // TODO: Implement API call to update user profile
      console.log("Saving profile data:", formData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSaveMessage("Profile updated successfully!");
      setIsEditing(false);

      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      setSaveMessage("Failed to update profile. Please try again.");
      console.error("Profile update error:", error);
    } finally {
      setIsSaving(false);
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

    setIsChangingPassword(true);
    setPasswordMessage("");

    try {
      // TODO: Implement API call to change password
      console.log("Changing password");

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setPasswordMessage("Password changed successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setTimeout(() => setPasswordMessage(""), 3000);
    } catch (error) {
      setPasswordMessage("Failed to change password. Please try again.");
      console.error("Password change error:", error);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Digital Persona Platform
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.name}!</span>
              <div className="relative menu-container">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
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
                      d="M4 6h16M4 12h16m-7 6h7"
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.name}
                      </p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>

                    {navigationItems.map((item) => (
                      <button
                        key={item.name}
                        onClick={() => handleNavigation(item.href)}
                        className={`w-full flex items-center px-4 py-2 text-sm transition-colors ${
                          item.href === "/account"
                            ? "text-indigo-600 bg-indigo-50"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <span className="mr-3">{item.icon}</span>
                        {item.name}
                      </button>
                    ))}

                    <hr className="my-2 border-gray-100" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <svg
                        className="w-4 h-4 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

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
                      disabled={isSaving}
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
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
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
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
                      isChangingPassword ||
                      !passwordData.currentPassword ||
                      !passwordData.newPassword ||
                      !passwordData.confirmPassword
                    }
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isChangingPassword
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
