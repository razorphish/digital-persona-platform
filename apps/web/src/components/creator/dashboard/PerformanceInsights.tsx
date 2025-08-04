import React from 'react';
import { useRouter } from 'next/navigation';

interface TopPersona {
  id: string;
  name: string;
  revenue: number;
  subscribers: number;
  avgRating: number;
  interactionCount: number;
  conversionRate: number;
}

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

interface PerformanceInsightsProps {
  topPersonas?: TopPersona[];
  stats?: CreatorStats;
}

export default function PerformanceInsights({ topPersonas, stats }: PerformanceInsightsProps) {
  const router = useRouter();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPerformanceInsights = () => {
    const insights = [];

    // Revenue insights
    if (stats?.earningsGrowth && stats.earningsGrowth > 20) {
      insights.push({
        type: 'success',
        icon: '📈',
        message: `Strong growth! Your earnings are up ${stats.earningsGrowth.toFixed(1)}% this month.`
      });
    } else if (stats?.earningsGrowth && stats.earningsGrowth < -10) {
      insights.push({
        type: 'warning',
        icon: '📉',
        message: `Earnings are down ${Math.abs(stats.earningsGrowth).toFixed(1)}%. Consider promotional strategies.`
      });
    }

    // Subscriber insights
    if (stats?.subscriberGrowth && stats.subscriberGrowth > 15) {
      insights.push({
        type: 'success',
        icon: '🎯',
        message: `Excellent subscriber growth! Up ${stats.subscriberGrowth.toFixed(1)}% this month.`
      });
    }

    // Conversion insights
    if (stats?.conversionRate && stats.conversionRate > 5) {
      insights.push({
        type: 'success',
        icon: '💪',
        message: `Great conversion rate at ${stats.conversionRate.toFixed(1)}%! Above industry average.`
      });
    } else if (stats?.conversionRate && stats.conversionRate < 2) {
      insights.push({
        type: 'info',
        icon: '💡',
        message: `Consider optimizing your persona descriptions to improve the ${stats.conversionRate.toFixed(1)}% conversion rate.`
      });
    }

    // ARPU insights
    if (stats?.avgRevenuePerUser && stats.avgRevenuePerUser > 50) {
      insights.push({
        type: 'success',
        icon: '💰',
        message: `High-value subscribers! Average revenue per user is ${formatCurrency(stats.avgRevenuePerUser)}.`
      });
    }

    return insights;
  };

  const insights = getPerformanceInsights();

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Performance Insights</h3>
          <button
            onClick={() => router.push('/creator/analytics')}
            className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
          >
            View Details →
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* AI Insights */}
        {insights.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">💡 AI Insights</h4>
            {insights.map((insight, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border-l-4 ${
                  insight.type === 'success' ? 'bg-green-50 border-green-400' :
                  insight.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                  'bg-blue-50 border-blue-400'
                }`}
              >
                <p className="text-sm text-gray-700">
                  <span className="mr-2">{insight.icon}</span>
                  {insight.message}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Top Performing Personas */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">🏆 Top Performing Personas</h4>
          {topPersonas && topPersonas.length > 0 ? (
            <div className="space-y-3">
              {topPersonas.slice(0, 3).map((persona, index) => (
                <div key={persona.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      'bg-amber-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{persona.name}</p>
                      <p className="text-xs text-gray-500">
                        {persona.subscribers} subscribers • {formatCurrency(persona.revenue)} revenue
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {persona.avgRating.toFixed(1)}★
                    </div>
                    <div className="text-xs text-gray-500">
                      {persona.conversionRate.toFixed(1)}% conv.
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">No persona data yet</p>
              <p className="text-xs text-gray-400">Create and monetize personas to see performance</p>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <div className="text-lg font-bold text-indigo-600">
              {stats?.conversionRate?.toFixed(1) || '0.0'}%
            </div>
            <div className="text-xs text-gray-500">Conversion Rate</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {formatCurrency(stats?.avgRevenuePerUser || 0)}
            </div>
            <div className="text-xs text-gray-500">Avg Revenue/User</div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-indigo-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-indigo-900 mb-2">📋 Recommendations</h4>
          <ul className="text-sm text-indigo-800 space-y-1">
            <li>• Post regular updates to keep subscribers engaged</li>
            <li>• Consider creating time-based interaction offers</li>
            <li>• Optimize your persona descriptions for better conversions</li>
            <li>• Engage with subscribers through personalized messages</li>
          </ul>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200">
          <button 
            onClick={() => router.push('/personas')}
            className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-lg transition-colors"
          >
            Manage Personas
          </button>
          <button 
            onClick={() => router.push('/creator/analytics')}
            className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-2 rounded-lg transition-colors"
          >
            View Analytics
          </button>
        </div>
      </div>
    </div>
  );
}