import React from "react";

const StatsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Statistics</h1>
        <p className="text-gray-600">
          View your usage statistics and analytics
        </p>
      </div>

      <div className="card text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
        <p className="text-gray-600">
          Detailed statistics and analytics will be available soon.
        </p>
      </div>
    </div>
  );
};

export default StatsPage;
