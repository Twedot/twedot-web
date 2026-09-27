import type { StatusPost } from "./types";

// Module-level cache — persists across Next.js client-side navigation so the profile
// page can hand the full post object to the detail page without a re-fetch or URL bloat.
const _cache = new Map<string, StatusPost>();

export const postDetailStore = {
  set: (post: StatusPost) => _cache.set(post.id, post),
  get: (id: string) => _cache.get(id) ?? null,
};
