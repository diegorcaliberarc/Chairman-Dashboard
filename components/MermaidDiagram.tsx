"use client";

import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

interface MermaidDiagramProps {
  chart: string;
}

export default function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgCode, setSvgCode] = useState<string>("");

  useEffect(() => {
    let isMounted = true;
    mermaid.initialize({ startOnLoad: false, theme: "neutral" });
    const id = "mermaid-" + Math.random().toString(36).substring(2, 9);
    
    const renderChart = async () => {
      try {
        const { svg } = await mermaid.render(id, chart);
        if (isMounted) setSvgCode(svg);
      } catch (err) {
        console.error("Mermaid diagram rendering failed:", err);
        if (isMounted) setSvgCode(`<div class="text-sm text-red-500">Failed to render map architecture. Invalid syntax.</div>`);
      }
    };
    renderChart();

    return () => { isMounted = false; };
  }, [chart]);

  return (
    <div
      ref={containerRef}
      className="my-3 overflow-x-auto rounded-lg bg-zinc-50 dark:bg-[#080A0D] border border-zinc-200 dark:border-[#1E1F24] p-5 shadow-[0_0_30px_rgba(0,0,0,0.03)] dark:shadow-[0_0_30px_rgba(255,255,255,0.02)] transition-colors"
      dangerouslySetInnerHTML={{ __html: svgCode || "Initializing Roadmap Rendering Engine..." }}
    />
  );
}
