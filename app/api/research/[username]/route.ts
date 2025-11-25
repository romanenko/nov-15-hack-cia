import { NextRequest, NextResponse } from 'next/server';
import { researchPerson, LinkupError } from '@/app/lib/linkupClient';
import { getUserFromDb, canRunResearch, startResearchRun, completeResearchRun, failResearchRun, insertFeatures, saveResearchMetadata } from '@/app/lib/db';
import { ResearchApiResponse, LinkupResearchResponse } from '@/app/lib/types';

export const dynamic = 'force-dynamic';

/**
 * Convert Linkup research profile fields into Feature records
 * Only includes the 6 profile questions (not biography, confidence, sources)
 */
function convertResearchToFeatures(
  research: LinkupResearchResponse
): Array<{ question_slug: string; answer: string }> {
  return [
    { question_slug: 'beliefs', answer: research.profile.beliefs },
    { question_slug: 'expertise', answer: research.profile.expertise },
    { question_slug: 'voting_preferences', answer: research.profile.voting_preferences },
    { question_slug: 'relationship_with_risk', answer: research.profile.relationship_with_risk },
    { question_slug: 'unspoken_worldview', answer: research.profile.unspoken_worldview },
    { question_slug: 'projected_socioeconomic_class', answer: research.profile.projected_socioeconomic_class },
  ];
}

/**
 * Store research results:
 * - Features (6 profile fields) go to features table
 * - Metadata (biography, confidence, sources) go to research_runs table
 */
async function storeResearchResults(
  username: string,
  researchRunId: number,
  research: LinkupResearchResponse
): Promise<void> {
  try {
    // Save metadata to research_runs table (for future UI)
    await saveResearchMetadata(username, {
      biography: research.biography,
      confidence: research.confidence,
      sources: research.sources,
    });

    // Save profile fields as features
    const features = convertResearchToFeatures(research);
    const insertedCount = await insertFeatures(username, researchRunId, features);
    console.log(`[Research] Successfully stored ${insertedCount} features + metadata for @${username}`);
  } catch (error) {
    console.error(`[Research] Error storing research results for @${username}:`, error);
    throw error;
  }
}

/**
 * GET /api/research/[username]
 *
 * Performs deep OSINT research on a person using their X/Twitter profile
 * and stores the results as features in the database.
 *
 * DEDUPLICATION: Only runs once per day per user. Prevents concurrent runs.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await context.params;

    if (!username) {
      const response: ResearchApiResponse = {
        success: false,
        error: 'Username is required'
      };
      return NextResponse.json(response, { status: 400 });
    }

    console.log(`[Research API] Request received for @${username}`);

    // Check if research can be run (respects 1-day cooldown and prevents duplicates)
    const existingRun = await canRunResearch(username);

    if (existingRun) {
      const hoursAgo = Math.round(
        (Date.now() - new Date(existingRun.started_at).getTime()) / (1000 * 60 * 60)
      );

      if (existingRun.status === 'running') {
        console.log(`[Research API] Research already running for @${username}`);
        const response: ResearchApiResponse = {
          success: false,
          error: `Research is already running for @${username}. Started ${hoursAgo} hour(s) ago.`
        };
        return NextResponse.json(response, { status: 429 });
      }

      if (existingRun.status === 'completed') {
        console.log(`[Research API] Research already completed today for @${username}`);
        const response: ResearchApiResponse = {
          success: false,
          error: `Research was already completed for @${username} ${hoursAgo} hour(s) ago. Please wait 24 hours before running again.`
        };
        return NextResponse.json(response, { status: 429 });
      }

      // If status is 'failed', allow retry
      console.log(`[Research API] Previous research failed for @${username}, allowing retry`);
    }

    // Fetch user profile from database to get name and profile URL
    const userProfile = await getUserFromDb(username);

    if (!userProfile) {
      const response: ResearchApiResponse = {
        success: false,
        error: 'User profile not found. Please fetch the profile first.'
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Start a new research run (atomic - prevents race conditions)
    const researchRun = await startResearchRun(username);

    if (!researchRun) {
      console.log(`[Research API] Could not start research for @${username} - already running`);
      const response: ResearchApiResponse = {
        success: false,
        error: 'Research is already running for this user'
      };
      return NextResponse.json(response, { status: 429 });
    }

    console.log(`[Research API] Starting research for @${username}`);

    try {
      // Perform research using Linkup
      const researchResult = await researchPerson(
        username,
        userProfile.name || undefined,
        `https://x.com/${username}`
      );

      // Parse the research result - Linkup SDK returns the structured output in a data property
      const research: LinkupResearchResponse = (researchResult as any).data as LinkupResearchResponse;

      // Store research results (features + metadata)
      await storeResearchResults(username, researchRun.id, research);

      // Mark research as completed
      await completeResearchRun(username);

      console.log(`[Research API] Successfully completed research for @${username}`);

      const response: ResearchApiResponse = {
        success: true,
        data: research
      };

      return NextResponse.json(response, { status: 200 });
    } catch (researchError) {
      // Mark research as failed
      const errorMessage = researchError instanceof Error
        ? researchError.message
        : 'Unknown error';
      await failResearchRun(username, errorMessage);

      throw researchError; // Re-throw to be handled by outer catch
    }
  } catch (error) {
    console.error('[Research API] Error:', error);

    if (error instanceof LinkupError) {
      const response: ResearchApiResponse = {
        success: false,
        error: error.message
      };
      return NextResponse.json(response, { status: error.statusCode || 500 });
    }

    const response: ResearchApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    };

    return NextResponse.json(response, { status: 500 });
  }
}
