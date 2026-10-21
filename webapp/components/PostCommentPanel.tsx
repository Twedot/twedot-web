"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IoClose,
  IoPersonOutline,
  IoThumbsUpOutline,
  IoThumbsUp,
  IoThumbsDownOutline,
  IoThumbsDown,
  IoHeartOutline,
  IoHeart,
  IoArrowForward,
  IoChevronBack,
} from "react-icons/io5";
import { useAuth } from "@/lib/AuthContext";
import { useUi } from "@/lib/UiContext";
import { useJobSocket } from "@/lib/jobSocket";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import { feedStateStore } from "@/lib/feedStateStore";
import { profileUrl, postUrl } from "@/lib/url";
import RankBadge from "./RankBadge";
import type { StatusPost } from "@/lib/types";

interface Comment {
  id: string;
  statusId: string;
  userId: string;
  userName: string;
  userPhoto: string | null;
  userGlobalActivityScore?: number;
  userRankVisible?: boolean;
  content: string;
  parentCommentId: string | null;
  createdAt: string;
  agreeCount: number;
  disagreeCount: number;
  myReaction: "agree" | "disagree" | null;
}

function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (d < 1) return "just now";
  if (d < 60) return `${d}m`;
  const h = Math.floor(d / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function autoGrow(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 120) + "px";
}

export default function PostCommentPanel() {
  const { postPanelId, closePostPanel } = useUi();
  const { user, isAuthenticated } = useAuth();
  const { socket } = useJobSocket();
  const router = useRouter();

  const [post, setPost] = useState<StatusPost | null>(null);
  const [statusId, setStatusId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyTo, setReplyTo] = useState<{ name: string; commentId: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [threadCommentId, setThreadCommentId] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const prevPanelId = useRef<string | null>(null);

  // Reset and fetch whenever the panel opens for a new post
  useEffect(() => {
    if (!postPanelId || !isAuthenticated) return;
    if (postPanelId === prevPanelId.current) return;
    prevPanelId.current = postPanelId;

    setPost(null);
    setStatusId("");
    setComments([]);
    setReplyText("");
    setReplyTo(null);
    setThreadCommentId(null);
    setLoading(true);

    apiGet<{ id: string; type: string; caption: string | null; thumbnailUrl: string | null; ownerId: string; ownerName: string; ownerPhoto: string | null }>(
      `/status/by-short/${postPanelId}`
    )
      .then(async (preview) => {
        setStatusId(preview.id);
        const feed = await apiGet<StatusPost[]>(`/status/public?authorId=${preview.ownerId}`).catch(() => [] as StatusPost[]);
        const found = Array.isArray(feed) ? feed.find((p) => p.id === preview.id) : null;
        const p = found ?? {
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
        };
        setPost(p);
        setLikeCount(p.likeCount ?? 0);
        setCommentCount(p.commentCount ?? 0);
        setIsLiked(p.isLiked ?? false);

        const c = await apiGet<Comment[]>(`/status/${preview.id}/comments`).catch(() => [] as Comment[]);
        if (Array.isArray(c)) setComments(c);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postPanelId, isAuthenticated]);

  // Socket: real-time comments and likes
  useEffect(() => {
    if (!socket || !statusId) return;
    socket.emit("join_status_room", { statusId });

    const onLikeAck = (data: { statusId: string; liked: boolean; likeCount: number }) => {
      if (data.statusId !== statusId) return;
      setIsLiked(data.liked);
      setLikeCount(data.likeCount);
      feedStateStore.updatePost(data.statusId, { likeCount: data.likeCount, isLiked: data.liked });
    };

    const onLikeUpdate = (data: { statusId: string; likeCount: number }) => {
      if (data.statusId !== statusId) return;
      setLikeCount(data.likeCount);
      feedStateStore.updatePost(data.statusId, { likeCount: data.likeCount });
    };

    const onCommented = (data: {
      statusId: string; commentId: string; commenterId: string; commenterName: string;
      commenterPhoto: string | null; content: string; parentCommentId: string | null; commentCount: number;
    }) => {
      if (data.statusId !== statusId) return;
      setCommentCount(data.commentCount);
      feedStateStore.updatePost(data.statusId, { commentCount: data.commentCount });
      setComments((prev) => {
        if (prev.some((c) => c.id === data.commentId)) return prev;
        return [...prev, {
          id: data.commentId, statusId: data.statusId, userId: data.commenterId,
          userName: data.commenterName, userPhoto: data.commenterPhoto, content: data.content,
          parentCommentId: data.parentCommentId, createdAt: new Date().toISOString(),
          agreeCount: 0, disagreeCount: 0, myReaction: null,
        }];
      });
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    };

    const onReactAck = (data: { commentId: string; agreeCount: number; disagreeCount: number; myReaction: "agree" | "disagree" | null }) => {
      setComments((prev) => prev.map((c) => c.id === data.commentId ? { ...c, ...data } : c));
    };

    socket.on("like_status_ack", onLikeAck);
    socket.on("status_like_update", onLikeUpdate);
    socket.on("status_commented", onCommented);
    socket.on("react_comment_ack", onReactAck);

    return () => {
      socket.emit("leave_status_room", { statusId });
      socket.off("like_status_ack", onLikeAck);
      socket.off("status_like_update", onLikeUpdate);
      socket.off("status_commented", onCommented);
      socket.off("react_comment_ack", onReactAck);
    };
  }, [socket, statusId]);

  const handleLike = useCallback(() => {
    if (!socket || !post || !statusId) return;
    setIsLiked((v) => !v);
    setLikeCount((c) => c + (isLiked ? -1 : 1));
    socket.emit("like_status", { statusId, statusOwnerId: post.userId });
  }, [socket, post, isLiked, statusId]);

  const handleReact = useCallback((commentId: string, reaction: "agree" | "disagree", current: "agree" | "disagree" | null) => {
    if (!socket) return;
    const next = current === reaction ? null : reaction;
    setComments((prev) => prev.map((c) => {
      if (c.id !== commentId) return c;
      let a = c.agreeCount, d = c.disagreeCount;
      if (c.myReaction === "agree") a--;
      if (c.myReaction === "disagree") d--;
      if (next === "agree") a++;
      if (next === "disagree") d++;
      return { ...c, agreeCount: a, disagreeCount: d, myReaction: next };
    }));
    socket.emit("react_comment", { statusId, commentId, reaction: next });
  }, [socket, statusId]);

  const handleSubmit = useCallback(async () => {
    if (!replyText.trim() || submitting || !statusId) return;
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = { content: replyText.trim() };
      const parentId = replyTo?.commentId ?? (threadCommentId ?? undefined);
      if (parentId) body.parentCommentId = parentId;
      const newComment = await apiPost<Comment>(`/status/${statusId}/comments`, body);
      if (newComment) {
        setComments((prev) => {
          if (prev.some((c) => c.id === newComment.id)) return prev;
          return [...prev, newComment];
        });
        setCommentCount((c) => c + 1);
        setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      }
      setReplyText("");
      setReplyTo(null);
      if (inputRef.current) inputRef.current.style.height = "auto";
    } catch (err) {
      // silent — panel is secondary UI
      void err;
    } finally {
      setSubmitting(false);
    }
  }, [replyText, submitting, replyTo, threadCommentId, statusId]);

  const goToPost = useCallback(() => {
    if (!postPanelId) return;
    router.push(postUrl(postPanelId));
    closePostPanel();
  }, [postPanelId, router, closePostPanel]);

  // Visible top-level comments (or replies to threadCommentId)
  const visibleComments = threadCommentId
    ? comments.filter((c) => c.parentCommentId === threadCommentId)
    : comments.filter((c) => !c.parentCommentId);

  const replyCountFor = useCallback((id: string) => comments.filter((c) => c.parentCommentId === id).length, [comments]);

  if (!postPanelId) return null;

  return (
    <aside className="hidden lg:flex lg:flex-col w-[340px] xl:w-[360px] 2xl:w-[380px] flex-shrink-0 border-l border-border bg-background">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        {threadCommentId ? (
          <button
            onClick={() => setThreadCommentId(null)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-light-text hover:bg-feed-bg"
          >
            <IoChevronBack size={18} />
          </button>
        ) : (
          <button
            onClick={closePostPanel}
            className="flex h-8 w-8 items-center justify-center rounded-full text-light-text hover:bg-feed-bg"
          >
            <IoClose size={18} />
          </button>
        )}
        <span className="flex-1 text-[14px] font-bold text-text">
          {threadCommentId ? "Replies" : "Comments"}
        </span>
        <span className="text-[13px] font-semibold text-light-text">{commentCount}</span>
        <button
          onClick={goToPost}
          title="Open full post"
          className="flex h-8 w-8 items-center justify-center rounded-full text-light-text hover:bg-feed-bg"
        >
          <IoArrowForward size={16} />
        </button>
      </div>

      {/* Post mini-header */}
      {post && (
        <div className="border-b border-border px-4 py-3">
          <div className="flex items-start gap-2.5">
            <button
              onClick={() => { router.push(post.userId === user?.id ? "/profile" : profileUrl(post.userName, post.userId)); closePostPanel(); }}
              className="flex-shrink-0"
            >
              {post.userPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.userPhoto} alt={post.userName} className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-border/40">
                  <IoPersonOutline size={16} className="text-light-text" />
                </div>
              )}
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-text">{post.userName}</p>
              {(post.caption ?? post.content) && (
                <p className="mt-0.5 line-clamp-2 text-[12px] leading-[17px] text-light-text">
                  {post.caption ?? post.content}
                </p>
              )}
            </div>
          </div>
          {/* Like row */}
          <div className="mt-2.5 flex items-center gap-3">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 rounded-full bg-feed-bg px-3 py-1.5 text-[12px] font-bold transition-colors hover:bg-border/50 ${isLiked ? "text-red-500" : "text-light-text"}`}
            >
              {isLiked ? <IoHeart size={14} /> : <IoHeartOutline size={14} />}
              <span>{likeCount}</span>
            </button>
          </div>
        </div>
      )}

      {/* Comments scroll area */}
      <div className="flex-1 overflow-y-auto px-4">
        {loading && (
          <div className="flex flex-col gap-3 pt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-2.5 animate-pulse">
                <div className="h-8 w-8 flex-shrink-0 rounded-full bg-border/40" />
                <div className="flex-1 space-y-1.5 pt-1">
                  <div className="h-2.5 w-20 rounded-full bg-border/40" />
                  <div className="h-2 w-full rounded-full bg-border/30" />
                  <div className="h-2 w-3/4 rounded-full bg-border/30" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && visibleComments.length === 0 && (
          <p className="py-8 text-center text-[13px] text-light-text">No comments yet. Be the first!</p>
        )}

        {visibleComments.map((c) => (
          <div key={c.id} className="flex gap-2.5 border-b border-border/40 py-3 last:border-0">
            <button
              onClick={() => { router.push(c.userId === user?.id ? "/profile" : profileUrl(c.userName, c.userId)); closePostPanel(); }}
              className="flex-shrink-0"
            >
              {c.userPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.userPhoto} alt={c.userName} className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-border/40">
                  <IoPersonOutline size={14} className="text-light-text" />
                </div>
              )}
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] font-bold text-text">{c.userName}</span>
                <RankBadge activityScore={c.userGlobalActivityScore ?? 0} rankVisible={c.userRankVisible !== false} plain className="" />
                <span className="text-[11px] text-light-text">{timeAgo(c.createdAt)}</span>
              </div>
              <p className="mt-0.5 text-[12px] leading-[17px] text-text">{c.content}</p>
              <div className="mt-1.5 flex items-center gap-3">
                <button
                  onClick={() => handleReact(c.id, "agree", c.myReaction)}
                  className={`flex items-center gap-1 text-[11px] font-semibold ${c.myReaction === "agree" ? "text-primary" : "text-light-text"}`}
                >
                  {c.myReaction === "agree" ? <IoThumbsUp size={12} /> : <IoThumbsUpOutline size={12} />}
                  {c.agreeCount > 0 && c.agreeCount}
                </button>
                <button
                  onClick={() => handleReact(c.id, "disagree", c.myReaction)}
                  className={`flex items-center gap-1 text-[11px] font-semibold ${c.myReaction === "disagree" ? "text-red-400" : "text-light-text"}`}
                >
                  {c.myReaction === "disagree" ? <IoThumbsDown size={12} /> : <IoThumbsDownOutline size={12} />}
                  {c.disagreeCount > 0 && c.disagreeCount}
                </button>
                <button
                  onClick={() => { setThreadCommentId(c.id); setReplyTo({ name: c.userName, commentId: c.id }); setTimeout(() => inputRef.current?.focus(), 50); }}
                  className="text-[11px] font-semibold text-light-text hover:text-text"
                >
                  Reply{replyCountFor(c.id) > 0 ? ` (${replyCountFor(c.id)})` : ""}
                </button>
              </div>
            </div>
          </div>
        ))}
        <div ref={commentsEndRef} />
      </div>

      {/* Reply input */}
      <div className="border-t border-border px-4 py-3">
        {replyTo && (
          <div className="mb-2 flex items-center gap-1.5 text-[11px] text-light-text">
            <span>Replying to <span className="font-semibold text-primary">@{replyTo.name}</span></span>
            <button onClick={() => { setReplyTo(null); setThreadCommentId(null); }} className="ml-auto text-light-text hover:text-text">
              <IoClose size={13} />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2.5">
          {user?.profilePhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.profilePhotoUrl} alt="" className="h-7 w-7 flex-shrink-0 rounded-full object-cover" />
          ) : (
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-border/40">
              <IoPersonOutline size={13} className="text-light-text" />
            </div>
          )}
          <textarea
            ref={inputRef}
            value={replyText}
            onChange={(e) => { setReplyText(e.target.value); autoGrow(e.target); }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
            placeholder="Write a comment…"
            rows={1}
            className="flex-1 resize-none rounded-2xl bg-feed-bg px-3 py-2 text-[13px] text-text placeholder-light-text outline-none"
          />
          <button
            onClick={handleSubmit}
            disabled={!replyText.trim() || submitting}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white disabled:opacity-40 transition-opacity"
          >
            <IoArrowForward size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
