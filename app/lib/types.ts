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

// Feature Database Schema Type
export interface Feature {
  id: number;
  handle: string;
  name: string; // The question
  answer: string | null;
}

// Grouped Insight for UI Display
export interface GroupedInsight {
  question: string;
  answers: string[];
}

// Features API Response Type
export interface FeaturesApiResponse {
  success: boolean;
  data?: Feature[];
  error?: string;
}
