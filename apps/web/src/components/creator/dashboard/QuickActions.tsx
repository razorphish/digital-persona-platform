import React from 'react';
import { useRouter } from 'next/navigation';

export default function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      title: 'Create New Persona',
      description: 'Add a new monetizable persona',
      icon: (
        <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      action: () => router.push('/personas?create=true'),
      color: 'bg-indigo-50 hover:bg-indigo-100',
      textColor: 'text-indigo-700'
    },
    {
      title: 'Setup Pricing',
      description: 'Configure subscription tiers',
      icon: (
        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      action: () => router.push('/creator/monetization'),
      color: 'bg-green-50 hover:bg-green-100',
      textColor: 'text-green-700'
    },
    {
      title: 'View Analytics',
      description: 'Detailed performance metrics',
      icon: (
        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      action: () => router.push('/creator/analytics'),
      color: 'bg-purple-50 hover:bg-purple-100',
      textColor: 'text-purple-700'
    },
    {
      title: 'Manage Subscribers',
      description: 'View and engage subscribers',
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      action: () => router.push('/creator/subscribers'),
      color: 'bg-blue-50 hover:bg-blue-100',
      textColor: 'text-blue-700'
    },
    {
      title: 'Download Reports',
      description: 'Export earnings and tax data',
      icon: (
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      action: () => router.push('/creator/reports'),
      color: 'bg-gray-50 hover:bg-gray-100',
      textColor: 'text-gray-700'
    },
    {
      title: 'Update Profile',
      description: 'Edit verification info',
      icon: (
        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      action: () => router.push('/creator/verification'),
      color: 'bg-yellow-50 hover:bg-yellow-100',
      textColor: 'text-yellow-700'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        <p className="text-sm text-gray-500">Common creator tasks and tools</p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 gap-3">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className={`${action.color} ${action.textColor} p-4 rounded-lg transition-colors text-left group`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {action.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{action.title}</p>
                  <p className="text-xs opacity-75">{action.description}</p>
                </div>
                <div className="flex-shrink-0">
                  <svg className="w-4 h-4 opacity-50 group-hover:opacity-75 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Creator Support */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900 mb-1">Need Help?</h4>
                <p className="text-xs text-gray-600 mb-3">
                  Get support from our creator success team or browse our knowledge base.
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => router.push('/creator/support')}
                    className="text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-1 rounded transition-colors"
                  >
                    Get Support
                  </button>
                  <button
                    onClick={() => router.push('/creator/guides')}
                    className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1 rounded transition-colors"
                  >
                    Creator Guides
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}