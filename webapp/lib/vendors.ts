export interface NearbyVendor {
  id: string;
  name: string;
  occupation: string;
  profile_photo_url: string | null;
  has_location: boolean;
  distance_km: number;
  completed_jobs?: number;
  average_rating?: number | null;
  global_activity_score?: number;
  rank_visible?: boolean;
  is_following?: boolean;
}

export interface VendorSearchResponse {
  nearby: NearbyVendor[];
  wider: NearbyVendor[];
}
