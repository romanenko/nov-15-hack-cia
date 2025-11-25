import { Pool } from 'pg';
import { UserProfile, XApiResponse, Feature } from './types';
import { parseXDate } from './xApi';

// Create a connection pool using Neon's pooled connection
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL
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

/**
 * Get features for a user from database
 * Returns only the latest feature per question (deduped by research_run_id)
 * Joins with questions table for human-readable text and display order
 */
export async function getFeaturesForUser(handle: string): Promise<Feature[]> {
  try {
    const result = await pool.query<Feature>(
      `SELECT DISTINCT ON (f.question_slug)
        f.id,
        f.handle,
        f.question_slug,
        q.question_text,
        f.answer,
        f.research_run_id,
        q.display_order,
        f.created_at
      FROM features f
      JOIN questions q ON f.question_slug = q.slug
      WHERE f.handle = $1
        AND f.question_slug IS NOT NULL
      ORDER BY f.question_slug, f.research_run_id DESC`,
      [handle]
    );

    // Sort by display_order after DISTINCT ON (PostgreSQL limitation)
    return result.rows.sort((a, b) => a.display_order - b.display_order);
  } catch (error) {
    console.error('Database error (getFeaturesForUser):', error);
    throw new Error('Failed to fetch features from database');
  }
}

// Research run tracking types
export interface ResearchRun {
  id: number;
  handle: string;
  started_at: Date;
  completed_at: Date | null;
  status: 'running' | 'completed' | 'failed';
  error_message: string | null;
}

/**
 * Check if research can be run for a user (respects 1-day cooldown)
 * Returns null if research can proceed, otherwise returns the most recent run info
 */
export async function canRunResearch(handle: string): Promise<ResearchRun | null> {
  try {
    const result = await pool.query<ResearchRun>(
      `SELECT * FROM research_runs
       WHERE handle = $1
         AND started_at > NOW() - INTERVAL '1 day'
       ORDER BY started_at DESC
       LIMIT 1`,
      [handle]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('Database error (canRunResearch):', error);
    throw new Error('Failed to check research run status');
  }
}

/**
 * Start a new research run (returns null if already running or completed today)
 * Allows retry if previous run failed
 * Uses advisory lock to prevent race conditions
 */
export async function startResearchRun(handle: string): Promise<ResearchRun | null> {
  const client = await pool.connect();
  try {
    // Use advisory lock to prevent race conditions
    // Convert handle to a numeric lock ID (hash the string)
    const lockId = Buffer.from(handle).reduce((acc, byte) => (acc * 31 + byte) >>> 0, 0);

    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock($1)', [lockId]);

    // Check if a successful or running run exists today (ignore failed runs)
    const checkResult = await client.query<ResearchRun>(
      `SELECT * FROM research_runs
       WHERE handle = $1
         AND started_at::DATE = CURRENT_DATE
         AND status IN ('running', 'completed')
       LIMIT 1`,
      [handle]
    );

    if (checkResult.rows.length > 0) {
      await client.query('COMMIT');
      return null; // Already running or completed today
    }

    // Insert new run (or retry if previous run failed)
    const insertResult = await client.query<ResearchRun>(
      `INSERT INTO research_runs (handle, started_at, status)
       VALUES ($1, NOW(), 'running')
       RETURNING *`,
      [handle]
    );

    await client.query('COMMIT');
    return insertResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database error (startResearchRun):', error);
    throw new Error('Failed to start research run');
  } finally {
    client.release();
  }
}

/**
 * Mark a research run as completed
 */
export async function completeResearchRun(handle: string): Promise<void> {
  try {
    await pool.query(
      `UPDATE research_runs
       SET status = 'completed', completed_at = NOW()
       WHERE handle = $1
         AND DATE(started_at) = CURRENT_DATE
         AND status = 'running'`,
      [handle]
    );
  } catch (error) {
    console.error('Database error (completeResearchRun):', error);
    throw new Error('Failed to complete research run');
  }
}

/**
 * Mark a research run as failed
 */
export async function failResearchRun(handle: string, errorMessage: string): Promise<void> {
  try {
    await pool.query(
      `UPDATE research_runs
       SET status = 'failed', error_message = $2
       WHERE handle = $1
         AND DATE(started_at) = CURRENT_DATE
         AND status = 'running'`,
      [handle, errorMessage]
    );
  } catch (error) {
    console.error('Database error (failResearchRun):', error);
    throw new Error('Failed to mark research run as failed');
  }
}

/**
 * Insert features for a user with question slug and research run tracking
 */
export async function insertFeatures(
  handle: string,
  researchRunId: number,
  features: Array<{ question_slug: string; answer: string }>
): Promise<number> {
  try {
    let insertedCount = 0;

    for (const feature of features) {
      await pool.query(
        `INSERT INTO features (handle, name, answer, question_slug, research_run_id, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [handle, feature.question_slug, feature.answer, feature.question_slug, researchRunId]
      );
      insertedCount++;
    }

    console.log(`[Database] Inserted ${insertedCount} features for @${handle}`);
    return insertedCount;
  } catch (error) {
    console.error('Database error (insertFeatures):', error);
    throw new Error('Failed to insert features');
  }
}

/**
 * Save research metadata (biography, confidence, sources) to research_runs table
 */
export async function saveResearchMetadata(
  handle: string,
  metadata: {
    biography: string;
    confidence: string;
    sources: string[];
  }
): Promise<void> {
  try {
    await pool.query(
      `UPDATE research_runs
       SET biography = $2, confidence = $3, sources = $4
       WHERE handle = $1
         AND DATE(started_at) = CURRENT_DATE
         AND status = 'running'`,
      [handle, metadata.biography, metadata.confidence, JSON.stringify(metadata.sources)]
    );
    console.log(`[Database] Saved research metadata for @${handle}`);
  } catch (error) {
    console.error('Database error (saveResearchMetadata):', error);
    throw new Error('Failed to save research metadata');
  }
}

/**
 * Get the current research run ID for a handle (for linking features)
 */
export async function getCurrentResearchRunId(handle: string): Promise<number | null> {
  try {
    const result = await pool.query<{ id: number }>(
      `SELECT id FROM research_runs
       WHERE handle = $1
         AND DATE(started_at) = CURRENT_DATE
         AND status = 'running'
       ORDER BY started_at DESC
       LIMIT 1`,
      [handle]
    );
    return result.rows[0]?.id || null;
  } catch (error) {
    console.error('Database error (getCurrentResearchRunId):', error);
    throw new Error('Failed to get current research run ID');
  }
}
