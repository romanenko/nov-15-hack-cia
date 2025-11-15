import { sql } from '@vercel/postgres';
import { UserProfile, XApiResponse } from './types';
import { parseXDate } from './xApi';

// Get user profile from database
export async function getUserFromDb(handle: string): Promise<UserProfile | null> {
  try {
    const { rows } = await sql<UserProfile>`
      SELECT * FROM users WHERE handle = ${handle}
    `;
    return rows[0] || null;
  } catch (error) {
    console.error('Database error (getUserFromDb):', error);
    throw new Error('Failed to fetch user from database');
  }
}

// Save new user profile to database (upsert)
export async function saveUserToDb(xData: XApiResponse): Promise<UserProfile> {
  try {
    const { rows } = await sql<UserProfile>`
      INSERT INTO users (
        handle,
        avatar,
        header_image,
        "desc",
        name,
        website,
        location,
        friends_count,
        sub_count,
        statuses_count,
        created_at,
        updated_at
      ) VALUES (
        ${xData.profile},
        ${xData.avatar},
        ${xData.header_image},
        ${xData.desc},
        ${xData.name},
        ${xData.website || null},
        ${xData.location || null},
        ${xData.friends},
        ${xData.sub_count},
        ${xData.statuses_count},
        ${parseXDate(xData.created_at)},
        NOW()
      )
      ON CONFLICT (handle)
      DO UPDATE SET
        avatar = EXCLUDED.avatar,
        header_image = EXCLUDED.header_image,
        "desc" = EXCLUDED."desc",
        name = EXCLUDED.name,
        website = EXCLUDED.website,
        location = EXCLUDED.location,
        friends_count = EXCLUDED.friends_count,
        sub_count = EXCLUDED.sub_count,
        statuses_count = EXCLUDED.statuses_count,
        updated_at = NOW()
      RETURNING *
    `;

    return rows[0];
  } catch (error) {
    console.error('Database error (saveUserToDb):', error);
    throw new Error('Failed to save user to database');
  }
}

// Check if profile data is stale (older than specified hours)
export function isProfileStale(profile: UserProfile, maxAgeHours = 1): boolean {
  if (!profile.updated_at) return true;

  const now = new Date();
  const updated = new Date(profile.updated_at);
  const hoursSinceUpdate = (now.getTime() - updated.getTime()) / (1000 * 60 * 60);

  return hoursSinceUpdate > maxAgeHours;
}
