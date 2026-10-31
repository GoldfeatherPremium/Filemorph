"use client";

import { motion } from "motion/react";
import { Check, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressRingProps {
  value: number;
  stage?: string | null;
  status: "queued" | "processing" | "completed" | "failed" | "cancelled" | "expired";
  errorMessage?: string | null;
}

export function ProgressRing({ value, stage, status, errorMessage }: ProgressRingProps) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, value) / 100) * c;
  const done = status === "completed";
  const failed = status === "failed" || status === "cancelled" || status === "expired";

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-28 w-28">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--secondary)" strokeWidth="7" />
          <motion.circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={c}
            animate={{ strokeDashoffset: done || failed ? 0 : offset }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {done ? (
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white"
            >
              <Check className="h-6 w-6" />
            </motion.span>
          ) : failed ? (
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive text-white">
              <X className="h-6 w-6" />
            </span>
          ) : (
            <span className="text-xl font-semibold tabular-nums">{Math.round(value)}%</span>
          )}
        </div>
      </div>
      <div className="text-center">
        {done ? (
          <p className="font-medium">Done</p>
        ) : failed ? (
          <p className="font-medium text-destructive">{status === "failed" ? "Failed" : "Cancelled"}</p>
        ) : (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className={cn("h-4 w-4 animate-spin text-fm-accent")} />
            {stage || "Processing…"}
          </p>
        )}
        {failed && errorMessage ? <p className="mt-1 max-w-xs text-xs text-muted-foreground">{errorMessage}</p> : null}
      </div>
    </div>
  );
}
