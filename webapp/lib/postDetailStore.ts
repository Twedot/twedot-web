import type { StatusPost } from "./types";

const _cache = new Map<string, StatusPost>();
const _groupCache = new Map<string, StatusPost[]>(); // groupId → ordered items

export const postDetailStore = {
  set: (post: StatusPost) => _cache.set(post.id, post),
  get: (id: string) => _cache.get(id) ?? null,
  setGroup: (items: StatusPost[]) => {
    const gid = items[0]?.groupId;
    if (gid) _groupCache.set(gid, items);
    items.forEach((p) => _cache.set(p.id, p));
  },
  getGroup: (groupId: string | null | undefined) =>
    groupId ? (_groupCache.get(groupId) ?? null) : null,
};
