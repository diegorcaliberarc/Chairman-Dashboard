"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { StrategicTree } from "@/lib/synthesisRoadmapTypes";

export interface ComputedSvgPath {
  d: string;
  color: string;
  marker: string;
  label?: string;
  midX?: number;
  midY?: number;
}

export function useDagCanvasDragAndArrows(
  tree: StrategicTree,
  zoomScale: number,
  onNodeClick: (nodeId: string) => void
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgPaths, setSvgPaths] = useState<ComputedSvgPath[]>([]);
  const [nodeOffsets, setNodeOffsets] = useState<Record<string, { x: number; y: number }>>({});

  const dragStateRef = useRef<{
    nodeId: string;
    startClientX: number;
    startClientY: number;
    origX: number;
    origY: number;
    moved: boolean;
  } | null>(null);

  const handleNodePointerDown = useCallback(
    (nodeId: string, e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest("button")) return;
      const cur = nodeOffsets[nodeId] || { x: 0, y: 0 };
      dragStateRef.current = {
        nodeId,
        startClientX: e.clientX,
        startClientY: e.clientY,
        origX: cur.x,
        origY: cur.y,
        moved: false,
      };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [nodeOffsets]
  );

  const handleNodePointerMove = useCallback(
    (nodeId: string, e: React.PointerEvent) => {
      const ds = dragStateRef.current;
      if (!ds || ds.nodeId !== nodeId) return;
      const dx = (e.clientX - ds.startClientX) / zoomScale;
      const dy = (e.clientY - ds.startClientY) / zoomScale;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        ds.moved = true;
      }
      if (ds.moved) {
        setNodeOffsets((prev) => ({
          ...prev,
          [nodeId]: { x: ds.origX + dx, y: ds.origY + dy },
        }));
      }
    },
    [zoomScale]
  );

  const handleNodePointerUp = useCallback(
    (nodeId: string, e: React.PointerEvent) => {
      const ds = dragStateRef.current;
      if (!ds || ds.nodeId !== nodeId) return;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignore if pointer capture already released
      }
      const wasDragged = ds.moved;
      dragStateRef.current = null;
      if (!wasDragged) {
        onNodeClick(nodeId);
      }
    },
    [onNodeClick]
  );

  const getOffsetStyle = useCallback(
    (nodeId: string): React.CSSProperties => {
      const off = nodeOffsets[nodeId];
      if (!off || (off.x === 0 && off.y === 0)) return {};
      return { transform: `translate3d(${off.x}px, ${off.y}px, 0)`, zIndex: 40 };
    },
    [nodeOffsets]
  );

  const calculateConnections = useCallback(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const paths: ComputedSvgPath[] = [];

    tree.arrows.forEach((conn) => {
      const fromEl = document.getElementById(`dag_node_${conn.from}`);
      const toEl =
        conn.to === "goal"
          ? document.getElementById("dag_node_goal")
          : document.getElementById(`dag_node_${conn.to}`);

      if (!fromEl || !toEl) return;

      const fromRect = fromEl.getBoundingClientRect();
      const toRect = toEl.getBoundingClientRect();

      const startX = (fromRect.right - containerRect.left) / zoomScale;
      const startY = (fromRect.top + fromRect.height / 2 - containerRect.top) / zoomScale;
      const endX = (toRect.left - containerRect.left) / zoomScale;
      const endY = (toRect.top + toRect.height / 2 - containerRect.top) / zoomScale;

      const dx = endX - startX;
      const cp1X = startX + dx * 0.45;
      const cp2X = startX + dx * 0.55;
      const d = `M ${startX} ${startY} C ${cp1X} ${startY}, ${cp2X} ${endY}, ${endX} ${endY}`;

      paths.push({
        d,
        color: conn.color,
        marker:
          conn.color === "amber"
            ? "url(#arrowAmber)"
            : conn.color === "gold"
            ? "url(#arrowGoldBig)"
            : "url(#arrowCyan)",
        label: conn.label,
        midX: (startX + endX) / 2,
        midY: (startY + endY) / 2 - 12,
      });
    });

    setSvgPaths(paths);
  }, [tree, zoomScale]);

  const offsetKey = Object.entries(nodeOffsets)
    .map(([id, pos]) => `${id}:${pos.x},${pos.y}`)
    .join("|");

  useLayoutEffect(() => {
    if (offsetKey.length >= 0) {
      calculateConnections();
    }
  }, [calculateConnections, offsetKey]);

  useEffect(() => {
    const el = containerRef.current;
    const observer =
      typeof ResizeObserver !== "undefined" && el
        ? new ResizeObserver(() => calculateConnections())
        : null;
    if (observer && el) observer.observe(el);
    window.addEventListener("resize", calculateConnections);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", calculateConnections);
    };
  }, [calculateConnections]);

  return {
    containerRef,
    svgPaths,
    hasOffsets: Object.keys(nodeOffsets).length > 0,
    resetOffsets: () => setNodeOffsets({}),
    getOffsetStyle,
    handleNodePointerDown,
    handleNodePointerMove,
    handleNodePointerUp,
  };
}
