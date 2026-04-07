"use client";

import { useState } from "react";
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
  const [st, setSt] = useState<"idle" | "playing" | "paused">("idle");

  const play = () => {
    const u = new SpeechSynthesisUtterance(
      generateVoiceBrief(emails, isEvening)
    );
    u.rate = 0.95;
    u.pitch = 1;
    u.lang = "en-US";
    u.onend = () => setSt("idle");
    u.onerror = () => setSt("idle");
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    setSt("playing");
  };
  const pause = () => {
    window.speechSynthesis.pause();
    setSt("paused");
  };
  const resume = () => {
    window.speechSynthesis.resume();
    setSt("playing");
  };
  const stop = () => {
    window.speechSynthesis.cancel();
    setSt("idle");
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
          {st === "playing" ? "🔊" : "🎙"}
        </span>
      </div>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-white m-0">
          Listen to the summary
        </p>
        <p className="text-[11px] text-white/45 mt-0.5 m-0">
          {st === "playing"
            ? "Speaking..."
            : st === "paused"
              ? "Paused"
              : "Tap play"}
        </p>
      </div>

      {/* Controls */}
      <div className="flex gap-1.5">
        {st === "idle" && (
          <button
            onClick={play}
            className="w-9 h-9 rounded-[10px] border-none bg-white cursor-pointer flex items-center justify-center text-sm font-bold transition-transform active:scale-90"
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
