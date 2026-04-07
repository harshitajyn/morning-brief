"use client";

export function Badge({
  text,
  color,
  bg,
}: {
  text: string;
  color: string;
  bg: string;
}) {
  return (
    <span
      className="text-[10px] font-bold px-2.5 py-[3px] rounded-full uppercase tracking-wider whitespace-nowrap"
      style={{ color, background: bg }}
    >
      {text}
    </span>
  );
}
