import React from 'react';

interface CreatorStats {
  totalEarnings: number;
  monthlyEarnings: number;
  weeklyEarnings: number;
  totalSubscribers: number;
  activeSubscribers: number;
  nextPayoutAmount: number;
  nextPayoutDate: string;
  conversionRate: number;
  avgRevenuePerUser: number;
  earningsGrowth: number;
  subscriberGrowth: number;
  subscribersByTier?: {
    basic: number;
    average: number;
    advanced: number;
  };
  churnRate?: number;
  newSubscribersThisMonth?: number;
}

interface SubscriberMetricsProps {
  stats?: CreatorStats;
  isLoading: boolean;
}

export default function SubscriberMetrics({ stats, isLoading }: SubscriberMetricsProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const subscribersByTier = stats?.subscribersByTier || { basic: 0, average: 0, advanced: 0 };
  const totalTierSubscribers = subscribersByTier.basic + subscribersByTier.average + subscribersByTier.advanced;

  const getTierPercentage = (count: number) => {
    return totalTierSubscribers > 0 ? (count / totalTierSubscribers) * 100 : 0;
  };

  const tierData = [
    {
      name: 'Basic',
      count: subscribersByTier.basic,
      percentage: getTierPercentage(subscribersByTier.basic),
      color: 'bg-blue-500',
      lightColor: 'bg-blue-100',
      textColor: 'text-blue-700'
    },
    {
      name: 'Average',
      count: subscribersByTier.average,
      percentage: getTierPercentage(subscribersByTier.average),
      color: 'bg-purple-500',
      lightColor: 'bg-purple-100',
      textColor: 'text-purple-700'
    },
    {
      name: 'Advanced',
      count: subscribersByTier.advanced,
      percentage: getTierPercentage(subscribersByTier.advanced),
      color: 'bg-yellow-500',
      lightColor: 'bg-yellow-100',
      textColor: 'text-yellow-700'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Subscriber Metrics</h3>
          <div className="flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Live data
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {(stats?.activeSubscribers || 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Active Subscribers</div>
            {stats?.subscriberGrowth !== undefined && (
              <div className={`text-xs font-medium mt-1 ${
                stats.subscriberGrowth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {stats.subscriberGrowth >= 0 ? '+' : ''}{stats.subscriberGrowth.toFixed(1)}% this month
              </div>
            )}
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {formatPercentage(stats?.conversionRate || 0)}
            </div>
            <div className="text-sm text-gray-500">Conversion Rate</div>
            <div className="text-xs text-gray-400 mt-1">Visitors to subscribers</div>
          </div>
        </div>

        {/* Subscription Tiers Breakdown */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Subscription Tiers</h4>
          <div className="space-y-3">
            {tierData.map((tier) => (
              <div key={tier.name}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{tier.name}</span>
                  <span className="text-gray-900">{tier.count} subscribers</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`${tier.color} h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${tier.percentage}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatPercentage(tier.percentage)} of total
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="border-t border-gray-200 pt-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Avg Revenue per User</span>
            <span className="text-sm font-medium text-gray-900">
              ${(stats?.avgRevenuePerUser || 0).toFixed(2)}
            </span>
          </div>
          
          {stats?.churnRate !== undefined && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Monthly Churn Rate</span>
              <span className={`text-sm font-medium ${
                stats.churnRate <= 5 ? 'text-green-600' : 
                stats.churnRate <= 10 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {formatPercentage(stats.churnRate)}
              </span>
            </div>
          )}

          {stats?.newSubscribersThisMonth !== undefined && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">New This Month</span>
              <span className="text-sm font-medium text-green-600">
                +{stats.newSubscribersThisMonth}
              </span>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-2 gap-3">
            <button className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-lg transition-colors">
              View All Subscribers
            </button>
            <button className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-2 rounded-lg transition-colors">
              Export Data
            </button>
          </div>
        </div>

        {/* Empty State */}
        {(stats?.activeSubscribers || 0) === 0 && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 mb-2">No subscribers yet</p>
            <p className="text-xs text-gray-400">
              Start promoting your personas to gain your first subscribers
            </p>
          </div>
        )}
      </div>
    </div>
  );
}