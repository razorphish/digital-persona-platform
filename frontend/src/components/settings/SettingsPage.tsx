import React from "react";

const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold radiant-text">Settings</h1>
        <p className="radiant-text-secondary">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="card text-center py-12">
        <h3 className="text-lg font-medium radiant-text mb-2">Coming Soon</h3>
        <p className="radiant-text-secondary">
          Account settings and preferences will be available soon.
        </p>
      </div>
    </div>
  );
};

export default SettingsPage;
