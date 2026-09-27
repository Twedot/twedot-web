import type { StatusPost } from "./types";

type SortOption = "best" | "new" | "top";

interface FeedState {
  posts: StatusPost[];
  page: number;
  sort: SortOption;
  hasMore: boolean;
  scrollY: number;
  query: string;
}

const _state: FeedState = {
  posts: [],
  page: 1,
  sort: "best",
  hasMore: true,
  scrollY: 0,
  query: "",
};

export const feedStateStore = {
  save: (partial: Partial<FeedState>) => Object.assign(_state, partial),
  get: (): FeedState => ({ ..._state }),
  saveScroll: () => { _state.scrollY = window.scrollY; },
  hasCache: (query: string) => _state.posts.length > 0 && _state.query === query,
};
