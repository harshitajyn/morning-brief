"use client";

import { C } from "./colors";

export function LiveDot() {
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full"
      style={{ background: C.live, boxShadow: "0 0 4px #4CAF50" }}
    />
  );
}
