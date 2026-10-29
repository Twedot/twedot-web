"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  IoClose,
  IoChatbubbleEllipsesOutline,
  IoPersonOutline,
  IoArrowUndoOutline,
  IoSend,
} from "react-icons/io5";
import { useAuth } from "@/lib/AuthContext";
import { useUi } from "@/lib/UiContext";
import { useJobSocket } from "@/lib/jobSocket";
import { apiGet, apiPost } from "@/lib/api";
import RankBadge from "@/components/RankBadge";

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

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function autoGrow(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

function CommentRow({
  comment,
  onReply,
}: {
  comment: Comment;
  onReply: (name: string) => void;
}) {
  return (
    <div className="flex gap-2.5 py-3 border-b border-white/5 last:border-0">
      {comment.userPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={comment.userPhoto} alt={comment.userName} className="h-8 w-8 flex-shrink-0 rounded-full object-cover" />
      ) : (
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/10">
          <IoPersonOutline size={15} className="text-white/60" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[12px] font-semibold text-white">{comment.userName}</span>
          <RankBadge activityScore={comment.userGlobalActivityScore ?? 0} rankVisible={comment.userRankVisible !== false} plain className="" />
          <span className="text-[10px] text-white/40">{timeAgo(comment.createdAt)}</span>
        </div>
        <p className="text-[13px] leading-[18px] text-white/80 break-words">{comment.content}</p>
        <button
          onClick={() => onReply(comment.userName)}
          className="mt-1 flex items-center gap-1 text-[11px] text-white/40 hover:text-white/70 transition-colors"
        >
          <IoArrowUndoOutline size={11} />
          Reply
        </button>
      </div>
    </div>
  );
}

export default function CommentsDrawer({
  postId,
  commentCount,
  onClose,
}: {
  postId: string | null;
  commentCount: number;
  onClose: () => void;
}) {
  const { user, isAuthenticated } = useAuth();
  const { notify } = useUi();
  const { socket } = useJobSocket();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [count, setCount] = useState(commentCount);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCount(commentCount);
  }, [commentCount]);

  useEffect(() => {
    if (!postId) { setComments([]); return; }
    setLoading(true);
    apiGet<Comment[]>(`/status/${postId}/comments`)
      .then((data) => setComments(data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postId]);

  useEffect(() => {
    if (!socket || !postId) return;
    socket.emit("join_status_room", { statusId: postId });

    const onCommented = (data: Comment) => {
      if (data.statusId !== postId) return;
      setComments((prev) => {
        if (prev.some((c) => c.id === data.id)) return prev;
        return [...prev, data];
      });
      setCount((c) => c + 1);
    };

    socket.on("status_commented", onCommented);
    return () => {
      socket.emit("leave_status_room", { statusId: postId });
      socket.off("status_commented", onCommented);
    };
  }, [socket, postId]);

  // Scroll to bottom when new comments arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments.length]);

  const handleSubmit = useCallback(async () => {
    if (!text.trim() || submitting || !postId) return;
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = { content: replyTo ? `@${replyTo} ${text.trim()}` : text.trim() };
      const newComment = await apiPost<Comment>(`/status/${postId}/comments`, body);
      if (newComment) {
        setComments((prev) => {
          if (prev.some((c) => c.id === newComment.id)) return prev;
          return [...prev, newComment];
        });
        setCount((c) => c + 1);
      }
      setText("");
      setReplyTo(null);
      if (inputRef.current) inputRef.current.style.height = "auto";
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : "Couldn't post your comment");
    } finally {
      setSubmitting(false);
    }
  }, [text, submitting, postId, replyTo, notify]);

  if (!postId) return null;

  const topLevel = comments.filter((c) => !c.parentCommentId);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 flex flex-col w-full max-w-[400px] bg-[#0f1117] border-l border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <IoChatbubbleEllipsesOutline size={18} className="text-white/60" />
            <span className="text-[14px] font-bold text-white">Comments</span>
            {count > 0 && <span className="text-[12px] text-white/40">({count})</span>}
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors">
            <IoClose size={18} />
          </button>
        </div>

        {/* Comments list */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4">
          {loading && (
            <div className="flex items-center justify-center py-10">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
            </div>
          )}
          {!loading && topLevel.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <IoChatbubbleEllipsesOutline size={28} className="text-white/20" />
              <p className="text-[13px] text-white/30">No comments yet. Be the first!</p>
            </div>
          )}
          {topLevel.map((comment) => (
            <CommentRow
              key={comment.id}
              comment={comment}
              onReply={(name) => {
                setReplyTo(name);
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
            />
          ))}
        </div>

        {/* Composer */}
        <div className="flex-shrink-0 border-t border-white/10 px-4 py-3">
          {replyTo && (
            <div className="mb-2 flex items-center gap-1.5 text-[11px] text-white/40">
              <IoArrowUndoOutline size={11} />
              <span>Replying to <strong className="text-white/60">@{replyTo}</strong></span>
              <button onClick={() => setReplyTo(null)} className="ml-auto hover:text-white/60">✕</button>
            </div>
          )}
          <div className="flex items-center gap-2">
            {user?.profile_photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.profile_photo_url} alt="" className="h-7 w-7 flex-shrink-0 rounded-full object-cover" />
            ) : (
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/10">
                <IoPersonOutline size={13} className="text-white/60" />
              </div>
            )}
            <div className="flex-1 min-w-0 rounded-full bg-white/5 border border-white/10 px-3 py-1.5">
              <textarea
                ref={inputRef}
                value={text}
                onChange={(e) => { setText(e.target.value); autoGrow(e.target); }}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                placeholder={isAuthenticated ? (replyTo ? `Reply to @${replyTo}…` : "Write a comment…") : "Log in to comment"}
                disabled={!isAuthenticated}
                rows={1}
                className="w-full resize-none overflow-hidden bg-transparent text-[13px] text-white placeholder-white/30 outline-none"
                style={{ minHeight: 20, maxHeight: 80 }}
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={!text.trim() || submitting || !isAuthenticated}
              className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white disabled:opacity-40 transition-opacity"
            >
              <IoSend size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
