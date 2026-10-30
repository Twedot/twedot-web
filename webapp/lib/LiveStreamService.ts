// WebSocket + LiveKit service for broadcaster and viewer flows.
// Adapted from twedot-world — canvas/building/purchase logic removed.

export interface LiveRoom {
  roomId: string;
  hostId: string;
  hostName: string;
  hostPhoto: string;
  title: string;
  category: string;
  price: number;
  viewers: number;
  startedAt: number;
}

export interface ChatMessage {
  userId: string;
  user: string;
  color: string;
  text: string;
}

export interface JoinedInfo {
  streamId: string;
  token: string;
  livekitUrl: string;
  hostId: string;
  hostName: string;
  hostPhoto: string;
  title: string;
  viewers: number;
}

type EventHandler = {
  onLiveStarted?: (streamId: string, token: string, livekitUrl: string) => void;
  onResumed?: (streamId: string, token: string, livekitUrl: string) => void;
  onViewerJoined?: (userId: string, userName: string) => void;
  onViewerLeft?: (userId: string) => void;
  onViewerCount?: (count: number) => void;
  onJoined?: (info: JoinedInfo) => void;
  onChat?: (msg: ChatMessage) => void;
  onStreamEnded?: () => void;
  onError?: (msg: string) => void;
};

let lkModule: typeof import("livekit-client") | null = null;
async function getLK() {
  if (!lkModule) lkModule = await import("livekit-client");
  return lkModule;
}

export class LiveStreamService {
  private ws: WebSocket | null = null;
  private handlers: EventHandler = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _room: any = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private _screenShareTrack: MediaStreamTrack | null = null;
  private _screenShareAudioTrack: MediaStreamTrack | null = null;
  private _isHosting = false;
  private _activeStreamId: string | null = null;
  private _expectingGoLive = false;
  private _pendingMessages: string[] = [];
  private _disposed = false;
  private _ready = false;
  private _pendingGoLive: (() => void) | null = null;

  get isHosting() { return this._isHosting; }
  get activeStreamId() { return this._activeStreamId; }

  constructor(private wsUrl: string) {}

  on(handlers: EventHandler) {
    this.handlers = { ...this.handlers, ...handlers };
  }

  connect(userId: string) {
    if (this.ws && this.ws.readyState <= 1) return;
    const url = `${this.wsUrl}?userId=${encodeURIComponent(userId)}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      const pending = this._pendingMessages.splice(0);
      pending.forEach((m) => { if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(m); });
    };

    this.ws.onmessage = (ev) => {
      let msg: Record<string, unknown>;
      try { msg = JSON.parse(ev.data as string); } catch { return; }
      this.handleMessage(msg);
    };

    this.ws.onclose = () => {
      if (!this._disposed) {
        this.reconnectTimer = setTimeout(() => this.connect(userId), 3000);
      }
    };
  }

  private handleMessage(msg: Record<string, unknown>) {
    switch (msg.type) {
      case "welcome":
        this.send({ type: "resume_host" });
        break;

      case "live_started": {
        this._isHosting = true;
        this._activeStreamId = msg.streamId as string;
        if (this._expectingGoLive) {
          this._expectingGoLive = false;
          this.handlers.onLiveStarted?.(msg.streamId as string, msg.token as string, msg.livekitUrl as string);
        } else {
          this.handlers.onResumed?.(msg.streamId as string, msg.token as string, msg.livekitUrl as string);
        }
        break;
      }

      case "no_active_stream":
        this._isHosting = false;
        this._activeStreamId = null;
        this._ready = true;
        if (this._pendingGoLive) {
          const fn = this._pendingGoLive;
          this._pendingGoLive = null;
          fn();
        }
        break;

      case "joined":
        this.handlers.onJoined?.({
          streamId: msg.streamId as string,
          token: msg.token as string,
          livekitUrl: msg.livekitUrl as string,
          hostId: msg.hostId as string,
          hostName: msg.hostName as string,
          hostPhoto: msg.hostPhoto as string,
          title: msg.title as string,
          viewers: Number(msg.viewers) || 0,
        });
        break;

      case "viewer_joined":
        this.handlers.onViewerJoined?.(msg.userId as string, msg.userName as string);
        if (typeof msg.viewers === "number") this.handlers.onViewerCount?.(msg.viewers);
        break;

      case "viewer_left":
        this.handlers.onViewerLeft?.(msg.userId as string);
        if (typeof msg.viewers === "number") this.handlers.onViewerCount?.(msg.viewers);
        break;

      case "chat":
        this.handlers.onChat?.({
          userId: msg.userId as string,
          user: msg.userName as string,
          color: "#" + ((msg.userId as string) ?? "").slice(-6).replace(/[^0-9a-f]/gi, "a"),
          text: msg.text as string,
        });
        break;

      case "stream_ended":
        this.disconnectRoom();
        this.handlers.onStreamEnded?.();
        break;

      case "error":
        this.handlers.onError?.(msg.error as string);
        break;
    }
  }

  // ── LiveKit Room ─────────────────────────────────────

  async connectRoom(token: string, livekitUrl: string) {
    if (this._room) await this._room.disconnect();
    const lk = await getLK();

    const room = new lk.Room({
      adaptiveStream: true,
      dynacast: false,
      reconnectPolicy: {
        nextRetryDelayInMs: (ctx: { retryCount: number }) => {
          if (ctx.retryCount >= 15) return null;
          return Math.min(ctx.retryCount * 1000 + 500, 10000);
        },
      },
    });

    room.on(lk.RoomEvent.Disconnected, () => {
      if (this._isHosting) {
        this.handlers.onError?.("Connection lost — your stream may still be live. End it if needed.");
      } else {
        this.handlers.onStreamEnded?.();
      }
    });

    await room.connect(livekitUrl, token);
    this._room = room;
    return room;
  }

  async disconnectRoom() {
    if (this._screenShareTrack) { this._screenShareTrack.stop(); this._screenShareTrack = null; }
    if (this._screenShareAudioTrack) { this._screenShareAudioTrack.stop(); this._screenShareAudioTrack = null; }
    if (this._room) { await this._room.disconnect(); this._room = null; }
  }

  // ── Camera / Mic ────────────────────────────────────

  async publishCameraTrack(track: MediaStreamTrack) {
    if (!this._room) return;
    const lk = await getLK();
    await this._room.localParticipant.publishTrack(track, {
      source: lk.Track.Source.Camera,
      simulcast: true,
      videoEncoding: { maxBitrate: 1_500_000, maxFramerate: 30 },
    });
  }

  async unpublishCamera() {
    if (!this._room || !lkModule) return;
    const pub = this._room.localParticipant.getTrackPublication(lkModule.Track.Source.Camera);
    if (pub?.track) await this._room.localParticipant.unpublishTrack(pub.track.mediaStreamTrack);
  }

  async publishMicTrack(track: MediaStreamTrack) {
    if (!this._room) return;
    const lk = await getLK();
    await this._room.localParticipant.publishTrack(track, {
      source: lk.Track.Source.Microphone,
      audioPreset: lk.AudioPresets.musicStereo,
    });
  }

  async setMicEnabled(on: boolean) {
    if (!this._room || !lkModule) return;
    const pub = this._room.localParticipant.getTrackPublication(lkModule.Track.Source.Microphone);
    if (pub?.track) { if (on) await pub.unmute(); else await pub.mute(); }
  }

  // ── Screen share ────────────────────────────────────

  async publishScreenTrack(stream: MediaStream) {
    if (!this._room) return;
    const lk = await getLK();

    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      this._screenShareTrack = videoTrack;
      await this._room.localParticipant.publishTrack(videoTrack, {
        source: lk.Track.Source.ScreenShare,
        simulcast: false,
        videoEncoding: { maxBitrate: 3_000_000, maxFramerate: 30 },
      });
    }
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      this._screenShareAudioTrack = audioTrack;
      await this._room.localParticipant.publishTrack(audioTrack, {
        source: lk.Track.Source.ScreenShareAudio,
      });
    }
  }

  async unpublishScreen() {
    if (!this._room || !lkModule) return;
    const screenPub = this._room.localParticipant.getTrackPublication(lkModule.Track.Source.ScreenShare);
    if (screenPub?.track) await this._room.localParticipant.unpublishTrack(screenPub.track.mediaStreamTrack);
    if (this._screenShareTrack) { this._screenShareTrack.stop(); this._screenShareTrack = null; }

    const audioPub = this._room.localParticipant.getTrackPublication(lkModule.Track.Source.ScreenShareAudio);
    if (audioPub?.track) await this._room.localParticipant.unpublishTrack(audioPub.track.mediaStreamTrack);
    if (this._screenShareAudioTrack) { this._screenShareAudioTrack.stop(); this._screenShareAudioTrack = null; }
  }

  // ── Broadcaster API ──────────────────────────────────

  goLive(title: string, category: string, price: number) {
    const doSend = () => {
      this._expectingGoLive = true;
      this.send({ type: "go_live", title, category, price });
    };
    if (this._ready) {
      doSend();
    } else {
      this._pendingGoLive = doSend;
    }
  }

  joinStream(roomId: string) {
    const doSend = () => this.send({ type: "join_stream", roomId });
    if (this._ready) {
      doSend();
    } else {
      this._pendingGoLive = doSend;
    }
  }

  leaveStream(roomId: string) {
    this.send({ type: "leave_stream", roomId });
    this.disconnectRoom();
  }

  endStream() {
    this._isHosting = false;
    this._activeStreamId = null;
    this.send({ type: "end_stream" });
    this.disconnectRoom();
  }

  // ── Chat ─────────────────────────────────────────────

  sendChat(text: string) {
    this.send({ type: "chat", text });
  }

  // ── Internals ────────────────────────────────────────

  private send(data: Record<string, unknown>) {
    const msg = JSON.stringify(data);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(msg);
    } else {
      this._pendingMessages.push(msg);
    }
  }

  dispose() {
    this._disposed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.disconnectRoom();
    this.ws?.close();
    this.ws = null;
  }
}
