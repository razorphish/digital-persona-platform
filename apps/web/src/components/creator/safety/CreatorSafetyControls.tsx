"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';

interface SafetyControlsProps {
  personaId: string;
  personaName: string;
  onClose?: () => void;
}

interface UserInteraction {
  id: string;
  ratedUserId: string;
  personaId: string;
  conversationId: string;
  safetyRating: number;
  behaviorTags: string[];
  isInappropriate: boolean;
  isThreatening: boolean;
  isHarassing: boolean;
  isSpam: boolean;
  isBlocked: boolean;
  ratingReason?: string;
  ratingNotes?: string;
  createdAt: string;
  updatedAt: string;
}

const BEHAVIOR_TAGS = [
  'respectful',
  'friendly',
  'inappropriate',
  'threatening',
  'harassing',
  'spam',
  'aggressive',
  'suspicious',
  'professional',
  'rude',
  'persistent',
  'helpful'
];

const SAFETY_RATINGS = [
  { value: 5, label: 'Very Safe', color: 'text-green-600', bgColor: 'bg-green-100' },
  { value: 4, label: 'Safe', color: 'text-green-500', bgColor: 'bg-green-50' },
  { value: 3, label: 'Neutral', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  { value: 2, label: 'Concerning', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  { value: 1, label: 'Unsafe', color: 'text-red-600', bgColor: 'bg-red-100' },
];

export default function CreatorSafetyControls({ personaId, personaName, onClose }: SafetyControlsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'interactions' | 'blocked' | 'incidents'>('overview');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingData, setRatingData] = useState({
    safetyRating: 3,
    behaviorTags: [] as string[],
    isInappropriate: false,
    isThreatening: false,
    isHarassing: false,
    isSpam: false,
    ratingReason: '',
    ratingNotes: '',
    isBlocked: false,
  });

  // tRPC queries
  const { data: interactions, refetch: refetchInteractions } = trpc.contentModeration.getUserInteractionRatings.useQuery({
    userId: selectedUserId || '',
    personaId: personaId,
  }, {
    enabled: !!selectedUserId,
  });

  // tRPC mutations
  const rateUserMutation = trpc.contentModeration.rateUserInteraction.useMutation({
    onSuccess: () => {
      refetchInteractions();
      setShowRatingModal(false);
      setRatingData({
        safetyRating: 3,
        behaviorTags: [],
        isInappropriate: false,
        isThreatening: false,
        isHarassing: false,
        isSpam: false,
        ratingReason: '',
        ratingNotes: '',
        isBlocked: false,
      });
    },
  });

  const blockUserMutation = trpc.contentModeration.blockUser.useMutation({
    onSuccess: () => {
      refetchInteractions();
    },
  });

  const handleRateUser = async () => {
    if (!selectedUserId) return;

    try {
      await rateUserMutation.mutateAsync({
        ratedUserId: selectedUserId,
        personaId: personaId,
        conversationId: 'temp-conversation-id', // TODO: Get actual conversation ID
        ...ratingData,
      });
    } catch (error) {
      console.error('Error rating user:', error);
    }
  };

  const handleBlockUser = async (userId: string, isBlocked: boolean) => {
    try {
      await blockUserMutation.mutateAsync({
        userId: userId,
        personaId: personaId,
        isBlocked: isBlocked,
      });
    } catch (error) {
      console.error('Error blocking/unblocking user:', error);
    }
  };

  const toggleBehaviorTag = (tag: string) => {
    setRatingData(prev => ({
      ...prev,
      behaviorTags: prev.behaviorTags.includes(tag)
        ? prev.behaviorTags.filter(t => t !== tag)
        : [...prev.behaviorTags, tag]
    }));
  };

  const getSafetyRatingInfo = (rating: number) => {
    return SAFETY_RATINGS.find(r => r.value === rating) || SAFETY_RATINGS[2];
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Safety Controls</h2>
            <p className="text-gray-600">Manage user interactions for {personaName}</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="mt-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'interactions', label: 'User Interactions', icon: '👥' },
              { id: 'blocked', label: 'Blocked Users', icon: '🚫' },
              { id: 'incidents', label: 'Safety Incidents', icon: '⚠️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 pb-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Safety Metrics */}
              <div className="bg-green-50 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800">Overall Safety Score</p>
                    <p className="text-2xl font-bold text-green-900">4.2/5.0</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-green-700 mt-1">Based on user ratings</p>
              </div>

              <div className="bg-blue-50 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-800">Total Interactions</p>
                    <p className="text-2xl font-bold text-blue-900">1,247</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-blue-700 mt-1">Last 30 days</p>
              </div>

              <div className="bg-red-50 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-800">Blocked Users</p>
                    <p className="text-2xl font-bold text-red-900">3</p>
                  </div>
                  <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-red-700 mt-1">Active blocks</p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Safety Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">User @john_doe rated 5/5 - Respectful interaction</span>
                  <span className="text-gray-400">2 hours ago</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-600">Content flagged for review - Mild language</span>
                  <span className="text-gray-400">4 hours ago</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-gray-600">User @troublemaker blocked for harassment</span>
                  <span className="text-gray-400">1 day ago</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setActiveTab('interactions')}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 p-4 rounded-lg transition-colors text-left"
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <div>
                    <p className="font-medium">Review User Interactions</p>
                    <p className="text-sm opacity-75">Rate and manage user behavior</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('incidents')}
                className="bg-orange-50 hover:bg-orange-100 text-orange-700 p-4 rounded-lg transition-colors text-left"
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.081 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <p className="font-medium">Safety Incidents</p>
                    <p className="text-sm opacity-75">Review flagged content and reports</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* User Interactions Tab */}
        {activeTab === 'interactions' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">User Interactions</h3>
              <button
                onClick={() => setShowRatingModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Rate User Interaction
              </button>
            </div>

            {/* Placeholder for interaction list */}
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No interactions to review</h3>
              <p className="mt-1 text-sm text-gray-500">
                User interactions will appear here for review and rating
              </p>
            </div>
          </div>
        )}

        {/* Other tabs (placeholder) */}
        {(activeTab === 'blocked' || activeTab === 'incidents') && (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <h3 className="text-sm font-medium text-gray-900 capitalize">{activeTab} Content</h3>
            <p className="mt-1 text-sm text-gray-500">
              This section is under development
            </p>
          </div>
        )}
      </div>

      {/* User Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Rate User Interaction</h3>
            
            {/* Safety Rating */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Safety Rating
              </label>
              <div className="space-y-2">
                {SAFETY_RATINGS.map((rating) => (
                  <button
                    key={rating.value}
                    onClick={() => setRatingData(prev => ({ ...prev, safetyRating: rating.value }))}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-colors ${
                      ratingData.safetyRating === rating.value
                        ? `border-indigo-500 ${rating.bgColor}`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className={`font-medium ${ratingData.safetyRating === rating.value ? rating.color : 'text-gray-700'}`}>
                      {rating.label}
                    </span>
                    <span className={`text-sm ${ratingData.safetyRating === rating.value ? rating.color : 'text-gray-500'}`}>
                      {rating.value}/5
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Behavior Tags */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Behavior Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {BEHAVIOR_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleBehaviorTag(tag)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      ratingData.behaviorTags.includes(tag)
                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                        : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Specific Concerns */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specific Concerns
              </label>
              <div className="space-y-2">
                {[
                  { key: 'isInappropriate', label: 'Inappropriate Content' },
                  { key: 'isThreatening', label: 'Threatening Behavior' },
                  { key: 'isHarassing', label: 'Harassment' },
                  { key: 'isSpam', label: 'Spam' },
                  { key: 'isBlocked', label: 'Block This User' },
                ].map((concern) => (
                  <label key={concern.key} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={ratingData[concern.key as keyof typeof ratingData] as boolean}
                      onChange={(e) => setRatingData(prev => ({ 
                        ...prev, 
                        [concern.key]: e.target.checked 
                      }))}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{concern.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Rating Reason */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason (Optional)
              </label>
              <textarea
                value={ratingData.ratingReason}
                onChange={(e) => setRatingData(prev => ({ ...prev, ratingReason: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
                placeholder="Explain your rating..."
              />
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                onClick={() => setShowRatingModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRateUser}
                disabled={rateUserMutation.isLoading}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {rateUserMutation.isLoading ? 'Rating...' : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}