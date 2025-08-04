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
}

interface EarningsOverviewProps {
  stats?: CreatorStats;
  isLoading: boolean;
  timeRange: string;
}

export default function EarningsOverview({ stats, isLoading, timeRange }: EarningsOverviewProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case '7d': return 'Last 7 days';
      case '30d': return 'Last 30 days';
      case '90d': return 'Last 90 days';
      case '1y': return 'Last year';
      default: return 'Last 30 days';
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const metrics = [
    {
      title: 'Total Earnings',
      value: formatCurrency(stats?.totalEarnings || 0),
      subValue: `${formatCurrency((stats?.totalEarnings || 0) * 0.97)} after fees`,
      change: stats?.earningsGrowth || 0,
      icon: (
        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      color: 'green'
    },
    {
      title: `${getTimeRangeLabel(timeRange)} Revenue`,
      value: formatCurrency(timeRange === '7d' ? stats?.weeklyEarnings || 0 : stats?.monthlyEarnings || 0),
      subValue: `${formatCurrency(((timeRange === '7d' ? stats?.weeklyEarnings || 0 : stats?.monthlyEarnings || 0) * 0.97))} to you`,
      change: stats?.earningsGrowth || 0,
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      color: 'blue'
    },
    {
      title: 'Active Subscribers',
      value: (stats?.activeSubscribers || 0).toLocaleString(),
      subValue: `${stats?.totalSubscribers || 0} total subscribers`,
      change: stats?.subscriberGrowth || 0,
      icon: (
        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'purple'
    },
    {
      title: 'Next Payout',
      value: formatCurrency(stats?.nextPayoutAmount || 0),
      subValue: stats?.nextPayoutDate ? new Date(stats.nextPayoutDate).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }) : 'No payout scheduled',
      change: null,
      icon: (
        <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      color: 'indigo'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 bg-${metric.color}-100 rounded-lg flex items-center justify-center`}>
              {metric.icon}
            </div>
            {metric.change !== null && (
              <div className={`flex items-center text-sm font-medium ${
                metric.change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {metric.change >= 0 ? (
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {formatPercentage(metric.change)}
              </div>
            )}
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">{metric.title}</p>
            <p className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</p>
            <p className="text-xs text-gray-500">{metric.subValue}</p>
          </div>
        </div>
      ))}
    </div>
  );
}