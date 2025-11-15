import { Pool } from 'pg';
import { UserProfile, XApiResponse } from './types';
import { parseXDate } from './xApi';

// Disable TLS certificate validation for development (required for Supabase)
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// Create a connection pool using standard pg library with Prisma pooled connection
const pool = new Pool({
  connectionString: process.env.POSTGRES_PRISMA_URL,
  ssl: { rejectUnauthorized: false } // Required for Supabase's certificate chain
});

// Get user profile from database
export async function getUserFromDb(handle: string): Promise<UserProfile | null> {
  try {
    const result = await pool.query<UserProfile>(
      'SELECT * FROM users WHERE handle = $1',
      [handle]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Database error (getUserFromDb):', error);
    throw new Error('Failed to fetch user from database');
  }
}

// Save new user profile to database (upsert)
export async function saveUserToDb(xData: XApiResponse): Promise<UserProfile> {
  try {
    const result = await pool.query<UserProfile>(
      `INSERT INTO users (
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
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()
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
      RETURNING *`,
      [
        xData.profile,
        xData.avatar,
        xData.header_image,
        xData.desc,
        xData.name,
        xData.website || null,
        xData.location || null,
        xData.friends,
        xData.sub_count,
        xData.statuses_count,
        parseXDate(xData.created_at)
      ]
    );

    return result.rows[0];
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
