"use client";

import React from "react";

export type PyramidIllustrationKey =
  | "log"
  | "plan"
  | "nutrition"
  | "calendar"
  | "gym"
  | "action"
  | "verify"
  | "chart"
  | "evolve";

export function pickPyramidIllustration(
  text: string,
  fallback: PyramidIllustrationKey
): PyramidIllustrationKey {
  const t = text.toLowerCase();
  if (
    t.includes("food") ||
    t.includes("meal") ||
    t.includes("macro") ||
    t.includes("protein") ||
    t.includes("water") ||
    t.includes("diet")
  ) {
    return "nutrition";
  }
  if (
    t.includes("gym") ||
    t.includes("lift") ||
    t.includes("workout") ||
    t.includes("train") ||
    t.includes("cardio") ||
    t.includes("run")
  ) {
    return "gym";
  }
  if (
    t.includes("habit") ||
    t.includes("schedule") ||
    t.includes("calendar") ||
    t.includes("daily") ||
    t.includes("audit")
  ) {
    return "calendar";
  }
  if (
    t.includes("chart") ||
    t.includes("metric") ||
    t.includes("weight") ||
    t.includes("revenue") ||
    t.includes("mrr") ||
    t.includes("result")
  ) {
    return "chart";
  }
  if (
    t.includes("verify") ||
    t.includes("review") ||
    t.includes("check") ||
    t.includes("roadmap") ||
    t.includes("test")
  ) {
    return "verify";
  }
  if (
    t.includes("evolve") ||
    t.includes("adapt") ||
    t.includes("scale") ||
    t.includes("optimize") ||
    t.includes("momentum")
  ) {
    return "evolve";
  }
  if (
    t.includes("plan") ||
    t.includes("design") ||
    t.includes("blueprint") ||
    t.includes("architecture")
  ) {
    return "plan";
  }
  if (
    t.includes("log") ||
    t.includes("setup") ||
    t.includes("set up") ||
    t.includes("input")
  ) {
    return "log";
  }
  return fallback;
}

export function EditorialPyramidSilhouette({
  kind,
}: {
  kind: PyramidIllustrationKey;
}) {
  switch (kind) {
    case "nutrition":
      return (
        <svg viewBox="0 0 80 56" className="w-16 h-11 mx-auto">
          <rect x="8" y="34" width="64" height="6" rx="3" fill="currentColor" opacity="0.25" />
          <path d="M20 34 C20 20 60 20 60 34 Z" fill="currentColor" opacity="0.85" />
          <circle cx="40" cy="14" r="5" fill="#f59e0b" />
          <path
            d="M30 16 L36 22 M50 16 L44 22"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "gym":
      return (
        <svg viewBox="0 0 80 56" className="w-16 h-11 mx-auto">
          <circle cx="40" cy="12" r="5.5" fill="currentColor" />
          <path d="M22 22 L58 22" stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" />
          <rect x="14" y="15" width="5" height="14" rx="1.5" fill="currentColor" />
          <rect x="61" y="15" width="5" height="14" rx="1.5" fill="currentColor" />
          <path
            d="M40 19 L40 36 M40 24 L28 22 M40 24 L52 22 M40 36 L31 50 M40 36 L49 50"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      );
    case "calendar":
      return (
        <svg viewBox="0 0 80 56" className="w-16 h-11 mx-auto">
          <rect
            x="16"
            y="10"
            width="48"
            height="38"
            rx="5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          />
          <line x1="16" y1="20" x2="64" y2="20" stroke="currentColor" strokeWidth="2.5" />
          <path
            d="M26 30 L31 35 L39 26"
            fill="none"
            stroke="#10b981"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M44 30 L49 35 L57 26"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line x1="25" y1="41" x2="55" y2="41" stroke="currentColor" strokeWidth="2" opacity="0.4" />
        </svg>
      );
    case "chart":
      return (
        <svg viewBox="0 0 80 56" className="w-16 h-11 mx-auto">
          <polyline
            points="12,44 28,32 42,36 62,14"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polygon points="62,14 54,15 61,22" fill="#f59e0b" />
          <rect x="14" y="38" width="6" height="10" rx="1" fill="currentColor" opacity="0.4" />
          <rect x="26" y="32" width="6" height="16" rx="1" fill="currentColor" opacity="0.55" />
          <rect x="38" y="26" width="6" height="22" rx="1" fill="currentColor" opacity="0.7" />
          <rect x="50" y="18" width="6" height="30" rx="1" fill="currentColor" opacity="0.9" />
        </svg>
      );
    case "verify":
      return (
        <svg viewBox="0 0 80 56" className="w-16 h-11 mx-auto">
          <circle cx="36" cy="28" r="16" fill="none" stroke="currentColor" strokeWidth="2.8" />
          <path
            d="M28 28 L34 34 L45 21"
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line x1="48" y1="40" x2="62" y2="50" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case "evolve":
      return (
        <svg viewBox="0 0 80 56" className="w-16 h-11 mx-auto">
          <path
            d="M12 46 L28 46 L28 36 L44 36 L44 26 L62 26 L62 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <circle cx="48" cy="14" r="4.5" fill="#f59e0b" />
          <path
            d="M40 24 L48 19 L55 24"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "plan":
      return (
        <svg viewBox="0 0 80 56" className="w-16 h-11 mx-auto">
          <rect
            x="14"
            y="10"
            width="52"
            height="36"
            rx="4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          />
          <circle cx="26" cy="28" r="4" fill="#06b6d4" />
          <circle cx="42" cy="22" r="4" fill="#f59e0b" />
          <circle cx="56" cy="32" r="4" fill="#10b981" />
          <path d="M30 27 L38 23 M46 24 L52 30" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case "log":
      return (
        <svg viewBox="0 0 80 56" className="w-16 h-11 mx-auto">
          <rect
            x="18"
            y="8"
            width="44"
            height="40"
            rx="4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          />
          <line x1="26" y1="19" x2="54" y2="19" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
          <line
            x1="26"
            y1="28"
            x2="48"
            y2="28"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.7"
          />
          <line
            x1="26"
            y1="37"
            x2="42"
            y2="37"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.5"
          />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 80 56" className="w-16 h-11 mx-auto">
          <polygon
            points="40,8 48,26 66,28 52,40 56,52 40,44 24,52 28,40 14,28 32,26"
            fill="#f59e0b"
            opacity="0.85"
          />
        </svg>
      );
  }
}
