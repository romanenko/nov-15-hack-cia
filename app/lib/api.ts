import { ProfileApiResponse } from './types';

export async function fetchProfileData(username: string): Promise<ProfileApiResponse> {
  const response = await fetch(`/api/profile/${username}`, {
    method: 'GET',
    cache: 'no-store', // Always get fresh data
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch profile');
  }

  return response.json();
}

// Force refresh (bypasses cache)
export async function refreshProfileData(username: string): Promise<ProfileApiResponse> {
  const response = await fetch(`/api/profile/${username}`, {
    method: 'POST',
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to refresh profile');
  }

  return response.json();
}
