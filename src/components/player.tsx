"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

type YTPlayer = {
  destroy: () => void;
  loadVideoById: (id: string) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  mute: () => void;
  unMute: () => void;
  getPlayerState: () => number;
  getDuration?: () => number;
  getVideoData: () => { video_id?: string; isLive?: boolean; isPremiere?: boolean; errorCode?: number | null };
};

type YTStateEvent = { data: number };

export type PlayerHandle = {
  play: () => void;
  pause: () => void;
  mute: () => void;
  unmute: () => void;
  getState: () => number | null;
};

type PlayerProps = {
  videoId: string;
  onEnded: () => void;
  onError: (code?: number) => void;
  onPlaying: () => void;
  onNeedsGesture: () => void;
  onMutedAutoplay: () => void;
};

declare global {
  interface Window {
    YT?: {
      Player: new (element: HTMLElement, options: Record<string, unknown>) => YTPlayer;
      PlayerState: { ENDED: number; PLAYING: number; PAUSED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (!apiPromise) {
    apiPromise = new Promise((resolve) => {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previous?.();
        resolve();
      };
      const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      if (existing) return;
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.body.appendChild(script);
    });
  }
  return apiPromise;
}

export const Player = forwardRef<PlayerHandle, PlayerProps>(function Player(
  { videoId, onEnded, onError, onPlaying, onNeedsGesture, onMutedAutoplay },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const videoRef = useRef(videoId);
  const failedRef = useRef(false);
  const callbacks = useRef({ onEnded, onError, onPlaying, onNeedsGesture, onMutedAutoplay });
  useEffect(() => {
    videoRef.current = videoId;
    callbacks.current = { onEnded, onError, onPlaying, onNeedsGesture, onMutedAutoplay };
  });

  useImperativeHandle(ref, () => ({
    play: () => playerRef.current?.playVideo(),
    pause: () => playerRef.current?.pauseVideo(),
    mute: () => playerRef.current?.mute(),
    unmute: () => playerRef.current?.unMute(),
    getState: () => playerRef.current?.getPlayerState() ?? null,
  }));

  useEffect(() => {
    let cancelled = false;
    let player: YTPlayer | null = null;
    const host = hostRef.current;
    loadYouTubeApi().then(() => {
      if (cancelled || !hostRef.current || !window.YT?.Player) return;
      const target = document.createElement("div");
      hostRef.current.appendChild(target);
      player = new window.YT.Player(target, {
        videoId: videoRef.current,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          origin: window.location.origin,
          enablejsapi: 1,
        },
        events: {
          onReady: () => {
            if (!player || cancelled) return;
            playerRef.current = player;
            const wanted = videoRef.current;
            if (wanted && player.getVideoData?.().video_id !== wanted) player.loadVideoById(wanted);
            player.unMute();
            player.playVideo();
            window.setTimeout(() => {
              if (cancelled || !player || videoRef.current !== wanted) return;
              const info = player.getVideoData?.() ?? {};
              if ((info.isLive || info.isPremiere) && player.getPlayerState() !== window.YT?.PlayerState.PLAYING) {
                failedRef.current = true;
                callbacks.current.onError();
                return;
              }
              if (player.getPlayerState() === window.YT?.PlayerState.PLAYING) return;
              player.mute();
              player.playVideo();
              callbacks.current.onMutedAutoplay();
              window.setTimeout(() => {
                if (cancelled || !player || videoRef.current !== wanted) return;
                if (failedRef.current) return;
                if (player.getPlayerState() !== window.YT?.PlayerState.PLAYING) {
                  callbacks.current.onNeedsGesture();
                }
              }, 900);
            }, 800);
          },
          onStateChange: (event: YTStateEvent) => {
            if (event.data === window.YT?.PlayerState.PLAYING) {
              failedRef.current = false;
              callbacks.current.onPlaying();
            }
            if (event.data === window.YT?.PlayerState.ENDED) callbacks.current.onEnded();
          },
          onError: (event: { data?: number }) => {
            failedRef.current = true;
            callbacks.current.onError(event?.data);
          },
        },
      });
    });
    return () => {
      cancelled = true;
      try {
        player?.destroy();
      } catch {
        /* The iframe may already be gone. */
      }
      playerRef.current = null;
      host?.replaceChildren();
    };
  }, []);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    if (player.getVideoData?.().video_id === videoId) return;
    failedRef.current = false;
    player.loadVideoById(videoId);
  }, [videoId]);

  return <div ref={hostRef} className="stage-frame absolute inset-0 bg-black" />;
});
