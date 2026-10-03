import type { StatusPost } from "./types";

type SortOption = "best" | "new" | "top" | "following";

interface FeedState {
  posts: StatusPost[];
  page: number;
  sort: SortOption;
  hasMore: boolean;
  topPostId: string | null;
  query: string;
}

const _state: FeedState = {
  posts: [],
  page: 1,
  sort: "best",
  hasMore: true,
  topPostId: null,
  query: "",
};

export const feedStateStore = {
  save: (partial: Partial<FeedState>) => Object.assign(_state, partial),
  get: (): FeedState => ({ ..._state }),
  saveTopPost: (id: string) => { _state.topPostId = id; },
  hasCache: (query: string) => _state.posts.length > 0 && _state.query === query,
  updatePost: (id: string, patch: Partial<StatusPost>) => {
    const idx = _state.posts.findIndex((p) => p.id === id);
    if (idx !== -1) _state.posts[idx] = { ..._state.posts[idx], ...patch };
  },
};
