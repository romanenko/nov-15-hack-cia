// X API Response Type (based on Twitter API via RapidAPI)
export interface XApiResponse {
  status: string;
  profile: string;
  rest_id: string;
  blue_verified: boolean;
  verification_type: string | null;
  affiliates: unknown[];
  business_account: unknown[];
  avatar: string;
  header_image: string;
  desc: string;
  name: string;
  website: string;
  protected: boolean | null;
  location: string;
  friends: number;
  sub_count: number;
  statuses_count: number;
  media_count: number;
  pinned_tweet_ids_str: string[];
  created_at: string; // Format: "Tue Aug 30 05:35:51 +0000 2016"
  id: string;
}

// Database Schema Type
export interface UserProfile {
  handle: string;
  avatar: string | null;
  header_image: string | null;
  desc: string | null;
  name: string | null;
  website: string | null;
  location: string | null;
  friends_count: number;
  sub_count: number;
  statuses_count: number;
  created_at: Date;
  updated_at?: Date;
}

// API Response Type (what we send to frontend)
export interface ProfileApiResponse {
  success: boolean;
  data?: UserProfile;
  error?: string;
  cached?: boolean; // Indicates if data came from DB or fresh fetch
}

// Feature Database Schema Type (with question join data)
export interface Feature {
  id: number;
  handle: string;
  question_slug: string;
  question_text: string;  // from questions table join
  answer: string | null;
  research_run_id: number;
  display_order: number;  // from questions table join
  created_at: Date;       // when this feature was discovered
}

// Features API Response Type
export interface FeaturesApiResponse {
  success: boolean;
  data?: Feature[];
  error?: string;
}

// Linkup Research Types
export interface ResearchProfile {
  beliefs: string;
  expertise: string;
  voting_preferences: string;
  relationship_with_risk: string;
  unspoken_worldview: string;
  projected_socioeconomic_class: string;
}

export interface LinkupResearchResponse {
  biography: string;
  profile: ResearchProfile;
  confidence: string;
  sources: string[];
}

export interface ResearchApiResponse {
  success: boolean;
  data?: LinkupResearchResponse;
  error?: string;
}
