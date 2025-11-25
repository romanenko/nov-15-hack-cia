import { NextRequest, NextResponse } from 'next/server';
import { canRunResearch } from '@/app/lib/db';

export const dynamic = 'force-dynamic';

export interface ResearchStatusResponse {
  success: boolean;
  status: 'not_started' | 'running' | 'completed' | 'failed';
  started_at?: string;
  completed_at?: string;
  hours_ago?: number;
  error_message?: string;
  can_retry?: boolean;
}

/**
 * GET /api/research/[username]/status
 *
 * Check the status of research for a user
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await context.params;

    if (!username) {
      return NextResponse.json(
        { success: false, status: 'not_started' } as ResearchStatusResponse,
        { status: 400 }
      );
    }

    // Check if research exists and its status
    const existingRun = await canRunResearch(username);

    if (!existingRun) {
      // No research run in last 24 hours - can start new research
      return NextResponse.json({
        success: true,
        status: 'not_started',
        can_retry: true,
      } as ResearchStatusResponse);
    }

    const hoursAgo = Math.round(
      (Date.now() - new Date(existingRun.started_at).getTime()) / (1000 * 60 * 60)
    );

    const response: ResearchStatusResponse = {
      success: true,
      status: existingRun.status,
      started_at: existingRun.started_at.toISOString(),
      completed_at: existingRun.completed_at?.toISOString(),
      hours_ago: hoursAgo,
      error_message: existingRun.error_message || undefined,
      can_retry: existingRun.status === 'failed' || hoursAgo >= 24,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Research Status API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        status: 'not_started',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      } as ResearchStatusResponse,
      { status: 500 }
    );
  }
}
