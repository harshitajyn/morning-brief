"use client";

import { useRef, useState } from "react";
import { C } from "./colors";

export function VoicePlayer({
  emails,
  isEvening,
  generateVoiceBrief,
}: {
  emails: any[];
  isEvening: boolean;
  generateVoiceBrief: (emails: any[], isEvening: boolean) => string;
}) {
  const [st, setSt] = useState<"idle" | "loading" | "playing" | "paused">("idle");
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  const play = async () => {
    setError(null);
    setSt("loading");
    try {
      const text = generateVoiceBrief(emails, isEvening);
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        let msg = `TTS failed (${res.status})`;
        try {
          const body = await res.json();
          if (body?.error) msg = body.error;
        } catch {}
        throw new Error(msg);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setSt("idle");
        cleanup();
      };
      audio.onerror = () => {
        setSt("idle");
        cleanup();
      };
      await audio.play();
      setSt("playing");
    } catch (err: any) {
      console.error("[VoicePlayer] TTS error:", err);
      setError(err?.message || "Failed to generate audio");
      setSt("idle");
    }
  };

  const pause = () => {
    audioRef.current?.pause();
    setSt("paused");
  };

  const resume = () => {
    audioRef.current?.play();
    setSt("playing");
  };

  const stop = () => {
    audioRef.current?.pause();
    setSt("idle");
    cleanup();
  };

  const cleanup = () => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    audioRef.current = null;
  };

  const accent = isEvening ? C.eve : "#1D1D1F";

  return (
    <div
      className="rounded-2xl px-[18px] py-3.5 mt-4 flex items-center gap-3.5"
      style={{
        background: isEvening
          ? "linear-gradient(135deg,#1e1b4b,#312e81)"
          : "linear-gradient(135deg,#1D1D1F,#2D2D3F)",
      }}
    >
      {/* Icon */}
      <div className="w-[38px] h-[38px] rounded-[10px] bg-white/10 flex items-center justify-center shrink-0">
        <span className="text-[17px]">
          {st === "playing" ? "\uD83D\uDD0A" : "\uD83C\uDF99"}
        </span>
      </div>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-white m-0">
          Listen to the summary
        </p>
        <p
          className={`text-[11px] mt-0.5 m-0 truncate ${error ? "text-red-300/80" : "text-white/45"}`}
        >
          {error
            ? error
            : st === "loading"
              ? "Generating..."
              : st === "playing"
                ? "Speaking..."
                : st === "paused"
                  ? "Paused"
                  : "Tap play"}
        </p>
      </div>

      {/* Controls */}
      <div className="flex gap-1.5">
        {(st === "idle" || st === "loading") && (
          <button
            onClick={play}
            disabled={st === "loading"}
            className="w-9 h-9 rounded-[10px] border-none bg-white cursor-pointer flex items-center justify-center text-sm font-bold transition-transform active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ color: accent }}
            onMouseDown={(e) =>
              (e.currentTarget.style.transform = "scale(0.9)")
            }
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform = "scale(1)")
            }
          >
            &#9654;
          </button>
        )}
        {st === "playing" && (
          <>
            <button
              onClick={pause}
              className="w-9 h-9 rounded-[10px] border border-white/25 bg-transparent cursor-pointer text-white text-[13px]"
            >
              &#9208;
            </button>
            <button
              onClick={stop}
              className="w-9 h-9 rounded-[10px] border border-white/15 bg-white/[.06] cursor-pointer text-white/60 text-[13px]"
            >
              &#9209;
            </button>
          </>
        )}
        {st === "paused" && (
          <>
            <button
              onClick={resume}
              className="w-9 h-9 rounded-[10px] border-none bg-white cursor-pointer text-sm font-bold"
              style={{ color: accent }}
            >
              &#9654;
            </button>
            <button
              onClick={stop}
              className="w-9 h-9 rounded-[10px] border border-white/15 bg-white/[.06] cursor-pointer text-white/60 text-[13px]"
            >
              &#9209;
            </button>
          </>
        )}
      </div>
    </div>
  );
}
