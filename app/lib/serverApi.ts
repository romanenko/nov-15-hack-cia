import { getUserFromDb, isProfileStale } from './db';
import { fetchXProfile } from './xApi';
import { saveUserToDb } from './db';
import { UserProfile } from './types';

/**
 * Server-side function to get profile data
 * This runs on the server only and can directly access the database
 */
export async function getProfileData(username: string): Promise<UserProfile | null> {
  try {
    // Step 1: Check if profile exists in database
    let existingProfile: UserProfile | null = null;

    try {
      existingProfile = await getUserFromDb(username);
    } catch (dbError) {
      console.error('[Server] Database connection error, will try API:', dbError);
    }

    // Step 2: If exists and fresh, return from cache
    if (existingProfile && !isProfileStale(existingProfile, 1)) {
      return existingProfile;
    }

    // Step 3: Fetch fresh data from X API
    console.log(`[Server] Fetching fresh data for @${username} from X API...`);
    const xData = await fetchXProfile(username);

    // Step 4: Save to database (upsert)
    try {
      const savedProfile = await saveUserToDb(xData);
      return savedProfile;
    } catch (dbError) {
      console.error('[Server] Failed to save to database, returning API data:', dbError);
      // Return existing profile if we have it, otherwise null
      return existingProfile;
    }
  } catch (error) {
    console.error('[Server] Error fetching profile data:', error);
    return null;
  }
}
