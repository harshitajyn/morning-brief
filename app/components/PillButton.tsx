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
      className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-[11px] font-bold cursor-pointer transition-all duration-100 active:translate-y-[1px]"
      style={{
        color,
        background: bg,
        border: "none",
        boxShadow: `0 2px 0 ${color}33, 0 1px 3px ${color}15`,
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = "translateY(2px)";
        e.currentTarget.style.boxShadow = `0 0px 0 ${color}33`;
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = `0 2px 0 ${color}33, 0 1px 3px ${color}15`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = `0 2px 0 ${color}33, 0 1px 3px ${color}15`;
      }}
    >
      {icon && <span className="text-xs">{icon}</span>}
      {label}
    </button>
  );
}
