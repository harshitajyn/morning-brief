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
    <div className="flex items-center gap-2 mb-2.5 mt-6">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
        style={{ background: color + "18" }}
      >
        {icon}
      </div>
      <span
        className="text-[15px] font-bold tracking-tight"
        style={{ color: C.text }}
      >
        {title}
      </span>
      {count !== undefined && (
        <span
          className="text-[11px] font-semibold rounded-[10px] px-2 py-[2px]"
          style={{ color: C.muted, background: C.border }}
        >
          {count}
        </span>
      )}
      {live && (
        <span
          className="ml-auto flex items-center gap-1 text-[10px] font-bold px-2 py-[2px] rounded-md"
          style={{ color: C.live, background: C.liveBg }}
        >
          <LiveDot /> LIVE
        </span>
      )}
    </div>
  );
}
