"use client";

import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/contexts/AuthContext';

interface SafetyProfile {
  userId: string;
  overallSafetyScore: number;
  trustLevel: 'new' | 'trusted' | 'verified' | 'flagged' | 'restricted';
  totalInteractions: number;
  flaggedInteractions: number;
  contentViolations: number;
  isRestricted: boolean;
  familyFriendlyMode: boolean;
}

interface BehaviorSummary {
  currentRiskLevel: string;
  recentIncidents: number;
  safetyScore: number;
  recommendations: string[];
}

export default function UserSafetyDashboard() {
  const { user } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [familyFriendlyMode, setFamilyFriendlyMode] = useState(false);

  // tRPC queries
  const { data: safetyProfile, isLoading: profileLoading } = trpc.contentModeration.getUserSafetyProfile.useQuery({
    userId: user?.id || '',
  }, {
    enabled: !!user?.id,
  });

  const { data: behaviorSummary, isLoading: summaryLoading } = trpc.behaviorAnalysis.getBehaviorSummary.useQuery({
    userId: user?.id || '',
  }, {
    enabled: !!user?.id,
  });

  const getTrustLevelInfo = (trustLevel: string) => {
    switch (trustLevel) {
      case 'verified':
        return { color: 'text-blue-600', bg: 'bg-blue-100', label: 'Verified User' };
      case 'trusted':
        return { color: 'text-green-600', bg: 'bg-green-100', label: 'Trusted User' };
      case 'flagged':
        return { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Flagged Account' };
      case 'restricted':
        return { color: 'text-red-600', bg: 'bg-red-100', label: 'Restricted Account' };
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-100', label: 'New User' };
    }
  };

  const getRiskLevelInfo = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return { color: 'text-green-600', bg: 'bg-green-100', icon: '✅' };
      case 'medium':
        return { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: '⚠️' };
      case 'high':
        return { color: 'text-orange-600', bg: 'bg-orange-100', icon: '🔶' };
      case 'critical':
        return { color: 'text-red-600', bg: 'bg-red-100', icon: '🚨' };
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-100', icon: '❓' };
    }
  };

  const getSafetyScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    if (score >= 0.4) return 'text-orange-600';
    return 'text-red-600';
  };

  if (profileLoading || summaryLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  const trustInfo = getTrustLevelInfo(safetyProfile?.trustLevel || 'new');
  const riskInfo = getRiskLevelInfo(behaviorSummary?.currentRiskLevel || 'low');

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Safety Dashboard</h1>
            <p className="text-gray-600">Monitor your account safety and interaction history</p>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Safety Settings
          </button>
        </div>
      </div>

      {/* Safety Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Safety Score */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Safety Score</p>
              <p className={`text-2xl font-bold ${getSafetyScoreColor(behaviorSummary?.safetyScore || 1)}`}>
                {((behaviorSummary?.safetyScore || 1) * 100).toFixed(0)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">Based on your interactions</p>
        </div>

        {/* Trust Level */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Trust Level</p>
              <p className={`text-lg font-semibold ${trustInfo.color}`}>
                {trustInfo.label}
              </p>
            </div>
            <div className={`w-12 h-12 ${trustInfo.bg} rounded-full flex items-center justify-center`}>
              <svg className={`w-6 h-6 ${trustInfo.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">Account standing</p>
        </div>

        {/* Risk Level */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Risk Level</p>
              <p className={`text-lg font-semibold ${riskInfo.color} capitalize`}>
                {behaviorSummary?.currentRiskLevel || 'low'}
              </p>
            </div>
            <div className={`w-12 h-12 ${riskInfo.bg} rounded-full flex items-center justify-center`}>
              <span className="text-xl">{riskInfo.icon}</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">Current assessment</p>
        </div>
      </div>

      {/* Activity Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Interaction History */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Interaction History</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Interactions</span>
              <span className="text-sm font-medium text-gray-900">
                {safetyProfile?.totalInteractions || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Flagged Interactions</span>
              <span className="text-sm font-medium text-gray-900">
                {safetyProfile?.flaggedInteractions || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Content Violations</span>
              <span className="text-sm font-medium text-gray-900">
                {safetyProfile?.contentViolations || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Recent Incidents</span>
              <span className="text-sm font-medium text-gray-900">
                {behaviorSummary?.recentIncidents || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Safety Recommendations */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Safety Recommendations</h3>
          {behaviorSummary?.recommendations && behaviorSummary.recommendations.length > 0 ? (
            <div className="space-y-3">
              {behaviorSummary.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-gray-700">{rec}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">All Good!</h3>
              <p className="mt-1 text-sm text-gray-500">
                Your account is in good standing with no recommendations at this time.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Safety Settings Panel */}
      {showSettings && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Safety Settings</h3>
          
          <div className="space-y-6">
            {/* Family-Friendly Mode */}
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">Family-Friendly Mode</h4>
                <p className="text-sm text-gray-600">
                  Enable additional content filtering and safety restrictions
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={familyFriendlyMode}
                  onChange={(e) => setFamilyFriendlyMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Content Filtering */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Content Filtering Preferences</h4>
              <div className="space-y-3">
                {[
                  { id: 'nsfw', label: 'Block NSFW Content', description: 'Hide mature and adult content' },
                  { id: 'violence', label: 'Filter Violent Content', description: 'Reduce exposure to violent themes' },
                  { id: 'language', label: 'Filter Strong Language', description: 'Hide content with explicit language' },
                ].map((filter) => (
                  <label key={filter.id} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-700">{filter.label}</p>
                      <p className="text-xs text-gray-500">{filter.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Privacy Controls */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Privacy Controls</h4>
              <div className="space-y-3">
                {[
                  { id: 'profile_visibility', label: 'Limit Profile Visibility', description: 'Only verified users can view your profile' },
                  { id: 'interaction_logging', label: 'Enhanced Interaction Logging', description: 'Keep detailed logs of all interactions' },
                  { id: 'safety_notifications', label: 'Safety Notifications', description: 'Get notified about safety-related activity' },
                ].map((control) => (
                  <label key={control.id} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-700">{control.label}</p>
                      <p className="text-xs text-gray-500">{control.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors">
                Save Settings
              </button>
              <button 
                onClick={() => setShowSettings(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Status Alerts */}
      {safetyProfile?.isRestricted && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Account Restricted</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  Your account has been restricted due to safety concerns. Please review our 
                  <a href="/guidelines" className="font-medium underline hover:text-red-600"> community guidelines</a> 
                  and contact support if you believe this is an error.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Need Help?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/safety/guidelines"
            className="flex items-center space-x-3 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-900">Community Guidelines</p>
              <p className="text-xs text-gray-500">Learn about our safety standards</p>
            </div>
          </a>

          <a
            href="/support/safety"
            className="flex items-center space-x-3 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-900">Contact Safety Support</p>
              <p className="text-xs text-gray-500">Get help with safety concerns</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}