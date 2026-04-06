"use client";

import { C } from "./colors";

export function Sheet({
  item,
  type,
  onClose,
}: {
  item: any;
  type: string;
  onClose: () => void;
}) {
  if (!item) return null;

  const colors: Record<string, string> = {
    urgent: C.urgent,
    cal: C.cal,
    email: C.email,
    focus: C.focus,
    follow: C.later,
    reply: C.reply,
  };
  const c = colors[type] || C.urgent;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col justify-end animate-[fadeIn_.2s_ease]"
      onClick={onClose}
    >
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>

      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/35 backdrop-blur-[6px]" />

      {/* Panel */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative rounded-t-3xl pt-3 px-6 pb-10 max-h-[75vh] overflow-y-auto animate-[slideUp_.3s_cubic-bezier(.2,.8,.3,1)]"
        style={{ background: C.card }}
      >
        {/* Handle */}
        <div
          className="w-9 h-1 rounded-sm mx-auto mb-4"
          style={{ background: C.border }}
        />

        {/* Type indicator */}
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: c }}
          />
          <span
            className="text-[11px] font-bold uppercase tracking-widest"
            style={{ color: c }}
          >
            {type === "cal" ? "calendar" : type}
          </span>
        </div>

        {/* Title */}
        <h2
          className="text-xl font-bold mb-2 leading-tight"
          style={{ color: C.text }}
        >
          {item.title || item.subject || item.task || ""}
        </h2>

        {item.from && (
          <p className="text-[13px]" style={{ color: C.muted }}>
            From: <strong style={{ color: C.text }}>{item.from}</strong>
          </p>
        )}
        {item.detail && (
          <p
            className="text-sm leading-relaxed mt-2.5"
            style={{ color: C.muted }}
          >
            {item.detail}
          </p>
        )}
        {item.note && (
          <p
            className="text-sm leading-relaxed mt-2.5"
            style={{ color: C.muted }}
          >
            {item.note}
          </p>
        )}
        {item.time && item.end && (
          <p className="text-[13px] font-semibold mt-1.5" style={{ color: c }}>
            {item.time} &ndash; {item.end}
          </p>
        )}
        {item.name && (
          <p className="text-[13px] mt-1" style={{ color: C.muted }}>
            Contact: <strong style={{ color: C.text }}>{item.name}</strong>{" "}
            &middot; {item.days}d waiting
          </p>
        )}

        {/* Prep notes */}
        {item.prep && item.prep.length > 0 && (
          <div
            className="mt-3.5 p-3.5 rounded-xl"
            style={{ background: C.calBg }}
          >
            <p
              className="text-xs font-bold mb-2 uppercase tracking-wide"
              style={{ color: C.cal }}
            >
              Prep Notes
            </p>
            {item.prep.map((p: string, i: number) => (
              <div key={i} className="flex gap-2 items-center py-[5px]">
                <div
                  className="w-4 h-4 rounded shrink-0"
                  style={{ border: `2px solid ${C.cal}` }}
                />
                <span className="text-[13px]" style={{ color: C.text }}>
                  {p}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Draft reply */}
        {type === "reply" && (
          <div
            className="mt-3.5 p-3.5 rounded-xl"
            style={{ background: C.emailBg }}
          >
            <p
              className="text-xs font-bold mb-2"
              style={{ color: C.email }}
            >
              Draft Reply
            </p>
            <p
              className="text-[13px] leading-relaxed italic"
              style={{ color: C.text }}
            >
              Hi {item.from?.split(" ")[0]}, thanks for this &mdash; reviewing
              now and will get back to you shortly. Best, Harshita
            </p>
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full mt-5 py-3.5 rounded-[14px] text-white border-none text-[15px] font-semibold cursor-pointer transition-transform active:scale-[0.97]"
          style={{ background: c }}
          onMouseDown={(e) =>
            (e.currentTarget.style.transform = "scale(0.97)")
          }
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onMouseLeave={(e) =>
            (e.currentTarget.style.transform = "scale(1)")
          }
        >
          Done
        </button>
      </div>
    </div>
  );
}
