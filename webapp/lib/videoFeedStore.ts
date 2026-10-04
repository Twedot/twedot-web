import type { StatusPost } from "./types";

class VideoFeedStore {
  videos: StatusPost[] = [];
  currentIndex = -1;
  private _fns: (() => void)[] = [];

  get isOpen() { return this.currentIndex >= 0; }

  setFeedVideos(posts: StatusPost[]) {
    this.videos = posts.filter(p => p.type === "video");
  }

  open(videoId: string) {
    const idx = this.videos.findIndex(v => v.id === videoId);
    if (idx >= 0) { this.currentIndex = idx; this._emit(); }
  }

  close() { this.currentIndex = -1; this._emit(); }

  subscribe(fn: () => void) {
    this._fns.push(fn);
    return () => { this._fns = this._fns.filter(f => f !== fn); };
  }

  private _emit() { this._fns.forEach(f => f()); }
}

export const videoFeedStore = new VideoFeedStore();
