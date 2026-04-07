"use client";

import { C } from "./colors";
import { LiveDot } from "./LiveDot";

export function Section({
  icon,
  title,
  count,
  color,
  live,
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
  color: string;
  live?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-3 mt-7">
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
        style={{ background: color + "18" }}
      >
        {icon}
      </div>
      <span
        className="text-[15px] font-extrabold tracking-tight"
        style={{ color: C.text }}
      >
        {title}
      </span>
      {count !== undefined && (
        <span
          className="text-[11px] font-bold rounded-full px-2.5 py-[3px]"
          style={{ color: C.muted, background: C.border }}
        >
          {count}
        </span>
      )}
      {live && (
        <span
          className="ml-auto flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full"
          style={{ color: C.live, background: C.liveBg }}
        >
          <LiveDot /> LIVE
        </span>
      )}
    </div>
  );
}
