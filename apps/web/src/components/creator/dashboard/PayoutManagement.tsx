import React from 'react';
import { useRouter } from 'next/navigation';

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
  pendingPayoutAmount?: number;
  lastPayoutAmount?: number;
  lastPayoutDate?: string;
  totalPayouts?: number;
  payoutStatus?: 'pending' | 'processing' | 'completed' | 'failed';
}

interface PayoutManagementProps {
  stats?: CreatorStats;
  isLoading: boolean;
}

export default function PayoutManagement({ stats, isLoading }: PayoutManagementProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getPayoutStatusBadge = (status?: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Processing
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Completed
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Failed
          </span>
        );
      default:
        return null;
    }
  };

  const nextPayoutAmount = stats?.nextPayoutAmount || 0;
  const hasUpcomingPayout = nextPayoutAmount > 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Payouts</h3>
          <button
            onClick={() => router.push('/creator/payouts')}
            className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
          >
            View All →
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Next Payout */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-800">Next Payout</span>
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-green-900 mb-1">
            {formatCurrency(nextPayoutAmount)}
          </div>
          <div className="text-sm text-green-700">
            {hasUpcomingPayout ? formatDate(stats?.nextPayoutDate) : 'No payout scheduled'}
          </div>
          {hasUpcomingPayout && (
            <div className="text-xs text-green-600 mt-2">
              Payouts occur every Friday at 9 AM PST
            </div>
          )}
        </div>

        {/* Payout Summary */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Pending Amount</span>
            <span className="text-sm font-medium text-gray-900">
              {formatCurrency(stats?.pendingPayoutAmount || 0)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Last Payout</span>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {formatCurrency(stats?.lastPayoutAmount || 0)}
              </div>
              <div className="text-xs text-gray-500">
                {formatDate(stats?.lastPayoutDate)}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Paid Out</span>
            <span className="text-sm font-medium text-gray-900">
              {formatCurrency(stats?.totalPayouts || 0)}
            </span>
          </div>

          {stats?.payoutStatus && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Status</span>
              {getPayoutStatusBadge(stats.payoutStatus)}
            </div>
          )}
        </div>

        {/* Banking Info */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Banking Information</span>
            <button
              onClick={() => router.push('/creator/verification')}
              className="text-xs text-indigo-600 hover:text-indigo-500"
            >
              Update
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  •••• •••• •••• 1234
                </p>
                <p className="text-xs text-gray-500">
                  Chase Bank • Checking
                </p>
              </div>
              <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                Verified
              </div>
            </div>
          </div>
        </div>

        {/* Payout Schedule */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Payout Schedule</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Weekly payouts every Friday</p>
            <p>• Minimum payout: $10.00</p>
            <p>• Processing time: 2-5 business days</p>
            <p>• You receive 97% of subscription revenue</p>
          </div>
        </div>

        {/* Tax Information */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Tax Documents</span>
            <button className="text-xs text-indigo-600 hover:text-indigo-500">
              Download
            </button>
          </div>
          <div className="text-sm text-gray-600">
            <p>1099 forms will be available by January 31st</p>
          </div>
        </div>

        {/* Empty State */}
        {(stats?.totalPayouts || 0) === 0 && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 mb-2">No payouts yet</p>
            <p className="text-xs text-gray-400">
              Start earning from subscribers to receive your first payout
            </p>
          </div>
        )}
      </div>
    </div>
  );
}