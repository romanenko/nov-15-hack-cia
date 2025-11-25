import { NextRequest, NextResponse } from 'next/server';
import { fetchXProfile, XApiError } from '@/app/lib/xApi';
import { getUserFromDb, saveUserToDb, isProfileStale, canRunResearch } from '@/app/lib/db';
import { ProfileApiResponse } from '@/app/lib/types';

export const dynamic = 'force-dynamic'; // Disable caching for this route

/**
 * Trigger Linkup research for a user (async, fire-and-forget)
 * Only triggers if no research has been run in the last 24 hours
 */
async function triggerLinkupResearchAsync(username: string): Promise<void> {
  try {
    // Check if research can be run (respects 1-day cooldown)
    const existingRun = await canRunResearch(username);

    if (existingRun) {
      const hoursAgo = Math.round(
        (Date.now() - new Date(existingRun.started_at).getTime()) / (1000 * 60 * 60)
      );

      if (existingRun.status === 'running') {
        console.log(`[Linkup] Research already running for @${username}, skipping trigger`);
        return;
      }

      if (existingRun.status === 'completed') {
        console.log(`[Linkup] Research already completed ${hoursAgo}h ago for @${username}, skipping trigger`);
        return;
      }

      // If status is 'failed', we'll allow retry
      console.log(`[Linkup] Previous research failed for @${username}, will retry`);
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    // Fire and forget - don't await the response
    fetch(`${baseUrl}/api/research/${username}`)
      .then(response => {
        if (response.ok) {
          console.log(`[Linkup] Successfully triggered research for @${username}`);
        } else if (response.status === 429) {
          console.log(`[Linkup] Research already running or recently completed for @${username}`);
        } else {
          console.error(`[Linkup] Failed to trigger research for @${username}: ${response.statusText}`);
        }
      })
      .catch(error => {
        console.error(`[Linkup] Error triggering research for @${username}:`, error);
      });
  } catch (error) {
    console.error(`[Linkup] Error checking research status for @${username}:`, error);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  // Validate username format (Twitter usernames: 1-15 characters)
  if (!username || username.length < 1 || username.length > 15) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid username format',
      } as ProfileApiResponse,
      { status: 400 }
    );
  }

  try {
    // Step 1: Check if profile exists in database
    const existingProfile = await getUserFromDb(username);

    // Step 2: If exists and fresh, return from cache
    if (existingProfile && !isProfileStale(existingProfile, 1)) {
      return NextResponse.json(
        {
          success: true,
          data: existingProfile,
          cached: true,
        } as ProfileApiResponse,
        { status: 200 }
      );
    }

    // Step 3: Fetch fresh data from X API
    console.log(`Fetching fresh data for @${username} from X API...`);
    const xData = await fetchXProfile(username);

    // Step 4: Save to database (upsert)
    const savedProfile = await saveUserToDb(xData);

    // Step 5: Trigger Linkup research (async, fire-and-forget)
    triggerLinkupResearchAsync(username);

    // Step 6: Return fresh data
    return NextResponse.json(
      {
        success: true,
        data: savedProfile,
        cached: false,
      } as ProfileApiResponse,
      { status: 200 }
    );

  } catch (error) {
    console.error('API error:', error);

    // Handle specific X API errors
    if (error instanceof XApiError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        } as ProfileApiResponse,
        { status: error.statusCode }
      );
    }

    // Handle generic errors
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      } as ProfileApiResponse,
      { status: 500 }
    );
  }
}

// POST endpoint to force refresh (bypasses cache)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  // Validate username format
  if (!username || username.length < 1 || username.length > 15) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid username format',
      } as ProfileApiResponse,
      { status: 400 }
    );
  }

  try {
    console.log(`Force refreshing data for @${username}...`);
    const xData = await fetchXProfile(username);
    const savedProfile = await saveUserToDb(xData);

    // Trigger Linkup research (async, fire-and-forget)
    triggerLinkupResearchAsync(username);

    return NextResponse.json(
      {
        success: true,
        data: savedProfile,
        cached: false,
      } as ProfileApiResponse,
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof XApiError) {
      return NextResponse.json(
        { success: false, error: error.message } as ProfileApiResponse,
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ProfileApiResponse,
      { status: 500 }
    );
  }
}
