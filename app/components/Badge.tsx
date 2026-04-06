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
      className="text-[10px] font-bold px-2 py-[2px] rounded-md uppercase tracking-wide whitespace-nowrap"
      style={{ color, background: bg }}
    >
      {text}
    </span>
  );
}
