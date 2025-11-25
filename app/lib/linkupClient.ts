import { LinkupClient } from 'linkup-sdk';

/**
 * Custom error class for Linkup API errors
 */
export class LinkupError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'LinkupError';
  }
}

/**
 * Initialize Linkup client with API key from environment
 */
const getLinkupClient = () => {
  const apiKey = process.env.LINKUP_API_KEY;

  if (!apiKey) {
    throw new LinkupError('LINKUP_API_KEY environment variable is not set');
  }

  return new LinkupClient({ apiKey });
};

/**
 * Structured output schema for person research
 * Based on the OSINT investigation prompt template
 */
const personResearchSchema = {
  type: 'object',
  properties: {
    biography: {
      description: 'A polished 200-300 word third-person professional biography summarizing verified information',
      type: 'string'
    },
    profile: {
      type: 'object',
      properties: {
        beliefs: {
          description: 'Inferred dominant beliefs or values the person holds (1 sentence, evidence-based)',
          type: 'string'
        },
        expertise: {
          description: 'Main areas where the person demonstrates skill or knowledge (1 sentence)',
          type: 'string'
        },
        voting_preferences: {
          description: 'Left/center/right leaning, based on patterns; note confidence level (1 sentence)',
          type: 'string'
        },
        relationship_with_risk: {
          description: 'Risk-taking, risk-averse, calculated, impulsive, etc. (1 sentence)',
          type: 'string'
        },
        unspoken_worldview: {
          description: 'Underlying assumption about how the world works (1 sentence)',
          type: 'string'
        },
        projected_socioeconomic_class: {
          description: 'Likely class positioning—working, lower-middle, upper-middle, affluent, etc. (1 sentence)',
          type: 'string'
        }
      }
    },
    confidence: {
      description: 'A percentage indicating how confident the model is in the accuracy and match of all findings',
      type: 'string'
    },
    sources: {
      description: 'List all URLs used in constructing the profile. No private or restricted sources. Only public OSINT.',
      type: 'array',
      items: {
        type: 'string'
      }
    }
  }
};

/**
 * Build comprehensive research query from the OSINT prompt template
 */
const buildResearchQuery = (username: string, name?: string, profileUrl?: string): string => {
  const nameInfo = name ? `Displayed name: ${name}` : 'Displayed name: Not provided';
  const urlInfo = profileUrl || `https://x.com/${username}`;

  return `You are an expert OSINT investigator, social-graph analyst, and professional researcher.
Your task is to build a deep, accurate, multi-angle profile of a person starting from their X (Twitter) account.

🎯 Goal
Using all publicly available online information, construct a comprehensive, objective profile of the person behind the specified X account.

🧭 Scope
Start with the following inputs:
• X (Twitter) handle: ${username}
• ${nameInfo}
• Profile URL: ${urlInfo}

The service should then:
1. Analyze the X profile in-depth.
2. Attempt name enrichment (guess name from handle, pinned posts, bio, linked URLs, self-mentions, etc.).
3. Follow and analyze all external URLs, such as:
   • LinkedIn
   • Personal websites
   • Company sites
   • Substack, Medium
   • GitHub
   • YouTube or podcast appearances
4. Cross-reference the enriched identity across search engines.
5. Build the most complete professional + psychological profile possible from public data.

🔎 Method: Perform a full-spectrum investigation

The agent must investigate the following categories:

1. Professional & Educational Background
   • Current role and employer
   • Career progression
   • Past roles and companies
   • Industry expertise
   • Notable projects
   • Achievements, awards, publications
   • Education, degrees, certifications
   • Skills demonstrated through posts, resumes, GitHub, articles, etc.

2. Social Media Analysis (X + others)
   • Tone, topics, frequency
   • Interests and obsessions
   • Political or ideological cues
   • Interaction patterns: who they follow, who follows them
   • Professional vs personal content ratio
   • Notable tweet themes

3. Personal Metadata (from open sources only)
   • Location clues
   • Personal website "About Me" pages
   • Interviews
   • Publicly shared beliefs or values
   • Affiliations, communities, clubs, online groups
   • Public philanthropic interests

4. Identity Verification Confidence
   • How certain the agent is that the data belongs to the same person
   • Ambiguities or conflicting matches
   • Alternate individuals with the same name

📦 Output Format (strict)

Return a JSON-like structured block containing:

1. biography
A polished 200–300 word third-person professional biography summarizing verified information.

2. profile
A structured psychological/sociological profile with one-sentence definitions for each field:
• beliefs: (Inferred dominant beliefs or values the person holds)
• expertise: (Main areas where the person demonstrates skill or knowledge)
• voting_preferences: (Left/center/right leaning, based on patterns; note confidence level)
• relationship_with_risk: (Risk-taking, risk-averse, calculated, impulsive, etc.)
• unspoken_worldview: (Underlying assumption about how the world works)
• projected_socioeconomic_class: (Likely class positioning—working, lower-middle, upper-middle, affluent, etc.)

Each definition must be 1 sentence, evidence-based, and not speculative beyond reasonable inference from public data.

3. confidence
A percentage indicating how confident the model is in the accuracy and match of all findings.

4. sources
List all URLs used in constructing the profile.
No private or restricted sources.
Only public OSINT.`;
};

/**
 * Research a person using Linkup's deep search capabilities
 *
 * @param username - X/Twitter username
 * @param name - Optional displayed name
 * @param profileUrl - Optional profile URL
 * @returns Research results with biography, profile, confidence, and sources
 */
export async function researchPerson(
  username: string,
  name?: string,
  profileUrl?: string
) {
  try {
    const client = getLinkupClient();
    const query = buildResearchQuery(username, name, profileUrl);

    console.log(`[Linkup] Starting deep research for @${username}`);

    const response = await client.search({
      query,
      depth: 'deep',
      outputType: 'structured',
      structuredOutputSchema: personResearchSchema,
      includeImages: false,
      includeSources: true
    });

    console.log(`[Linkup] Research completed for @${username}`);

    return response;
  } catch (error) {
    console.error(`[Linkup] Error researching @${username}:`, error);

    if (error instanceof Error) {
      throw new LinkupError(
        `Failed to research person: ${error.message}`,
        undefined,
        error
      );
    }

    throw new LinkupError('Failed to research person: Unknown error', undefined, error);
  }
}
