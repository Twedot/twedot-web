"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  IoArrowBack,
  IoHeartOutline,
  IoHeart,
  IoChatbubbleEllipsesOutline,
  IoShareOutline,
  IoBookmarkOutline,
  IoBookmark,
  IoPersonOutline,
  IoEyeOutline,
  IoArrowUndoOutline,
  IoThumbsUpOutline,
  IoThumbsUp,
  IoThumbsDownOutline,
  IoThumbsDown,
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
  userOccupation?: string | null;
  userGlobalActivityScore?: number;
  userRankVisible?: boolean;
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
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
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

function autoGrow(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

// ── Comment item ──
function CommentItem({
  comment,
  statusId,
  socket,
  onReply,
  onReactionUpdate,
}: {
  comment: Comment;
  statusId: string;
  socket: ReturnType<typeof useJobSocket>["socket"];
  onReply: (name: string, id: string) => void;
  onReactionUpdate: (commentId: string, agreeCount: number, disagreeCount: number, myReaction: "agree" | "disagree" | null) => void;
}) {
  function react(type: "agree" | "disagree") {
    if (!socket) return;
    let nextReaction: "agree" | "disagree" | null;
    let agreeDelta = 0;
    let disagreeDelta = 0;

    if (comment.myReaction === type) {
      nextReaction = null;
      if (type === "agree") agreeDelta = -1;
      else disagreeDelta = -1;
    } else {
      if (comment.myReaction === "agree") agreeDelta = -1;
      if (comment.myReaction === "disagree") disagreeDelta = -1;
      nextReaction = type;
      if (type === "agree") agreeDelta += 1;
      else disagreeDelta += 1;
    }

    onReactionUpdate(
      comment.id,
      comment.agreeCount + agreeDelta,
      comment.disagreeCount + disagreeDelta,
      nextReaction,
    );
    socket.emit("react_comment", { statusId, commentId: comment.id, type });
  }

  return (
    <div className="flex gap-2.5 py-3">
      {comment.userPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={comment.userPhoto} alt={comment.userName} className="h-8 w-8 flex-shrink-0 rounded-full object-cover" />
      ) : (
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-zinc-200">
          <IoPersonOutline size={16} className="text-zinc-500" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0">
          <span className="text-[13px] font-semibold text-text">{comment.userName}</span>
          {comment.userOccupation && (
            <span className="text-[11px] text-light-text">{comment.userOccupation}</span>
          )}
          <span className="text-[11px] text-light-text">{timeAgo(comment.createdAt)}</span>
        </div>
        <RankBadge
          activityScore={comment.userGlobalActivityScore ?? 0}
          rankVisible={comment.userRankVisible !== false}
          plain
          className="mb-0.5"
        />
        <p className="mt-0.5 text-[13px] leading-[19px] text-text">{comment.content}</p>
        <div className="mt-2 flex items-center gap-3">
          {/* Agree — green */}
          <button
            onClick={() => react("agree")}
            className={`flex items-center gap-1 text-[11px] font-medium transition-colors ${
              comment.myReaction === "agree" ? "text-green-500" : "text-light-text hover:text-text"
            }`}
          >
            {comment.myReaction === "agree" ? <IoThumbsUp size={13} /> : <IoThumbsUpOutline size={13} />}
            {comment.agreeCount > 0 && <span>{fmt(comment.agreeCount)}</span>}
          </button>
          {/* Disagree — red */}
          <button
            onClick={() => react("disagree")}
            className={`flex items-center gap-1 text-[11px] font-medium transition-colors ${
              comment.myReaction === "disagree" ? "text-red-500" : "text-light-text hover:text-text"
            }`}
          >
            {comment.myReaction === "disagree" ? <IoThumbsDown size={13} /> : <IoThumbsDownOutline size={13} />}
            {comment.disagreeCount > 0 && <span>{fmt(comment.disagreeCount)}</span>}
          </button>
          {/* Reply */}
          <button
            onClick={() => onReply(comment.userName, comment.id)}
            className="flex items-center gap-1 text-[11px] font-medium text-light-text hover:text-text"
          >
            <IoArrowUndoOutline size={12} />
            Reply
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──
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
  // Thread view: when set, shows single comment + its replies
  const [threadCommentId, setThreadCommentId] = useState<string | null>(null);
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
    apiGet<{ id: string; type: string; caption: string | null; thumbnailUrl: string | null; ownerId: string; ownerName: string; ownerPhoto: string | null }>(
      `/status/${statusId}/preview`
    )
      .then(async (preview) => {
        const feed = await apiGet<StatusPost[]>(`/status/public?authorId=${preview.ownerId}&page=1&limit=50`);
        const found = Array.isArray(feed) ? feed.find((p) => p.id === statusId) : null;
        if (found) {
          setPost(found);
          postDetailStore.set(found);
        } else {
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

  // Socket: join room, live events
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

    const onCommentReacted = (data: { commentId: string; agreeCount: number; disagreeCount: number }) => {
      setComments((prev) =>
        prev.map((c) =>
          c.id === data.commentId
            ? { ...c, agreeCount: data.agreeCount, disagreeCount: data.disagreeCount }
            : c
        )
      );
    };

    const onReactAck = (data: {
      commentId: string;
      agreeCount: number;
      disagreeCount: number;
      myReaction: "agree" | "disagree" | null;
    }) => {
      setComments((prev) =>
        prev.map((c) =>
          c.id === data.commentId
            ? { ...c, agreeCount: data.agreeCount, disagreeCount: data.disagreeCount, myReaction: data.myReaction }
            : c
        )
      );
    };

    socket.on("like_status_ack", onLikeAck);
    socket.on("status_like_update", onLikeUpdate);
    socket.on("status_commented", onCommented);
    socket.on("comment_reacted", onCommentReacted);
    socket.on("react_comment_ack", onReactAck);

    return () => {
      socket.emit("leave_status_room", { statusId });
      socket.off("like_status_ack", onLikeAck);
      socket.off("status_like_update", onLikeUpdate);
      socket.off("status_commented", onCommented);
      socket.off("comment_reacted", onCommentReacted);
      socket.off("react_comment_ack", onReactAck);
    };
  }, [socket, statusId]);

  const handleLike = useCallback(() => {
    if (!socket || !post) return;
    const nowLiked = !isLiked;
    setIsLiked(nowLiked);
    setLikeCount((c) => c + (nowLiked ? 1 : -1));
    socket.emit("like_status", { statusId, statusOwnerId: post.userId });
  }, [socket, post, isLiked, statusId]);

  const handleCommentReaction = useCallback(
    (commentId: string, agreeCount: number, disagreeCount: number, myReaction: "agree" | "disagree" | null) => {
      setComments((prev) =>
        prev.map((c) => c.id === commentId ? { ...c, agreeCount, disagreeCount, myReaction } : c)
      );
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    if (!replyText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = { content: replyText.trim() };
      // When in thread view, replies go under that comment; otherwise top-level
      const parentId = replyTo?.commentId ?? (threadCommentId ?? undefined);
      if (parentId) body.parentCommentId = parentId;
      const newComment = await apiPost<Comment>(`/status/${statusId}/comments`, body);
      if (newComment) {
        setComments((prev) => [...prev, newComment]);
        setCommentCount((c) => c + 1);
      }
      setReplyText("");
      setReplyTo(null);
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : "Couldn't post your reply");
    } finally {
      setSubmitting(false);
    }
  }, [replyText, submitting, replyTo, threadCommentId, statusId, notify]);

  const startReply = useCallback((name: string, commentId: string) => {
    // Open thread for the root comment when replying
    setThreadCommentId(commentId);
    setReplyTo({ name, commentId });
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  if (!isAuthenticated) return null;
  if (loadingPost && !post) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
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

  // In thread view: the root comment + all its replies (flat)
  const threadComment = threadCommentId ? comments.find((c) => c.id === threadCommentId) ?? null : null;
  const threadReplies = threadCommentId ? comments.filter((c) => c.parentCommentId === threadCommentId) : [];
  // In main view: only top-level comments
  const topLevelComments = comments.filter((c) => !c.parentCommentId);

  return (
    <div className="mx-auto max-w-2xl pb-20">

      {/* ── Back bar ── */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-white/90 px-4 py-3 backdrop-blur">
        <button
          onClick={() => {
            if (threadCommentId) {
              setThreadCommentId(null);
              setReplyTo(null);
            } else {
              router.back();
            }
          }}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-feed-bg"
        >
          <IoArrowBack size={20} className="text-text" />
        </button>
        <span className="text-[15px] font-bold text-text">
          {threadCommentId ? "Replies" : "Post"}
        </span>
      </div>

      <div className="px-4 pt-4">

        {/* ── Thread view ── */}
        {threadComment ? (
          <>
            {/* Root comment shown at top of thread */}
            <div className="mb-1 rounded-2xl bg-feed-bg px-3">
              <CommentItem
                comment={threadComment}
                statusId={statusId}
                socket={socket}
                onReply={() => {
                  setReplyTo({ name: threadComment.userName, commentId: threadComment.id });
                  setTimeout(() => inputRef.current?.focus(), 50);
                }}
                onReactionUpdate={handleCommentReaction}
              />
            </div>

            {/* Replies (flat) */}
            {threadReplies.length > 0 ? (
              <div className="divide-y divide-border/40">
                {threadReplies.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    statusId={statusId}
                    socket={socket}
                    onReply={(name) => {
                      setReplyTo({ name, commentId: threadComment.id });
                      setTimeout(() => inputRef.current?.focus(), 50);
                    }}
                    onReactionUpdate={handleCommentReaction}
                  />
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-[13px] text-light-text">No replies yet.</p>
            )}
          </>
        ) : (
          <>
            {/* ── Author header ── */}
            <div className="flex items-start gap-3">
              <button onClick={() => router.push(`/profile/${post.userId}`)} className="flex-shrink-0">
                {post.userPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.userPhoto} alt={post.userName} className="h-11 w-11 rounded-full object-cover" />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-200">
                    <IoPersonOutline size={22} className="text-zinc-500" />
                  </div>
                )}
              </button>
              <div className="min-w-0 flex-1">
                <button onClick={() => router.push(`/profile/${post.userId}`)} className="text-left">
                  <p className="text-[15px] font-bold leading-tight text-text">{post.userName}</p>
                  {post.userOccupation && (
                    <p className="text-[12px] text-light-text">{post.userOccupation}</p>
                  )}
                </button>
                <RankBadge activityScore={post.userGlobalActivityScore ?? 0} rankVisible={post.userRankVisible !== false} plain className="mt-0.5" />
              </div>
            </div>

            {/* ── Post content ── */}
            <div className="mt-3">
              {isText && (
                <p className="text-[16px] leading-[24px] text-text">
                  <LinkText text={post.content || post.caption || ""} />
                </p>
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

            {/* ── PostCard-style action row ── */}
            <footer className="mt-3 flex items-center gap-2 border-b border-border pb-2.5 pt-1">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1.5 rounded-full bg-feed-bg px-3 py-1.5 text-sm font-bold hover:bg-border/50 transition-colors ${
                  isLiked ? "text-red-500" : "text-text"
                }`}
              >
                {isLiked ? <IoHeart size={18} /> : <IoHeartOutline size={18} />}
                {likeCount}
              </button>

              <button
                onClick={() => inputRef.current?.focus()}
                className="flex items-center gap-1.5 rounded-full bg-feed-bg px-3 py-1.5 text-sm font-bold text-text hover:bg-border/50"
              >
                <IoChatbubbleEllipsesOutline size={18} />
                {commentCount}
              </button>

              <button
                onClick={toggleBookmark}
                className={`flex items-center justify-center rounded-full bg-feed-bg p-1.5 hover:bg-border/50 ${
                  isBookmarked ? "text-[#D4A400]" : "text-text"
                }`}
              >
                {isBookmarked ? <IoBookmark size={18} /> : <IoBookmarkOutline size={18} />}
              </button>

              <button
                onClick={() => notify("Repost is coming soon")}
                className="flex items-center justify-center rounded-full bg-feed-bg p-1.5 text-text hover:bg-border/50"
              >
                <FaRetweet size={17} />
              </button>

              <button
                onClick={() => notify("Share is coming soon")}
                className="flex items-center gap-1.5 rounded-full bg-feed-bg px-3 py-1.5 text-sm font-bold text-text hover:bg-border/50"
              >
                <IoShareOutline size={18} />
                Share
              </button>
            </footer>

            {/* ── Date · Views ── */}
            <div className="flex items-center gap-2 py-2.5 text-[12px] text-light-text">
              <span>{formatDate(post.createdAt)}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <IoEyeOutline size={13} />
                {fmt(post.viewCount)} views
              </span>
            </div>

            {/* ── Top-level comments (flat, no nesting) ── */}
            {topLevelComments.length > 0 ? (
              <div className="divide-y divide-border/40">
                {topLevelComments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    statusId={statusId}
                    socket={socket}
                    onReply={(name, id) => startReply(name, id)}
                    onReactionUpdate={handleCommentReaction}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <IoChatbubbleEllipsesOutline size={30} className="text-light-text" />
                <p className="text-[13px] text-light-text">No comments yet. Be the first!</p>
              </div>
            )}
          </>
        )}

        {/* ── Reply composer — always at bottom ── */}
        <div className="mt-4 flex items-start gap-2.5 border-t border-border pt-3">
          {user?.profile_photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.profile_photo_url} alt={user.name ?? ""} className="h-8 w-8 flex-shrink-0 rounded-full object-cover" />
          ) : (
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-zinc-200">
              <IoPersonOutline size={16} className="text-zinc-500" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            {replyTo && (
              <div className="mb-1 flex items-center gap-1 text-[11px] text-light-text">
                <IoArrowUndoOutline size={11} />
                <span>Replying to <strong className="text-text">@{replyTo.name}</strong></span>
                <button onClick={() => setReplyTo(null)} className="ml-auto text-light-text hover:text-text">✕</button>
              </div>
            )}
            <textarea
              ref={inputRef}
              value={replyText}
              onChange={(e) => {
                setReplyText(e.target.value);
                autoGrow(e.target);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Write a comment…"
              rows={1}
              className="w-full resize-none overflow-hidden bg-transparent text-[13px] text-text placeholder-light-text outline-none"
              style={{ minHeight: 28 }}
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={!replyText.trim() || submitting}
            className="flex h-7 flex-shrink-0 items-center self-end rounded-full bg-zinc-800 px-3.5 text-[12px] font-bold text-white disabled:opacity-40"
          >
            {submitting ? "…" : "Reply"}
          </button>
        </div>

      </div>
    </div>
  );
}
