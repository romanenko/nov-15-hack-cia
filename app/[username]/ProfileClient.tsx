'use client';

import { useState, useEffect } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import ProfileHeader from '../components/ProfileHeader';
import InsightCard from '../components/InsightCard';
import { ProfileData } from '../lib/mockData';
import { UserProfile, GroupedInsight, Feature, FeaturesApiResponse } from '../lib/types';

type PageState = 'loading' | 'error' | 'success';

interface ProfileClientProps {
  username: string;
  initialProfile: UserProfile;
}

// Helper function to group features by question
function groupFeaturesByQuestion(features: Feature[]): GroupedInsight[] {
  const grouped = new Map<string, string[]>();

  for (const feature of features) {
    if (!feature.answer) continue; // Skip features without answers

    const question = feature.name;
    const answer = feature.answer;

    if (!grouped.has(question)) {
      grouped.set(question, []);
    }
    grouped.get(question)!.push(answer);
  }

  return Array.from(grouped.entries()).map(([question, answers]) => ({
    question,
    answers,
  }));
}

export default function ProfileClient({ username, initialProfile }: ProfileClientProps) {
  const [state, setState] = useState<PageState>('loading');
  const [insights, setInsights] = useState<GroupedInsight[]>([]);
  const [error, setError] = useState<string>('');

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

  const loadInsights = async () => {
    setState('loading');
    setError('');

    try {
      // Fetch features from database
      const featuresResponse = await fetch(`/api/features/${username}`);
      const featuresData: FeaturesApiResponse = await featuresResponse.json();

      if (!featuresData.success || !featuresData.data) {
        // No features found - show empty state
        setInsights([]);
        setState('success');
        return;
      }

      // Group features by question (name field)
      const groupedInsights = groupFeaturesByQuestion(featuresData.data);

      setInsights(groupedInsights);
      setState('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setState('error');
    }
  };

  useEffect(() => {
    loadInsights();
  }, [username]);

  if (state === 'loading') {
    return <LoadingSpinner />;
  }

  if (state === 'error') {
    return <ErrorMessage message={error} onRetry={loadInsights} />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <ProfileHeader profile={profile} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-black dark:text-white mb-6">
          Intelligence Analysis
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {insights.map((insight, index) => (
            <InsightCard key={index} insight={insight} />
          ))}
        </div>
      </div>
    </div>
  );
}
