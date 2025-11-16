/**
 * Airia Intelligence Agent Client
 * Triggers intelligence analysis for X/Twitter profiles
 */

const AIRIA_API_URL = 'https://api.airia.ai/v2/PipelineExecution/4f31add3-ea06-4faa-a7a8-660dc45ac28f';
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000; // 1 second

interface AiriaAgentOptions {
  asyncOutput?: boolean;
  retries?: number;
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Trigger Airia intelligence agent for a given username
 * The agent will process the profile and POST results to our /api/insert/features endpoint
 *
 * @param username - X/Twitter username (without @)
 * @param options - Configuration options
 * @returns Promise that resolves when agent is triggered (not when processing completes)
 */
export async function triggerAiriaAgent(
  username: string,
  options: AiriaAgentOptions = {}
): Promise<void> {
  const {
    asyncOutput = true,
    retries = MAX_RETRIES
  } = options;

  const apiKey = process.env.ARIA_API_KEY;

  if (!apiKey) {
    console.error('[Airia] ARIA_API_KEY environment variable not set');
    throw new Error('ARIA_API_KEY not configured');
  }

  const body = {
    userInput: username,
    asyncOutput,
  };

  // Retry with exponential backoff
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      console.log(`[Airia] Triggering agent for @${username} (attempt ${attempt + 1}/${retries})`);

      const response = await fetch(AIRIA_API_URL, {
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Airia API error (${response.status}): ${errorText}`);
      }

      console.log(`[Airia] Successfully triggered agent for @${username}`);
      return; // Success!

    } catch (error) {
      const isLastAttempt = attempt === retries - 1;

      console.error(
        `[Airia] Failed to trigger agent for @${username} (attempt ${attempt + 1}/${retries}):`,
        error
      );

      if (isLastAttempt) {
        // Log final failure but don't throw (fire-and-forget pattern)
        console.error(`[Airia] All ${retries} attempts failed for @${username}`);
        throw error; // Re-throw so caller can log
      }

      // Exponential backoff: 1s, 2s, 4s
      const delayMs = BASE_DELAY_MS * Math.pow(2, attempt);
      console.log(`[Airia] Retrying in ${delayMs}ms...`);
      await sleep(delayMs);
    }
  }
}

/**
 * Trigger Airia agent with fire-and-forget pattern
 * Logs errors but doesn't throw - safe to call without awaiting
 *
 * @param username - X/Twitter username
 */
export function triggerAiriaAgentAsync(username: string): void {
  triggerAiriaAgent(username)
    .catch(error => {
      console.error(`[Airia] Fire-and-forget trigger failed for @${username}:`, error);
      // Don't throw - this is intentionally silent
    });
}
