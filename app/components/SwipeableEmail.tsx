"use client";

import { useRef, useState } from "react";
import { C } from "./colors";
import { Badge } from "./Badge";
import { PillButton } from "./PillButton";

interface Email {
  id: string;
  from: string;
  subject: string;
  tag: string;
  account: string;
  unread: boolean;
}

export function SwipeableEmail({
  email,
  onDismiss,
  onAction,
}: {
  email: Email;
  onDismiss: (id: string) => void;
  onAction: (email: Email, action: string) => void;
}) {
  const startX = useRef(0);
  const [offset, setOffset] = useState(0);
  const [gone, setGone] = useState(false);
  const [swiping, setSwiping] = useState(false);

  if (gone) return null;

  const onS = (x: number) => {
    startX.current = x;
    setSwiping(true);
  };
  const onM = (x: number) => {
    if (!swiping) return;
    const dx = x - startX.current;
    if (dx < 0) setOffset(dx);
  };
  const onE = () => {
    setSwiping(false);
    if (offset < -90) {
      setGone(true);
      setTimeout(() => onDismiss(email.id), 250);
    } else {
      setOffset(0);
    }
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl mb-2"
      style={{ opacity: gone ? 0 : 1, transition: "opacity .25s" }}
    >
      {/* Swipe-behind remove area */}
      <div
        className="absolute right-0 top-0 bottom-0 w-[110px] flex items-center justify-center rounded-r-2xl"
        style={{ background: C.dismiss }}
      >
        <span className="text-white text-xs font-bold">Remove</span>
      </div>

      {/* Card */}
      <div
        className="relative z-[2] rounded-2xl px-4 py-3 select-none touch-pan-y"
        style={{
          background: C.card,
          boxShadow: `0 1px 3px ${C.shadow}, 0 0 0 1px ${C.border}`,
          transform: `translateX(${offset}px)`,
          transition: swiping
            ? "none"
            : "transform .25s cubic-bezier(.2,.8,.3,1)",
        }}
        onMouseDown={(e) => onS(e.clientX)}
        onMouseMove={(e) => {
          if (swiping) onM(e.clientX);
        }}
        onMouseUp={onE}
        onMouseLeave={() => {
          if (swiping) onE();
        }}
        onTouchStart={(e) => onS(e.touches[0].clientX)}
        onTouchMove={(e) => onM(e.touches[0].clientX)}
        onTouchEnd={onE}
      >
        <div className="flex items-center gap-2 mb-1">
          <Badge text={email.tag} color={C.email} bg={C.emailBg} />
          {email.account === "personal" && (
            <Badge text="PERSONAL" color={C.focus} bg={C.focusBg} />
          )}
          <span className="text-[10px] ml-auto" style={{ color: C.light }}>
            &larr; swipe
          </span>
        </div>
        <p
          className="text-[13px] font-bold my-1"
          style={{ color: C.text }}
        >
          {email.from}
        </p>
        <p
          className="text-[13px] mb-2 overflow-hidden text-ellipsis whitespace-nowrap"
          style={{ color: C.muted }}
        >
          {email.subject}
        </p>
        <div className="flex gap-1.5">
          <PillButton
            label="Reply"
            icon="↩"
            color={C.reply}
            bg={C.replyBg}
            onClick={(e) => {
              e.stopPropagation();
              onAction(email, "reply");
            }}
          />
          <PillButton
            label="Done"
            icon="✓"
            color={C.done}
            bg={C.doneBg}
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(email.id);
            }}
          />
        </div>
      </div>
    </div>
  );
}
