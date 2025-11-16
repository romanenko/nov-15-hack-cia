import { NextRequest, NextResponse } from 'next/server';
import { getFeaturesForUser } from '@/app/lib/db';
import { FeaturesApiResponse } from '@/app/lib/types';

export const dynamic = 'force-dynamic'; // Disable caching for this route

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
      } as FeaturesApiResponse,
      { status: 400 }
    );
  }

  try {
    // Fetch features from database
    const features = await getFeaturesForUser(username);

    return NextResponse.json(
      {
        success: true,
        data: features,
      } as FeaturesApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch features',
      } as FeaturesApiResponse,
      { status: 500 }
    );
  }
}
