"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  IoArrowBack,
  IoHeartOutline,
  IoHeart,
  IoChatbubbleOutline,
  IoShareOutline,
  IoBookmarkOutline,
  IoBookmark,
  IoSendOutline,
  IoPersonOutline,
  IoEyeOutline,
  IoArrowUndoOutline,
} from "react-icons/io5";
import { FaRetweet } from "react-icons/fa";
import { useAuth } from "@/lib/AuthContext";
import { useUi } from "@/lib/UiContext";
import { useJobSocket } from "@/lib/jobSocket";
import { apiGet, apiPost } from "@/lib/api";
import { useBookmark } from "@/lib/bookmarks";
import { postDetailStore } from "@/lib/postDetailStore";
import RankBadge from "@/components/RankBadge";
import LinkText from "@/components/LinkText";
import VideoPlayer from "@/components/VideoPlayer";
import type { StatusPost } from "@/lib/types";

interface Comment {
  id: string;
  statusId: string;
  userId: string;
  userName: string;
  userPhoto: string | null;
  content: string;
  parentCommentId: string | null;
  createdAt: string;
  agreeCount: number;
  disagreeCount: number;
  myReaction: "agree" | "disagree" | null;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function CommentItem({ comment, onReply }: { comment: Comment; onReply: (name: string, id: string) => void }) {
  return (
    <div className="flex gap-3 py-3">
      {comment.userPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={comment.userPhoto} alt={comment.userName} className="h-9 w-9 flex-shrink-0 rounded-full object-cover" />
      ) : (
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
          <IoPersonOutline size={18} className="text-primary" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-[13px] font-semibold text-text">{comment.userName}</span>
          <span className="text-[11px] text-light-text">{timeAgo(comment.createdAt)}</span>
        </div>
        <p className="mt-0.5 text-[13px] leading-[19px] text-text">{comment.content}</p>
        <div className="mt-1.5 flex items-center gap-4">
          <button
            onClick={() => onReply(comment.userName, comment.id)}
            className="flex items-center gap-1 text-[11px] text-light-text hover:text-primary"
          >
            <IoArrowUndoOutline size={12} />
            Reply
          </button>
          {comment.agreeCount > 0 && (
            <span className="text-[11px] text-light-text">{fmt(comment.agreeCount)} agree</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StatusDetailPage() {
  const { statusId } = useParams<{ statusId: string }>();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { notify } = useUi();
  const { socket } = useJobSocket();

  const [post, setPost] = useState<StatusPost | null>(() => postDetailStore.get(statusId));
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [replyText, setReplyText] = useState("");
  const [replyTo, setReplyTo] = useState<{ name: string; commentId: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingPost, setLoadingPost] = useState(!post);
  const { isBookmarked, toggle: toggleBookmark } = useBookmark(statusId);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Sync counts from post data
  useEffect(() => {
    if (post) {
      setLikeCount(post.likeCount ?? 0);
      setCommentCount(post.commentCount ?? 0);
      setIsLiked(post.isLiked ?? false);
    }
  }, [post]);

  // Fetch post if not in cache
  useEffect(() => {
    if (!isAuthenticated || !statusId) return;
    if (post) return;
    // Try preview to get ownerId, then fetch from public feed to get full stats
    apiGet<{ id: string; type: string; caption: string | null; thumbnailUrl: string | null; ownerId: string; ownerName: string; ownerPhoto: string | null }>(`/status/${statusId}/preview`)
      .then(async (preview) => {
        // Fetch full post with stats from public feed
        const feed = await apiGet<StatusPost[]>(`/status/public?authorId=${preview.ownerId}&page=1&limit=50`);
        const found = Array.isArray(feed) ? feed.find((p) => p.id === statusId) : null;
        if (found) {
          setPost(found);
          postDetailStore.set(found);
        } else {
          // Fallback: construct a partial post from preview
          setPost({
            id: preview.id,
            userId: preview.ownerId,
            userName: preview.ownerName,
            userPhoto: preview.ownerPhoto,
            type: preview.type as StatusPost["type"],
            content: "",
            caption: preview.caption,
            thumbnailUrl: preview.thumbnailUrl,
            duration: null,
            createdAt: new Date().toISOString(),
            expiresAt: new Date().toISOString(),
            likeCount: 0,
            commentCount: 0,
            viewCount: 0,
            isLiked: false,
            groupId: null,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoadingPost(false));
  }, [isAuthenticated, statusId, post]);

  // Fetch comments
  useEffect(() => {
    if (!statusId) return;
    apiGet<Comment[]>(`/status/${statusId}/comments`)
      .then((res) => { if (Array.isArray(res)) setComments(res); })
      .catch(() => {});
  }, [statusId]);

  // Socket: join room, wire live events
  useEffect(() => {
    if (!socket || !statusId) return;
    socket.emit("join_status_room", { statusId });

    const onLikeAck = (data: { statusId: string; liked: boolean; likeCount: number }) => {
      if (data.statusId !== statusId) return;
      setIsLiked(data.liked);
      setLikeCount(data.likeCount);
    };

    const onLikeUpdate = (data: { statusId: string; likeCount: number }) => {
      if (data.statusId !== statusId) return;
      setLikeCount(data.likeCount);
    };

    const onCommented = (data: {
      statusId: string;
      commentId: string;
      commenterId: string;
      commenterName: string;
      commenterPhoto: string | null;
      content: string;
      parentCommentId: string | null;
      commentCount: number;
    }) => {
      if (data.statusId !== statusId) return;
      setCommentCount(data.commentCount);
      setComments((prev) => {
        if (prev.some((c) => c.id === data.commentId)) return prev;
        return [
          ...prev,
          {
            id: data.commentId,
            statusId: data.statusId,
            userId: data.commenterId,
            userName: data.commenterName,
            userPhoto: data.commenterPhoto,
            content: data.content,
            parentCommentId: data.parentCommentId,
            createdAt: new Date().toISOString(),
            agreeCount: 0,
            disagreeCount: 0,
            myReaction: null,
          },
        ];
      });
    };

    socket.on("like_status_ack", onLikeAck);
    socket.on("status_like_update", onLikeUpdate);
    socket.on("status_commented", onCommented);

    return () => {
      socket.emit("leave_status_room", { statusId });
      socket.off("like_status_ack", onLikeAck);
      socket.off("status_like_update", onLikeUpdate);
      socket.off("status_commented", onCommented);
    };
  }, [socket, statusId]);

  const handleLike = useCallback(() => {
    if (!socket || !post) return;
    // Optimistic
    const nowLiked = !isLiked;
    setIsLiked(nowLiked);
    setLikeCount((c) => c + (nowLiked ? 1 : -1));
    socket.emit("like_status", { statusId, statusOwnerId: post.userId });
  }, [socket, post, isLiked, statusId]);

  const handleReply = useCallback(async () => {
    if (!replyText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = { content: replyText.trim() };
      if (replyTo) {
        body.parentCommentId = replyTo.commentId;
      }
      const newComment = await apiPost<Comment>(`/status/${statusId}/comments`, body);
      if (newComment) {
        setComments((prev) => [...prev, newComment]);
        setCommentCount((c) => c + 1);
      }
      setReplyText("");
      setReplyTo(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      notify(msg || "Couldn't post your reply");
    } finally {
      setSubmitting(false);
    }
  }, [replyText, submitting, replyTo, statusId, notify]);

  const startReply = useCallback((name: string, commentId: string) => {
    setReplyTo({ name, commentId });
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  if (!isAuthenticated) return null;
  if (loadingPost && !post) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }
  if (!post) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-light-text">Post not found or has expired.</p>
      </div>
    );
  }

  const isVideo = post.type === "video";
  const isImage = post.type === "image";
  const isText = post.type === "text";

  return (
    <div className="mx-auto max-w-2xl pb-20">

      {/* ── Back bar ── */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-white/90 px-4 py-3 backdrop-blur">
        <button
          onClick={() => router.back()}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-feed-bg"
        >
          <IoArrowBack size={20} className="text-text" />
        </button>
        <span className="text-[15px] font-bold text-text">Post</span>
      </div>

      <div className="px-4 pt-4">
        {/* ── Post author header ── */}
        <div className="flex items-start gap-3">
          <button
            onClick={() => router.push(`/profile/${post.userId}`)}
            className="flex-shrink-0"
          >
            {post.userPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.userPhoto} alt={post.userName} className="h-11 w-11 rounded-full object-cover" />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
                <IoPersonOutline size={22} className="text-primary" />
              </div>
            )}
          </button>
          <div className="min-w-0 flex-1">
            <button
              onClick={() => router.push(`/profile/${post.userId}`)}
              className="text-left"
            >
              <p className="text-[15px] font-bold text-text leading-tight">{post.userName}</p>
              {post.userOccupation && (
                <p className="text-[12px] text-light-text">{post.userOccupation}</p>
              )}
            </button>
            <RankBadge
              activityScore={post.userGlobalActivityScore ?? 0}
              rankVisible={post.userRankVisible !== false}
              plain
              className="mt-0.5"
            />
          </div>
        </div>

        {/* ── Post content ── */}
        <div className="mt-3">
          {isText && (
            <div className="text-[16px] leading-[24px] text-text">
              <LinkText text={post.content || post.caption || ""} />
            </div>
          )}
          {(isImage || isVideo) && post.caption && (
            <p className="mb-3 text-[16px] leading-[24px] text-text">
              <LinkText text={post.caption} />
            </p>
          )}
          {isImage && (post.content || post.thumbnailUrl) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.content || post.thumbnailUrl!}
              alt={post.caption ?? ""}
              className="w-full rounded-2xl object-cover"
              style={{ maxHeight: 500 }}
            />
          )}
          {isVideo && post.content && (
            <div className="overflow-hidden rounded-2xl">
              <VideoPlayer src={post.content} poster={post.thumbnailUrl ?? undefined} />
            </div>
          )}
        </div>

        {/* ── Timestamp · Views ── */}
        <div className="mt-4 flex items-center gap-3 border-b border-border pb-3 text-[13px] text-light-text">
          <span>{formatDate(post.createdAt)}</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <IoEyeOutline size={14} />
            {fmt(post.viewCount)} views
          </span>
        </div>

        {/* ── Count row ── */}
        <div className="flex items-center gap-5 border-b border-border py-3 text-[13px]">
          <span>
            <strong className="text-text">{fmt(commentCount)}</strong>{" "}
            <span className="text-light-text">Comments</span>
          </span>
          <span>
            <strong className="text-text">0</strong>{" "}
            <span className="text-light-text">Reposts</span>
          </span>
          <span>
            <strong className="text-text">{fmt(likeCount)}</strong>{" "}
            <span className="text-light-text">Likes</span>
          </span>
          <span>
            <strong className="text-text">0</strong>{" "}
            <span className="text-light-text">Bookmarks</span>
          </span>
        </div>

        {/* ── Action row ── */}
        <div className="flex items-center justify-around border-b border-border py-1">
          <ActionBtn
            icon={isLiked ? <IoHeart size={22} className="text-red-500" /> : <IoHeartOutline size={22} className="text-light-text" />}
            label={isLiked ? "Liked" : "Like"}
            active={isLiked}
            onClick={handleLike}
          />
          <ActionBtn
            icon={<IoChatbubbleOutline size={22} className="text-light-text" />}
            label="Comment"
            onClick={() => inputRef.current?.focus()}
          />
          <ActionBtn
            icon={<FaRetweet size={20} className="text-light-text" />}
            label="Repost"
            onClick={() => notify("Repost is coming soon")}
          />
          <ActionBtn
            icon={isBookmarked ? <IoBookmark size={22} className="text-primary" /> : <IoBookmarkOutline size={22} className="text-light-text" />}
            label={isBookmarked ? "Saved" : "Save"}
            active={isBookmarked}
            onClick={toggleBookmark}
          />
          <ActionBtn
            icon={<IoShareOutline size={22} className="text-light-text" />}
            label="Share"
            onClick={() => notify("Share is coming soon")}
          />
        </div>

        {/* ── Reply composer ── */}
        <div className="flex gap-3 py-3">
          {user?.profile_photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.profile_photo_url} alt={user.name ?? ""} className="h-9 w-9 flex-shrink-0 rounded-full object-cover" />
          ) : (
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
              <IoPersonOutline size={18} className="text-primary" />
            </div>
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            {replyTo && (
              <div className="flex items-center gap-1 text-[12px] text-primary">
                <IoArrowUndoOutline size={12} />
                <span>Replying to <strong>@{replyTo.name}</strong></span>
                <button
                  onClick={() => setReplyTo(null)}
                  className="ml-auto text-light-text hover:text-text"
                >
                  ✕
                </button>
              </div>
            )}
            <textarea
              ref={inputRef}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
              placeholder="Post your reply"
              rows={1}
              className="w-full resize-none bg-transparent text-[14px] text-text placeholder-light-text outline-none"
              style={{ minHeight: 36 }}
            />
          </div>
          <button
            onClick={handleReply}
            disabled={!replyText.trim() || submitting}
            className="flex h-8 items-center gap-1 self-end rounded-full bg-primary px-4 text-[13px] font-bold text-white disabled:opacity-40"
          >
            <IoSendOutline size={14} />
            Reply
          </button>
        </div>

        {/* ── Comments ── */}
        {comments.length > 0 && (
          <div className="divide-y divide-border/40">
            {comments.filter((c) => !c.parentCommentId).map((comment) => (
              <div key={comment.id}>
                <CommentItem comment={comment} onReply={startReply} />
                {/* Replies */}
                {comments.filter((r) => r.parentCommentId === comment.id).map((reply) => (
                  <div key={reply.id} className="pl-12">
                    <CommentItem comment={reply} onReply={startReply} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {comments.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <IoChatbubbleOutline size={32} className="text-light-text" />
            <p className="text-[14px] text-light-text">No replies yet. Be the first!</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionBtn({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-3 py-2 text-[11px] font-medium transition-colors ${
        active ? "text-primary" : "text-light-text hover:text-text"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
