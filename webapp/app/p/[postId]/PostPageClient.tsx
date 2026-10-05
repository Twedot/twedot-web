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
  IoChevronBack,
  IoChevronForward,
  IoEllipsisHorizontal,
  IoRocketOutline,
  IoPinOutline,
  IoStatsChartOutline,
  IoTrashOutline,
  IoPersonAddOutline,
  IoPersonRemoveOutline,
  IoVolumeMuteOutline,
  IoBanOutline,
  IoFlagOutline,
  IoCodeSlashOutline,
} from "react-icons/io5";
import { FaRetweet } from "react-icons/fa";
import { useAuth } from "@/lib/AuthContext";
import { useUi } from "@/lib/UiContext";
import { useJobSocket } from "@/lib/jobSocket";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { useBookmark } from "@/lib/bookmarks";
import { postDetailStore } from "@/lib/postDetailStore";
import { feedStateStore } from "@/lib/feedStateStore";
import RankBadge from "@/components/RankBadge";
import LinkText from "@/components/LinkText";
import VideoPlayer from "@/components/VideoPlayer";
import type { StatusPost } from "@/lib/types";
import { profileUrl, postUrl } from "@/lib/url";

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

function CommentItem({
  comment,
  statusId,
  socket,
  onReply,
  onReactionUpdate,
  replyCount = 0,
}: {
  comment: Comment;
  statusId: string;
  socket: ReturnType<typeof useJobSocket>["socket"];
  onReply: (name: string, id: string) => void;
  onReactionUpdate: (commentId: string, agreeCount: number, disagreeCount: number, myReaction: "agree" | "disagree" | null) => void;
  replyCount?: number;
}) {
  const commentRouter = useRouter();
  const { user: authUser } = useAuth();
  const [localAgree, setLocalAgree] = useState(comment.agreeCount);
  const [localDisagree, setLocalDisagree] = useState(comment.disagreeCount);
  const [myReaction, setMyReaction] = useState(comment.myReaction);

  useEffect(() => {
    setLocalAgree(comment.agreeCount);
    setLocalDisagree(comment.disagreeCount);
    setMyReaction(comment.myReaction);
  }, [comment.agreeCount, comment.disagreeCount, comment.myReaction]);

  const handleReact = useCallback(
    (reaction: "agree" | "disagree") => {
      if (!socket) return;
      const newReaction = myReaction === reaction ? null : reaction;
      const oldReaction = myReaction;
      const oldAgree = localAgree;
      const oldDisagree = localDisagree;
      let newAgree = localAgree;
      let newDisagree = localDisagree;
      if (oldReaction === "agree") newAgree--;
      if (oldReaction === "disagree") newDisagree--;
      if (newReaction === "agree") newAgree++;
      if (newReaction === "disagree") newDisagree++;
      setMyReaction(newReaction);
      setLocalAgree(newAgree);
      setLocalDisagree(newDisagree);
      socket.emit("react_comment", { statusId, commentId: comment.id, reaction: newReaction });
      onReactionUpdate(comment.id, newAgree, newDisagree, newReaction);
      void oldReaction; void oldAgree; void oldDisagree;
    },
    [socket, statusId, comment.id, myReaction, localAgree, localDisagree, onReactionUpdate]
  );

  return (
    <div className="flex gap-2.5 py-3">
      <button
        onClick={() => commentRouter.push(comment.userId === authUser?.id ? "/profile" : profileUrl(comment.userName, comment.userId))}
        className="flex-shrink-0"
      >
        {comment.userPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={comment.userPhoto} alt={comment.userName} className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-border/40">
            <IoPersonOutline size={16} className="text-light-text" />
          </div>
        )}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-bold text-text">{comment.userName}</span>
          <RankBadge activityScore={comment.userGlobalActivityScore ?? 0} rankVisible={comment.userRankVisible !== false} plain className="" />
          <span className="text-[11px] text-light-text">{timeAgo(comment.createdAt)}</span>
        </div>
        <p className="mt-0.5 text-[13px] leading-[18px] text-text">{comment.content}</p>
        <div className="mt-1.5 flex items-center gap-3">
          <button onClick={() => handleReact("agree")} className={`flex items-center gap-1 text-[11px] font-semibold ${myReaction === "agree" ? "text-primary" : "text-light-text"}`}>
            {myReaction === "agree" ? <IoThumbsUp size={13} /> : <IoThumbsUpOutline size={13} />}
            {localAgree > 0 && localAgree}
          </button>
          <button onClick={() => handleReact("disagree")} className={`flex items-center gap-1 text-[11px] font-semibold ${myReaction === "disagree" ? "text-red-400" : "text-light-text"}`}>
            {myReaction === "disagree" ? <IoThumbsDown size={13} /> : <IoThumbsDownOutline size={13} />}
            {localDisagree > 0 && localDisagree}
          </button>
          <button onClick={() => onReply(comment.userName, comment.id)} className="text-[11px] font-semibold text-light-text hover:text-text">
            Reply{replyCount > 0 ? ` (${replyCount})` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──
export default function PostPageClient() {
  const { postId } = useParams<{ postId: string }>();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { notify } = useUi();
  const { socket } = useJobSocket();

  // The resolved full UUID (unknown until we fetch from /status/by-short/:postId)
  const [statusId, setStatusId] = useState<string>("");

  const [post, setPost] = useState<StatusPost | null>(null);
  const [activeGroupIdx, setActiveGroupIdx] = useState(0);
  const [isFollowingAuthor, setIsFollowingAuthor] = useState(false);
  const followLoadingRef = useRef(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [replyText, setReplyText] = useState("");
  const [replyTo, setReplyTo] = useState<{ name: string; commentId: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingPost, setLoadingPost] = useState(true);
  const [threadCommentId, setThreadCommentId] = useState<string | null>(null);
  const { isBookmarked, toggle: toggleBookmark } = useBookmark(statusId);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const savedScrollY = useRef(0);
  const prevThreadId = useRef<string | null>(null);

  useEffect(() => {
    if (prevThreadId.current !== null && threadCommentId === null) {
      const y = savedScrollY.current;
      const scroller = document.querySelector("main") as HTMLElement | null;
      const t = setTimeout(() => { if (scroller) scroller.scrollTop = y; else window.scrollTo({ top: y, behavior: "instant" }); }, 10);
      prevThreadId.current = null;
      return () => clearTimeout(t);
    }
    prevThreadId.current = threadCommentId;
  }, [threadCommentId]);

  useEffect(() => {
    if (post) {
      setLikeCount(post.likeCount ?? 0);
      setCommentCount(post.commentCount ?? 0);
      setIsLiked(post.isLiked ?? false);
    }
  }, [post]);

  // Step 1: resolve short ID → full UUID + seed post data
  useEffect(() => {
    if (!isAuthenticated || !postId || statusId) return;
    apiGet<{ id: string; type: string; caption: string | null; thumbnailUrl: string | null; ownerId: string; ownerName: string; ownerPhoto: string | null }>(
      `/status/by-short/${postId}`
    )
      .then(async (preview) => {
        setStatusId(preview.id);
        // Try to find full post data in the author's public feed
        const feed = await apiGet<StatusPost[]>(`/status/public?authorId=${preview.ownerId}`);
        const found = Array.isArray(feed) ? feed.find((p) => p.id === preview.id) : null;
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
  }, [isAuthenticated, postId, statusId]);

  // Step 2: fetch follow status + increment view count once post is known
  useEffect(() => {
    if (!post || !isAuthenticated || !user || !statusId) return;
    if (post.userId !== user.id && post.isFollowingAuthor === undefined) {
      apiGet<{ is_following?: boolean }>(`/users/${post.userId}/profile`)
        .then((p) => { if (typeof p.is_following === "boolean") setIsFollowingAuthor(p.is_following); })
        .catch(() => {});
    } else if (post.isFollowingAuthor !== undefined) {
      setIsFollowingAuthor(post.isFollowingAuthor);
    }
    apiPost(`/status/${statusId}/view`, {}).catch(() => {});
  }, [post?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Step 3: fetch comments once statusId is known
  useEffect(() => {
    if (!statusId) return;
    apiGet<Comment[]>(`/status/${statusId}/comments`)
      .then((res) => { if (Array.isArray(res)) setComments(res); })
      .catch(() => {});
  }, [statusId]);

  // Socket: join/leave room, live events
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
      feedStateStore.updatePost(data.statusId, { commentCount: data.commentCount });
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
    if (!socket || !post || !statusId) return;
    const nowLiked = !isLiked;
    setIsLiked(nowLiked);
    setLikeCount((c) => c + (nowLiked ? 1 : -1));
    socket.emit("like_status", { statusId, statusOwnerId: post.userId });
  }, [socket, post, isLiked, statusId]);

  const handleToggleFollow = useCallback(async () => {
    if (!post || followLoadingRef.current) return;
    followLoadingRef.current = true;
    const was = isFollowingAuthor;
    setIsFollowingAuthor(!was);
    try {
      if (was) {
        await apiDelete(`/users/follow/${post.userId}`);
      } else {
        await apiPost(`/users/follow/${post.userId}`, {});
      }
    } catch {
      setIsFollowingAuthor(was);
      notify("Something went wrong. Please try again.");
    } finally {
      followLoadingRef.current = false;
    }
  }, [post, isFollowingAuthor, notify]);

  async function handleNotInterested() {
    setMenuOpen(false);
    try { await apiPost(`/status/${statusId}/hide`, {}); router.back(); } catch { /* silent */ }
  }
  async function handleMoreLikeThis() {
    setMenuOpen(false);
    try { await apiPost(`/status/${statusId}/more-like-this`, {}); } catch { /* silent */ }
    notify("Got it — we'll show you more like this");
  }
  async function handleMute() {
    setMenuOpen(false);
    if (!post) return;
    try { await apiPost(`/users/mute/${post.userId}`, {}); notify(`@${post.userName} muted`); router.back(); } catch { notify("Could not mute — try again"); }
  }
  async function handleBlock() {
    setMenuOpen(false);
    if (!post) return;
    try { await apiPost(`/users/block/${post.userId}`, {}); notify(`@${post.userName} blocked`); router.back(); } catch { notify("Could not block — try again"); }
  }
  async function handleReport() {
    setMenuOpen(false);
    try { await apiPost(`/status/${statusId}/report`, { reason: "inappropriate" }); notify("Post reported — thanks for the feedback"); } catch { notify("Post reported"); }
  }
  async function handleDelete() {
    setMenuOpen(false);
    try { await apiDelete(`/status/${statusId}`); notify("Post deleted"); router.back(); } catch { notify("Could not delete — try again"); }
  }
  async function handlePin() {
    setMenuOpen(false);
    try { await apiPost(`/status/${statusId}/pin`, {}); notify("Post pinned to your profile"); } catch { notify("Could not pin — try again"); }
  }
  function handleCopyLink() {
    setMenuOpen(false);
    navigator.clipboard?.writeText(window.location.href).catch(() => {});
    notify("Link copied");
  }
  function handleEmbedPost() {
    setMenuOpen(false);
    if (!statusId) return;
    const embedCode = `<iframe src="${window.location.origin}${postUrl(statusId)}" width="550" height="400" frameborder="0" scrolling="no"></iframe>`;
    navigator.clipboard?.writeText(embedCode).catch(() => {});
    notify("Embed code copied");
  }

  const handleCommentReaction = useCallback(
    (commentId: string, agreeCount: number, disagreeCount: number, myReaction: "agree" | "disagree" | null) => {
      setComments((prev) =>
        prev.map((c) => c.id === commentId ? { ...c, agreeCount, disagreeCount, myReaction } : c)
      );
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    if (!replyText.trim() || submitting || !statusId) return;
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = { content: replyText.trim() };
      const parentId = replyTo?.commentId ?? (threadCommentId ?? undefined);
      if (parentId) body.parentCommentId = parentId;
      const newComment = await apiPost<Comment>(`/status/${statusId}/comments`, body);
      if (newComment) {
        setComments((prev) => [...prev, newComment]);
        setCommentCount((c) => c + 1);
      }
      setReplyText("");
      setReplyTo(null);
      if (inputRef.current) inputRef.current.style.height = "auto";
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : "Couldn't post your reply");
    } finally {
      setSubmitting(false);
    }
  }, [replyText, submitting, replyTo, threadCommentId, statusId, notify]);

  const startReply = useCallback((name: string, commentId: string) => {
    const scroller = document.querySelector("main") as HTMLElement | null;
    savedScrollY.current = scroller ? scroller.scrollTop : window.scrollY;
    setThreadCommentId(commentId);
    setReplyTo({ name, commentId });
    if (scroller) scroller.scrollTop = 0; else window.scrollTo(0, 0);
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

  const groupItems = (post.groupId ? postDetailStore.getGroup(post.groupId) : null) ?? [post];
  const activeItem = groupItems[activeGroupIdx] ?? post;
  const isVideo = activeItem.type === "video";
  const isImage = activeItem.type === "image";
  const isText = post.type === "text";

  const threadComment = threadCommentId ? comments.find((c) => c.id === threadCommentId) ?? null : null;
  const threadReplies = threadCommentId ? comments.filter((c) => c.parentCommentId === threadCommentId) : [];
  const topLevelComments = comments.filter((c) => !c.parentCommentId);

  return (
    <div className="mx-auto max-w-2xl pb-20">

      {/* ── Back bar ── */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <button
          onClick={() => {
            if (threadCommentId) { setThreadCommentId(null); setReplyTo(null); }
            else { router.back(); }
          }}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-feed-bg"
        >
          <IoArrowBack size={20} className="text-text" />
        </button>
        <span className="text-[15px] font-bold text-text">
          {threadCommentId ? "Replies" : "Post"}
        </span>
      </div>

        {/* ── Thread view ── */}
        {threadComment ? (
          <div className="px-4 pt-4">
            <div className="rounded-2xl bg-feed-bg px-3">
              <CommentItem
                comment={threadComment}
                statusId={statusId}
                socket={socket}
                onReply={() => {
                  setReplyTo({ name: threadComment.userName, commentId: threadComment.id });
                  setTimeout(() => inputRef.current?.focus(), 50);
                }}
                onReactionUpdate={handleCommentReaction}
                replyCount={threadReplies.length}
              />
            </div>

            <div className="mt-3 flex gap-2.5 border-b border-border pb-3">
              {user?.profile_photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.profile_photo_url} alt={user.name ?? ""} className="h-9 w-9 flex-shrink-0 rounded-full object-cover" />
              ) : (
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-border/40">
                  <IoPersonOutline size={18} className="text-light-text" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="mb-0.5 text-[12px] font-semibold text-text">{user?.name ?? "You"}</p>
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
                  onChange={(e) => { setReplyText(e.target.value); autoGrow(e.target); }}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                  placeholder={`Reply to ${replyTo?.name ?? threadComment.userName}…`}
                  rows={1}
                  className="w-full resize-none overflow-hidden bg-transparent text-[13px] text-text placeholder-light-text outline-none"
                  style={{ minHeight: 24 }}
                />
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={handleSubmit}
                    disabled={!replyText.trim() || submitting}
                    className="flex h-7 items-center rounded-full bg-zinc-800 px-4 text-[12px] font-bold text-white disabled:opacity-40"
                  >
                    {submitting ? "…" : "Reply"}
                  </button>
                </div>
              </div>
            </div>

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
          </div>
        ) : (
          <>
            {/* ── Author header + caption — padded ── */}
            <div className="px-4 pt-4">
            {/* ── Author header — 2-line format matching PostCard ── */}
            <header className="mb-3 flex items-start gap-2.5">
              <button onClick={() => router.push(profileUrl(post.userName, post.userId))} className="mt-0.5 flex-shrink-0">
                {post.userPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.userPhoto} alt={post.userName} className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-border/40">
                    <IoPersonOutline size={18} className="text-light-text" />
                  </div>
                )}
              </button>
              <button onClick={() => router.push(profileUrl(post.userName, post.userId))} className="min-w-0 flex-1 text-left">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[13px] font-bold leading-tight text-text">{post.userName}</span>
                  <RankBadge activityScore={post.userGlobalActivityScore ?? 0} rankVisible={post.userRankVisible !== false} />
                </div>
                <p className="mt-0.5 text-[11px] text-light-text">
                  {post.userOccupation ? `${post.userOccupation} · ` : ""}{timeAgo(post.createdAt)}
                </p>
              </button>
              {user?.id !== post.userId && (
                <button
                  onClick={handleToggleFollow}
                  className={`mt-0.5 flex-shrink-0 rounded-full px-3.5 py-1 text-[12px] font-bold transition-colors ${
                    isFollowingAuthor
                      ? "border border-border bg-feed-bg text-text hover:bg-border/40"
                      : "bg-primary text-white hover:opacity-90"
                  }`}
                >
                  {isFollowingAuthor ? "Following" : "Follow"}
                </button>
              )}

              {/* 3-dot menu */}
              <div className="relative mt-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setMenuOpen(o => !o)}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-light-text hover:bg-feed-bg"
                >
                  <IoEllipsisHorizontal size={18} />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => { setMenuOpen(false); setConfirmDelete(false); }} />
                    <div className="absolute right-0 top-8 z-20 w-[240px] overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
                      {user?.id === post.userId ? (
                        <>
                          <button onClick={() => { setMenuOpen(false); router.push(`/boost/${statusId}`); }} className="flex w-full items-center gap-3 px-4 py-3 text-left text-[13px] font-semibold text-text hover:bg-feed-bg">
                            <IoRocketOutline size={16} className="text-primary flex-shrink-0" /><span className="truncate">Boost Post</span>
                          </button>
                          <button onClick={handlePin} className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-left text-[13px] font-semibold text-text hover:bg-feed-bg">
                            <IoPinOutline size={16} className="text-light-text flex-shrink-0" /><span className="truncate">Pin to your profile</span>
                          </button>
                          <button onClick={() => setMenuOpen(false)} className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-left text-[13px] font-semibold text-text hover:bg-feed-bg">
                            <IoStatsChartOutline size={16} className="text-light-text flex-shrink-0" /><span className="truncate">View post activity</span>
                          </button>
                          {!confirmDelete ? (
                            <button onClick={() => setConfirmDelete(true)} className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-left text-[13px] font-semibold text-red-500 hover:bg-feed-bg">
                              <IoTrashOutline size={16} className="flex-shrink-0" />Delete post
                            </button>
                          ) : (
                            <div className="border-t border-border px-4 py-3">
                              <p className="mb-2.5 text-[12px] text-light-text">Delete this post?</p>
                              <div className="flex gap-2">
                                <button onClick={handleDelete} className="flex-1 rounded-lg bg-red-500 py-1.5 text-[12px] font-bold text-white hover:opacity-90">Delete</button>
                                <button onClick={() => setConfirmDelete(false)} className="flex-1 rounded-lg bg-feed-bg py-1.5 text-[12px] font-semibold text-text hover:bg-border/60">Cancel</button>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <button onClick={handleNotInterested} className="flex w-full items-center gap-3 px-4 py-3 text-left text-[13px] font-semibold text-text hover:bg-feed-bg">
                            <IoThumbsDownOutline size={16} className="text-light-text flex-shrink-0" /><span className="truncate">Not interested in this post</span>
                          </button>
                          <button onClick={handleMoreLikeThis} className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-left text-[13px] font-semibold text-text hover:bg-feed-bg">
                            <IoThumbsUpOutline size={16} className="text-light-text flex-shrink-0" /><span className="truncate">More like this</span>
                          </button>
                          <button onClick={async (e) => { await handleToggleFollow(); setMenuOpen(false); }} className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-left text-[13px] font-semibold text-text hover:bg-feed-bg">
                            {isFollowingAuthor ? <IoPersonRemoveOutline size={16} className="text-light-text flex-shrink-0" /> : <IoPersonAddOutline size={16} className="text-light-text flex-shrink-0" />}
                            <span className="truncate">{isFollowingAuthor ? `Unfollow @${post.userName}` : `Follow @${post.userName}`}</span>
                          </button>
                          <button onClick={handleMute} className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-left text-[13px] font-semibold text-text hover:bg-feed-bg">
                            <IoVolumeMuteOutline size={16} className="text-light-text flex-shrink-0" /><span className="truncate">Mute @{post.userName}</span>
                          </button>
                          <button onClick={handleBlock} className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-left text-[13px] font-semibold text-text hover:bg-feed-bg">
                            <IoBanOutline size={16} className="text-light-text flex-shrink-0" /><span className="truncate">Block @{post.userName}</span>
                          </button>
                          <button onClick={() => setMenuOpen(false)} className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-left text-[13px] font-semibold text-text hover:bg-feed-bg">
                            <IoStatsChartOutline size={16} className="text-light-text flex-shrink-0" /><span className="truncate">View post activity</span>
                          </button>
                          <button onClick={handleEmbedPost} className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-left text-[13px] font-semibold text-text hover:bg-feed-bg">
                            <IoCodeSlashOutline size={16} className="text-light-text flex-shrink-0" /><span className="truncate">Embed post</span>
                          </button>
                          <button onClick={handleReport} className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-left text-[13px] font-semibold text-red-500 hover:bg-feed-bg">
                            <IoFlagOutline size={16} className="flex-shrink-0" /><span className="truncate">Report post</span>
                          </button>
                        </>
                      )}
                      <button onClick={handleCopyLink} className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-left text-[13px] font-semibold text-text hover:bg-feed-bg">
                        <IoShareOutline size={16} className="text-light-text flex-shrink-0" /><span className="truncate">Copy link</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </header>

            {/* ── Caption ── */}
            {(() => {
              const captionText = isText
                ? (post.content || post.caption || "")
                : (post.caption ?? null);
              return captionText ? (
                <p className="mb-3 whitespace-pre-wrap text-[14px] leading-[20px] text-text sm:ml-[46px]">
                  <LinkText text={captionText} />
                </p>
              ) : null;
            })()}

            </div>{/* end px-4 pt-4 header+caption block */}

            {/* ── Media — matches feed card: rounded-xl, blurred backdrop, dark bg ── */}
            {!isText && (isImage || isVideo) && (
              <div className="relative mx-4 mb-2.5 overflow-hidden rounded-xl sm:ml-[62px]">
                {/* Image with blurred backdrop (same as MediaBackdrop in PostCard) */}
                {isImage && (activeItem.content || activeItem.thumbnailUrl) && (
                  <div className="relative bg-zinc-900">
                    {/* Blurred background */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeItem.content || activeItem.thumbnailUrl!}
                      alt=""
                      aria-hidden
                      className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-2xl"
                    />
                    {/* Main image */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeItem.content || activeItem.thumbnailUrl!}
                      alt=""
                      className="relative w-full object-cover max-h-[480px] sm:w-auto sm:max-h-[460px]"
                    />
                  </div>
                )}
                {/* Video — object-cover fills width, clips to max-height, no bars */}
                {isVideo && activeItem.content && (
                  <VideoPlayer src={activeItem.content} poster={activeItem.thumbnailUrl ?? undefined} />
                )}
                {/* Carousel navigation */}
                {groupItems.length > 1 && activeGroupIdx > 0 && (
                  <button onClick={() => setActiveGroupIdx((i) => i - 1)} className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70">
                    <IoChevronBack size={20} />
                  </button>
                )}
                {groupItems.length > 1 && activeGroupIdx < groupItems.length - 1 && (
                  <button onClick={() => setActiveGroupIdx((i) => i + 1)} className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70">
                    <IoChevronForward size={20} />
                  </button>
                )}
              </div>
            )}
            {!isText && groupItems.length > 1 && (
              <div className="mb-2 mt-1.5 flex justify-center gap-1.5">
                {groupItems.map((_, i) => (
                  <button key={i} onClick={() => setActiveGroupIdx(i)} className={`h-1.5 w-1.5 rounded-full transition-colors ${i === activeGroupIdx ? "bg-primary" : "bg-border"}`} />
                ))}
              </div>
            )}

            {/* ── rest of content: padded ── */}
            <div className="px-4">
            {/* ── Action bar — horizontal below for all post types ── */}
            <footer className="flex items-center gap-1.5 border-b border-border pb-3 pt-1 sm:ml-[46px]">
              <button onClick={handleLike} className={`flex items-center gap-1.5 rounded-full bg-feed-bg px-3 py-1.5 text-[13px] font-bold transition-colors hover:bg-border/50 ${isLiked ? "text-red-500" : "text-light-text"}`}>
                {isLiked ? <IoHeart size={16} /> : <IoHeartOutline size={16} />}
                <span>{likeCount}</span>
              </button>
              <button onClick={() => inputRef.current?.focus()} className="flex items-center gap-1.5 rounded-full bg-feed-bg px-3 py-1.5 text-[13px] font-bold text-light-text transition-colors hover:bg-border/50">
                <IoChatbubbleEllipsesOutline size={16} />
                <span>{commentCount}</span>
              </button>
              <button onClick={toggleBookmark} className={`flex items-center justify-center rounded-full bg-feed-bg p-[9px] transition-colors hover:bg-border/50 ${isBookmarked ? "text-[#D4A400]" : "text-light-text"}`}>
                {isBookmarked ? <IoBookmark size={16} /> : <IoBookmarkOutline size={16} />}
              </button>
              {user?.id !== post.userId && (
                <button onClick={() => notify("Repost is coming soon")} className="flex items-center justify-center rounded-full bg-feed-bg p-[9px] text-light-text transition-colors hover:bg-border/50">
                  <FaRetweet size={15} />
                </button>
              )}
              <button
                onClick={async () => {
                  const url = window.location.href;
                  try {
                    if (navigator.share) {
                      await navigator.share({ url });
                    } else {
                      await navigator.clipboard.writeText(url);
                      notify("Link copied");
                    }
                  } catch { /* user cancelled */ }
                }}
                className="flex items-center justify-center rounded-full bg-feed-bg p-[9px] text-light-text transition-colors hover:bg-border/50"
              >
                <IoShareOutline size={16} />
              </button>
            </footer>

            {/* ── Date · Views ── */}
            <div className="flex items-center gap-2 py-2 text-[11px] text-light-text">
              <span>{formatDate(post.createdAt)}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <IoEyeOutline size={12} />
                {fmt(post.viewCount)} views
              </span>
            </div>

            {/* ── Composer ── */}
            <div className="flex gap-2.5 border-b border-t border-border py-3">
              {user?.profile_photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.profile_photo_url} alt={user.name ?? ""} className="h-9 w-9 flex-shrink-0 rounded-full object-cover" />
              ) : (
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-border/40">
                  <IoPersonOutline size={18} className="text-light-text" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="mb-0.5 text-[12px] font-semibold text-text">{user?.name ?? "You"}</p>
                <textarea
                  ref={inputRef}
                  value={replyText}
                  onChange={(e) => { setReplyText(e.target.value); autoGrow(e.target); }}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                  placeholder="Write a comment…"
                  rows={1}
                  className="w-full resize-none overflow-hidden bg-transparent text-[13px] text-text placeholder-light-text outline-none"
                  style={{ minHeight: 24 }}
                />
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={handleSubmit}
                    disabled={!replyText.trim() || submitting}
                    className="flex h-7 items-center rounded-full bg-zinc-800 px-4 text-[12px] font-bold text-white disabled:opacity-40"
                  >
                    {submitting ? "…" : "Post"}
                  </button>
                </div>
              </div>
            </div>

            {/* ── Comments ── */}
            {topLevelComments.length > 0 ? (
              <div className="divide-y divide-border/40">
                {topLevelComments.map((comment) => {
                  const count = comments.filter((c) => c.parentCommentId === comment.id).length;
                  return (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      statusId={statusId}
                      socket={socket}
                      onReply={(name, id) => startReply(name, id)}
                      onReactionUpdate={handleCommentReaction}
                      replyCount={count}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <IoChatbubbleEllipsesOutline size={30} className="text-light-text" />
                <p className="text-[13px] text-light-text">No comments yet. Be the first!</p>
              </div>
            )}
            </div>{/* end px-4 rest-of-content block */}
          </>
        )}

    </div>
  );
}
