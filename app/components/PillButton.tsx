"use client";

export function PillButton({
  label,
  icon,
  color,
  bg,
  onClick,
}: {
  label: string;
  icon?: string;
  color: string;
  bg: string;
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 px-3 py-[5px] rounded-full text-[11px] font-semibold cursor-pointer transition-transform duration-100 active:scale-[0.93]"
      style={{
        color,
        background: bg,
        border: `1.5px solid ${color}22`,
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.93)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {icon && <span className="text-xs">{icon}</span>}
      {label}
    </button>
  );
}
