export interface UserProfile {
  id: string;
  phone_number: string;
  country_code: string;
  name: string | null;
  occupation: string | null;
  profile_photo_url: string | null;
  is_verified: boolean;
  is_official: boolean;
  bio: string | null;
  city: string | null;
  country: string | null;
  website: string | null;
  connections_count?: number;
  completed_jobs?: number;
  average_rating?: number;
  rating_count?: number;
  global_activity_score?: number;
  rank_visible?: boolean;
  [key: string]: unknown;
}

export interface VerifyOtpResult {
  user: UserProfile;
  token: string;
  expires: string;
  profileComplete: boolean;
}

export type StatusType = "text" | "image" | "video";

export interface TrendingHashtag {
  tag: string;
  count: number;
}

export interface StatusPost {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string | null;
  type: StatusType;
  content: string;
  caption: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  createdAt: string;
  expiresAt: string;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  isLiked: boolean;
  groupId: string | null;
  // Already returned by the backend for every status item (twedot-backend's
  // status.service.ts includes global_activity_score/rank_visible on the joined
  // user for every status query) — just not mapped on the web's type until now.
  userGlobalActivityScore?: number;
  userRankVisible?: boolean;
  // Added to the backend response alongside this (status.service.ts's formatStatus) —
  // not live until that change is deployed, so this will read undefined until then.
  userOccupation?: string | null;
}
