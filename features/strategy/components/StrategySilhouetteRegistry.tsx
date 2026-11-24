"use client";

import React from "react";

export type SilhouetteKey =
  | "caloric"
  | "neat"
  | "health"
  | "wealth"
  | "relationships"
  | "happiness";

export interface StrategySilhouetteProps {
  variant: SilhouetteKey;
  className?: string;
}

/**
 * Minimalist geometric monochrome/duotone SVG silhouette registry.
 * Strictly deterministic vector primitives — zero AI-generated raster artwork.
 */
export function StrategySilhouette({ variant, className = "w-11 h-11" }: StrategySilhouetteProps) {
  switch (variant) {
    case "caloric":
      return (
        <svg
          data-testid="strategy-silhouette-caloric"
          viewBox="0 0 48 48"
          fill="none"
          aria-hidden="true"
          className={className}
        >
          <rect x="4" y="4" width="40" height="40" rx="12" className="fill-amber-500/10 stroke-amber-400/35" strokeWidth="1.25" />
          <path d="M24 11C28 16.5 33 20.5 33 27A9 9 0 1 1 15 27C15 22.8 17.5 19.6 19.8 17.2C20.2 20 21.8 21.2 23 21.5C22.2 17.8 22.8 14 24 11Z" className="fill-amber-400/25 stroke-amber-300" strokeWidth="1.5" strokeLinejoin="round" />
          <line x1="14" y1="36" x2="34" y2="36" className="stroke-amber-400/50" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3" />
        </svg>
      );
    case "neat":
      return (
        <svg
          data-testid="strategy-silhouette-neat"
          viewBox="0 0 48 48"
          fill="none"
          aria-hidden="true"
          className={className}
        >
          <rect x="4" y="4" width="40" height="40" rx="12" className="fill-sky-500/10 stroke-sky-400/35" strokeWidth="1.25" />
          <circle cx="26" cy="14" r="3" className="fill-sky-300/80" />
          <path d="M24 19L20 26L15 34M24 19L29 24L33 23M20 26L27 29L30 35" className="stroke-sky-300" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="12" y1="37" x2="36" y2="37" className="stroke-sky-400/40" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "health":
      return (
        <svg
          data-testid="strategy-silhouette-health"
          viewBox="0 0 48 48"
          fill="none"
          aria-hidden="true"
          className={className}
        >
          <rect x="4" y="4" width="40" height="40" rx="12" className="fill-emerald-500/10 stroke-emerald-400/35" strokeWidth="1.25" />
          <path d="M11 25H17L20.5 16L25 32L28.5 22L31 25H37" className="stroke-emerald-300" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="24" cy="24" r="13" className="stroke-emerald-400/20" strokeWidth="1.25" strokeDasharray="2 3" />
        </svg>
      );
    case "wealth":
      return (
        <svg
          data-testid="strategy-silhouette-wealth"
          viewBox="0 0 48 48"
          fill="none"
          aria-hidden="true"
          className={className}
        >
          <rect x="4" y="4" width="40" height="40" rx="12" className="fill-amber-500/10 stroke-amber-400/35" strokeWidth="1.25" />
          <rect x="13" y="27" width="4.5" height="8" rx="1" className="fill-amber-400/35 stroke-amber-300/80" strokeWidth="1.2" />
          <rect x="21.75" y="21" width="4.5" height="14" rx="1" className="fill-amber-400/45 stroke-amber-300/90" strokeWidth="1.2" />
          <rect x="30.5" y="14" width="4.5" height="21" rx="1" className="fill-amber-400/60 stroke-amber-200" strokeWidth="1.2" />
          <path d="M13 22L22 17L33 11" className="stroke-amber-300" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "relationships":
      return (
        <svg
          data-testid="strategy-silhouette-relationships"
          viewBox="0 0 48 48"
          fill="none"
          aria-hidden="true"
          className={className}
        >
          <rect x="4" y="4" width="40" height="40" rx="12" className="fill-sky-500/10 stroke-sky-400/35" strokeWidth="1.25" />
          <circle cx="19" cy="19" r="4" className="fill-sky-400/30 stroke-sky-300" strokeWidth="1.5" />
          <circle cx="30" cy="20" r="3.2" className="fill-sky-400/20 stroke-sky-300/80" strokeWidth="1.5" />
          <path d="M12 34C12 29.5 15.2 26.5 19 26.5C22.8 26.5 26 29.5 26 34" className="stroke-sky-300" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M26 33.5C26.5 30 28.6 27.8 31.4 27.8C33.8 27.8 35.6 29.8 36 33.5" className="stroke-sky-300/75" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "happiness":
      return (
        <svg
          data-testid="strategy-silhouette-happiness"
          viewBox="0 0 48 48"
          fill="none"
          aria-hidden="true"
          className={className}
        >
          <rect x="4" y="4" width="40" height="40" rx="12" className="fill-purple-500/10 stroke-purple-400/35" strokeWidth="1.25" />
          <circle cx="24" cy="24" r="7" className="fill-purple-400/25 stroke-purple-300" strokeWidth="1.5" />
          <path d="M24 11V14M24 34V37M11 24H14M34 24H37M15 15L17.2 17.2M30.8 30.8L33 33M33 15L30.8 17.2M17.2 30.8L15 33" className="stroke-purple-300/80" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
  }
}
