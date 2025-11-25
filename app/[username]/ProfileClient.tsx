'use client';

import { useState, useEffect, useCallback } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import ProfileHeader from '../components/ProfileHeader';
import InsightCard from '../components/InsightCard';
import ResearchStatus from '../components/ResearchStatus';
import { ProfileData } from '../lib/mockData';
import { UserProfile, Feature, FeaturesApiResponse } from '../lib/types';

type PageState = 'loading' | 'error' | 'success';

interface ProfileClientProps {
  username: string;
  initialProfile: UserProfile;
}

export default function ProfileClient({ username, initialProfile }: ProfileClientProps) {
  const [state, setState] = useState<PageState>('loading');
  const [features, setFeatures] = useState<Feature[]>([]);
  const [error, setError] = useState<string>('');
  const [isPolling, setIsPolling] = useState(false);

  // Map UserProfile (database schema) to ProfileData (frontend interface)
  const profile: ProfileData = {
    username: initialProfile.handle,
    name: initialProfile.name || '',
    avatar: initialProfile.avatar || '',
    bio: initialProfile.desc || '',
    followers: initialProfile.sub_count,
    following: initialProfile.friends_count,
    verified: false, // TODO: Add verification field to DB if needed
  };

  const loadFeatures = useCallback(async (silent = false) => {
    if (!silent) {
      setState('loading');
    }
    setError('');

    try {
      // Fetch features from database (already sorted by display_order, deduped)
      const featuresResponse = await fetch(`/api/features/${username}`);
      const featuresData: FeaturesApiResponse = await featuresResponse.json();

      if (!featuresData.success || !featuresData.data) {
        // No features found - show empty state
        setFeatures([]);
        setState('success');
        return;
      }

      setFeatures(featuresData.data);
      setState('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setState('error');
    }
  }, [username]);

  // Handle research completion - reload features
  const handleResearchComplete = useCallback(() => {
    console.log('[ProfileClient] Research completed, reloading features...');
    loadFeatures(true); // Silent reload
  }, [loadFeatures]);

  useEffect(() => {
    loadFeatures();
  }, [username, loadFeatures]);

  // Poll for new features while research is running
  useEffect(() => {
    if (!isPolling) return;

    const pollInterval = setInterval(() => {
      loadFeatures(true); // Silent reload to avoid UI flicker
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(pollInterval);
  }, [isPolling, loadFeatures]);

  if (state === 'loading') {
    return <LoadingSpinner />;
  }

  if (state === 'error') {
    return <ErrorMessage message={error} onRetry={loadFeatures} />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <ProfileHeader profile={profile} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Research Status Banner */}
        <ResearchStatus
          username={username}
          onResearchComplete={handleResearchComplete}
        />

        <h2 className="text-2xl font-bold text-black dark:text-white mb-6">
          Intelligence Analysis
        </h2>

        {features.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-8 text-center">
            <div className="text-zinc-400 dark:text-zinc-600 mb-2">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              No Intelligence Data Yet
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-500">
              Start research to generate comprehensive intelligence analysis
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature) => (
              <InsightCard key={feature.question_slug} feature={feature} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
