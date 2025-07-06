import React from "react";

const ConversationsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Conversations</h1>
        <p className="text-gray-600">
          Manage your chat conversations with AI personas
        </p>
      </div>

      <div className="card text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
        <p className="text-gray-600">
          Conversation management features will be available soon.
        </p>
      </div>
    </div>
  );
};

export default ConversationsPage;
