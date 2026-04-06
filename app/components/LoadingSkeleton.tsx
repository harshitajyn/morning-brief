"use client";

import { C } from "./colors";

export function LoadingSkeleton() {
  return (
    <div className="px-5 pt-6 space-y-3 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="rounded-2xl p-4"
          style={{
            background: C.card,
            boxShadow: `0 1px 3px ${C.shadow}, 0 0 0 1px ${C.border}`,
          }}
        >
          <div
            className="h-3 w-20 rounded-md mb-3"
            style={{ background: C.border }}
          />
          <div
            className="h-4 w-3/4 rounded-md mb-2"
            style={{ background: C.border }}
          />
          <div
            className="h-3 w-1/2 rounded-md"
            style={{ background: C.border }}
          />
        </div>
      ))}
    </div>
  );
}
