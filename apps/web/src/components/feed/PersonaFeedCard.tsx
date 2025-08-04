"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/contexts/AuthContext';

interface FeedItem {
  id: string;
  itemType: 'persona_recommendation' | 'trending_persona' | 'creator_update' | 'followed_creator_persona' | 'similar_personas' | 'review_highlight';
  persona?: any;
  creator?: any;
  relevanceScore: number;
  algorithmSource: string;
  isPromoted: boolean;
  isTrending: boolean;
  metadata: {
    reason: string[];
    tags: string[];
    engagementData?: any;
  };
}

interface PersonaFeedCardProps {
  feedItem: FeedItem;
  onInteraction: (feedItemId: string, interactionType: 'viewed' | 'clicked' | 'liked' | 'shared' | 'dismissed') => void;
  viewportIndex: number;
}

export default function PersonaFeedCard({ feedItem, onInteraction, viewportIndex }: PersonaFeedCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isViewed, setIsViewed] = useState(false);

  const { persona, creator, metadata, isPromoted, isTrending } = feedItem;

  // tRPC queries
  const { data: personaEngagement } = trpc.socialEngagement.getPersonaEngagement.useQuery({
    personaId: persona?.id || '',
  }, {
    enabled: !!persona?.id,
  });

  const { data: likedStatus } = trpc.socialEngagement.isLiked.useQuery({
    personaId: persona?.id || '',
  }, {
    enabled: !!persona?.id,
  });

  const { data: followStatus } = trpc.socialEngagement.isFollowing.useQuery({
    creatorId: creator?.id || persona?.userId || '',
  }, {
    enabled: !!(creator?.id || persona?.userId),
  });

  // tRPC mutations
  const toggleLikeMutation = trpc.socialEngagement.toggleLike.useMutation({
    onSuccess: (result) => {
      setIsLiked(result.isLiked);
      setLikeCount(result.likeCount);
    },
  });

  const toggleFollowMutation = trpc.socialEngagement.toggleFollow.useMutation({
    onSuccess: (result) => {
      setIsFollowing(result.isFollowing);
    },
  });

  // Initialize state from tRPC data
  useEffect(() => {
    if (likedStatus) {
      setIsLiked(likedStatus.isLiked);
    }
  }, [likedStatus]);

  useEffect(() => {
    if (followStatus) {
      setIsFollowing(followStatus.isFollowing);
    }
  }, [followStatus]);

  useEffect(() => {
    if (personaEngagement) {
      setLikeCount(personaEngagement.likes);
    }
  }, [personaEngagement]);

  // Track view when card comes into viewport
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isViewed) {
        setIsViewed(true);
        onInteraction(feedItem.id, 'viewed');
      }
    }, 1000); // Mark as viewed after 1 second

    return () => clearTimeout(timer);
  }, [feedItem.id, isViewed, onInteraction]);

  const handleLike = () => {
    if (!persona?.id) return;

    toggleLikeMutation.mutate({
      personaId: persona.id,
      likeType: 'like',
      discoveredVia: 'feed',
    });

    onInteraction(feedItem.id, 'liked');
  };

  const handleFollow = () => {
    const creatorId = creator?.id || persona?.userId;
    if (!creatorId) return;

    toggleFollowMutation.mutate({
      creatorId: creatorId,
      followReason: 'persona_discovery',
    });
  };

  const handlePersonaClick = () => {
    if (!persona?.id) return;
    
    onInteraction(feedItem.id, 'clicked');
    router.push(`/personas/${persona.id}`);
  };

  const handleCreatorClick = () => {
    const creatorId = creator?.id || persona?.userId;
    if (!creatorId) return;

    router.push(`/creators/${creatorId}`);
  };

  const handleShare = () => {
    if (navigator.share && persona?.id) {
      navigator.share({
        title: `Check out ${persona.name} on Hibiji`,
        text: persona.description,
        url: `${window.location.origin}/personas/${persona.id}`,
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/personas/${persona.id}`);
    }
    
    onInteraction(feedItem.id, 'shared');
  };

  const handleDismiss = () => {
    onInteraction(feedItem.id, 'dismissed');
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  const getItemTypeIcon = () => {
    switch (feedItem.itemType) {
      case 'trending_persona':
        return '🔥';
      case 'followed_creator_persona':
        return '👥';
      case 'persona_recommendation':
        return '✨';
      case 'similar_personas':
        return '🎯';
      case 'creator_update':
        return '🆕';
      default:
        return '📱';
    }
  };

  const getItemTypeLabel = () => {
    switch (feedItem.itemType) {
      case 'trending_persona':
        return 'Trending';
      case 'followed_creator_persona':
        return 'From creator you follow';
      case 'persona_recommendation':
        return 'Recommended for you';
      case 'similar_personas':
        return 'Similar to what you like';
      case 'creator_update':
        return 'New creator';
      default:
        return 'Discover';
    }
  };

  if (!persona) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      {/* Card Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Creator Avatar */}
            <button onClick={handleCreatorClick} className="focus:outline-none">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                {(creator?.name || persona?.creatorName || 'A')[0].toUpperCase()}
              </div>
            </button>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <button 
                  onClick={handleCreatorClick}
                  className="font-medium text-gray-900 hover:text-indigo-600 transition-colors"
                >
                  {creator?.name || persona?.creatorName || 'Anonymous Creator'}
                </button>
                {creator?.isVerified && (
                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>{getItemTypeIcon()}</span>
                <span>{getItemTypeLabel()}</span>
                {isTrending && (
                  <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                    Trending
                  </span>
                )}
                {isPromoted && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    Sponsored
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Follow Button */}
          <button
            onClick={handleFollow}
            disabled={toggleFollowMutation.isLoading}
            className={`px-4 py-1 rounded-lg text-sm font-medium transition-colors ${
              isFollowing
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {toggleFollowMutation.isLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
          </button>
        </div>
      </div>

      {/* Persona Content */}
      <div className="cursor-pointer" onClick={handlePersonaClick}>
        {/* Persona Image */}
        {persona.profilePicture && (
          <div className="aspect-square relative">
            <img
              src={persona.profilePicture}
              alt={persona.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Overlay with quick info */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end">
              <div className="p-4 text-white">
                <h3 className="text-xl font-bold mb-1">{persona.name}</h3>
                <p className="text-sm opacity-90">{persona.category}</p>
              </div>
            </div>
          </div>
        )}

        {/* Persona Details */}
        <div className="p-4">
          {!persona.profilePicture && (
            <div className="mb-3">
              <h3 className="text-lg font-bold text-gray-900 mb-1">{persona.name}</h3>
              <p className="text-sm text-gray-600">{persona.category}</p>
            </div>
          )}

          {/* Description */}
          <p className="text-gray-800 mb-3 line-clamp-2">
            {persona.description || 'An interesting persona to chat with...'}
          </p>

          {/* Tags */}
          {metadata.tags && metadata.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {metadata.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Rating and Reviews */}
          {personaEngagement && personaEngagement.averageRating > 0 && (
            <div className="flex items-center space-x-2 mb-3">
              <div className="flex">
                {getRatingStars(Math.round(personaEngagement.averageRating))}
              </div>
              <span className="text-sm text-gray-600">
                {personaEngagement.averageRating.toFixed(1)}
              </span>
              <span className="text-sm text-gray-500">
                ({personaEngagement.reviews} review{personaEngagement.reviews !== 1 ? 's' : ''})
              </span>
            </div>
          )}

          {/* Recommendation Reason */}
          {metadata.reason && metadata.reason.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-3 mb-3">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Why you might like this: </span>
                {metadata.reason.join(', ')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Card Actions */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Like Button */}
            <button
              onClick={handleLike}
              disabled={toggleLikeMutation.isLoading}
              className="flex items-center space-x-2 text-gray-600 hover:text-red-500 transition-colors"
            >
              <svg
                className={`w-6 h-6 ${isLiked ? 'text-red-500 fill-current' : ''}`}
                fill={isLiked ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              {likeCount > 0 && <span className="text-sm">{likeCount}</span>}
            </button>

            {/* Chat Button */}
            <button
              onClick={handlePersonaClick}
              className="flex items-center space-x-2 text-gray-600 hover:text-indigo-500 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-sm">Chat</span>
            </button>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="flex items-center space-x-2 text-gray-600 hover:text-green-500 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </button>
          </div>

          {/* Dismiss Button */}
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}