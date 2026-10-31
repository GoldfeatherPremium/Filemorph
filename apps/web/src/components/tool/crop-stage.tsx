"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CropStageProps {
  src: string;
  aspect: string; // "free" | "1:1" | "4:3" | "16:9" | "3:2"
  onChange: (crop: { x: number; y: number; width: number; height: number }) => void;
}

const MAX_W = 560;
const MAX_H = 440;

function aspectValue(aspect: string): number | null {
  if (aspect === "free") return null;
  const [w, h] = aspect.split(":").map(Number);
  if (!w || !h) return null;
  return w / h;
}

export function CropStage({ src, aspect, onChange }: CropStageProps) {
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [display, setDisplay] = useState<{ w: number; h: number } | null>(null);
  const [rect, setRect] = useState<CropRect | null>(null);
  const dragRef = useRef<{ mode: "move" | "resize"; startX: number; startY: number; rect: CropRect } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNatural(null);
    setDisplay(null);
    setRect(null);
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      setNatural({ w, h });
      const scale = Math.min(MAX_W / w, MAX_H / h, 1);
      const dw = Math.round(w * scale);
      const dh = Math.round(h * scale);
      setDisplay({ w: dw, h: dh });
      const ar = aspectValue(aspect);
      let cw = Math.round(dw * 0.8);
      let ch = Math.round(dh * 0.8);
      if (ar) {
        if (cw / ch > ar) ch = Math.round(cw / ar);
        else cw = Math.round(ch * ar);
      }
      setRect({ x: Math.round((dw - cw) / 2), y: Math.round((dh - ch) / 2), width: cw, height: ch });
    };
    img.src = src;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  function commitRect(next: CropRect) {
    if (!display) return;
    const clamped = {
      x: Math.max(0, Math.min(display.w - next.width, next.x)),
      y: Math.max(0, Math.min(display.h - next.height, next.y)),
      width: Math.max(20, Math.min(display.w, next.width)),
      height: Math.max(20, Math.min(display.h, next.height)),
    };
    setRect(clamped);
    if (natural && display) {
      const fx = natural.w / display.w;
      const fy = natural.h / display.h;
      onChange({
        x: Math.round(clamped.x * fx),
        y: Math.round(clamped.y * fy),
        width: Math.round(clamped.width * fx),
        height: Math.round(clamped.height * fy),
      });
    }
  }

  function onPointerDown(mode: "move" | "resize") {
    return (e: React.PointerEvent) => {
      e.preventDefault();
      if (!rect) return;
      dragRef.current = { mode, startX: e.clientX, startY: e.clientY, rect: { ...rect } };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag || !rect || !display) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    const ar = aspectValue(aspect);
    if (drag.mode === "move") {
      commitRect({ ...drag.rect, x: drag.rect.x + dx, y: drag.rect.y + dy });
      return;
    }
    let w = drag.rect.width + dx;
    let h = drag.rect.height + dy;
    if (ar) {
      w = Math.max(20, drag.rect.width + dx);
      h = w / ar;
    }
    commitRect({ ...drag.rect, width: w, height: h });
  }

  function onPointerUp() {
    dragRef.current = null;
  }

  if (!natural || !display || !rect) {
    return <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Loading preview…</div>;
  }

  return (
    <div className="space-y-3">
      <div
        ref={wrapperRef}
        className="relative overflow-hidden rounded-2xl border bg-[#F0F1F2] touch-none select-none"
        style={{ width: display.w, height: display.h, maxWidth: "100%" }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="Preview" className="block h-full w-full object-contain" draggable={false} />
        <div
          className="absolute cursor-move rounded-lg border-2 border-white ring-2 ring-fm-accent/70 shadow-lift"
          style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
          onPointerDown={onPointerDown("move")}
        >
          <div className="grid h-full w-full grid-cols-3 grid-rows-3 opacity-20">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="border border-white" />
            ))}
          </div>
          <div
            className={cn("absolute -bottom-1.5 -right-1.5 h-5 w-5 cursor-nwse-resize rounded-full bg-white border-2 border-fm-accent")}
            onPointerDown={onPointerDown("resize")}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Drag to reposition · corner handle to resize{aspect !== "free" ? " · locked to aspect" : ""}</p>
    </div>
  );
}
