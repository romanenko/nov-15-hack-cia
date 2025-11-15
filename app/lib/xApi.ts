import { XApiResponse } from './types';

export class XApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'XApiError';
  }
}

export async function fetchXProfile(username: string): Promise<XApiResponse> {
  const url = `https://${process.env.X_RAPIDAPI_HOST}/screenname.php?screenname=${encodeURIComponent(username)}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': process.env.X_RAPIDAPI_HOST!,
        'x-rapidapi-key': process.env.X_RAPIDAPI_KEY!,
      },
      // Don't cache in Next.js - we manage caching in our DB
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new XApiError('User not found on X', 404);
      }
      if (response.status === 429) {
        throw new XApiError('Rate limit exceeded', 429);
      }
      throw new XApiError(
        `X API error: ${response.statusText}`,
        response.status
      );
    }

    const data: XApiResponse = await response.json();

    // Validate required fields
    if (!data.profile || !data.name) {
      throw new XApiError('Invalid response from X API', 500);
    }

    return data;
  } catch (error) {
    if (error instanceof XApiError) {
      throw error;
    }

    // Log the error for debugging
    console.error('X API fetch error:', error);

    throw new XApiError(
      'Failed to fetch from X API',
      500,
      error
    );
  }
}

// Helper to parse X's date format: "Tue Aug 30 05:35:51 +0000 2016"
export function parseXDate(dateString: string): Date {
  return new Date(dateString);
}
