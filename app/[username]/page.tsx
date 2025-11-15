'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import ProfileHeader from '../components/ProfileHeader';
import InsightCard from '../components/InsightCard';
import { ProfileData, Insight, fetchInsights } from '../lib/mockData';
import { fetchProfileData } from '../lib/api';

type PageState = 'loading' | 'error' | 'success';

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;

  const [state, setState] = useState<PageState>('loading');
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [error, setError] = useState<string>('');

  const loadData = async () => {
    setState('loading');
    setError('');

    try {
      // Fetch real profile data from API
      const apiResponse = await fetchProfileData(username);

      if (!apiResponse.success || !apiResponse.data) {
        throw new Error(apiResponse.error || 'Failed to fetch profile');
      }

      // Map database schema to frontend ProfileData interface
      const profileData: ProfileData = {
        username: apiResponse.data.handle,
        name: apiResponse.data.name || '',
        avatar: apiResponse.data.avatar || '',
        bio: apiResponse.data.desc || '',
        followers: apiResponse.data.sub_count,
        following: apiResponse.data.friends_count,
        verified: false, // TODO: Add verification field to DB if needed
      };

      // Still using mock data for insights
      const insightsData = await fetchInsights(username);

      setProfile(profileData);
      setInsights(insightsData);
      setState('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setState('error');
    }
  };

  useEffect(() => {
    loadData();
  }, [username]);

  if (state === 'loading') {
    return <LoadingSpinner />;
  }

  if (state === 'error') {
    return <ErrorMessage message={error} onRetry={loadData} />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {profile && <ProfileHeader profile={profile} />}

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
