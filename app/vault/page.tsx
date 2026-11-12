"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Network,
  Search,
  Plus,
  Save,
  Trash2,
  Pin,
  Sparkles,
  Link2,
  ArrowUpRight,
  ArrowDownLeft,
  Eye,
  Edit3,
  Columns,
  LocateFixed,
  ZoomIn,
  ZoomOut,
  Orbit,
  Tag,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { ExecutiveModuleShell } from "@/components/chairman/ExecutiveModuleShell";

interface VaultNode {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  content_markdown: string;
  domain: string;
  tags: string[];
  is_pinned: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

interface VaultLink {
  id: string;
  source_node_id: string;
  target_node_id: string;
  link_type: string;
}

interface SimNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

const DOMAIN_META: Record<
  string,
  { label: string; color: string; glow: string; angle: number }
> = {
  engineering: {
    label: "Engineering",
    color: "#38bdf8",
    glow: "rgba(56, 189, 248, 0.35)",
    angle: -Math.PI / 2,
  },
  trading: {
    label: "Trading",
    color: "#f59e0b",
    glow: "rgba(245, 158, 11, 0.35)",
    angle: -Math.PI / 2 + (2 * Math.PI) / 5,
  },
  property: {
    label: "Property",
    color: "#10b981",
    glow: "rgba(16, 185, 129, 0.35)",
    angle: -Math.PI / 2 + (4 * Math.PI) / 5,
  },
  canine: {
    label: "Canine",
    color: "#f43f5e",
    glow: "rgba(244, 63, 94, 0.35)",
    angle: -Math.PI / 2 + (6 * Math.PI) / 5,
  },
  logistics: {
    label: "Logistics",
    color: "#a855f7",
    glow: "rgba(168, 85, 247, 0.35)",
    angle: -Math.PI / 2 + (8 * Math.PI) / 5,
  },
};

function getDomainInfo(domain: string) {
  return (
    DOMAIN_META[domain?.toLowerCase()] || {
      label: domain || "General",
      color: "#94a3b8",
      glow: "rgba(148, 163, 184, 0.3)",
      angle: 0,
    }
  );
}

function fuzzyMatch(text: string, pattern: string): boolean {
  const t = text.toLowerCase();
  const p = pattern.toLowerCase().trim();
  if (!p) return true;
  if (t.includes(p)) return true;
  let ti = 0;
  let pi = 0;
  while (ti < t.length && pi < p.length) {
    if (t[ti] === p[pi]) pi++;
    ti++;
  }
  return pi === p.length;
}

function extractSentenceExcerpt(markdown: string, targetTitle: string): string {
  if (!markdown) return "";
  const escaped = targetTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const wikiRegex = new RegExp(`\\[\\[${escaped}(?:\\|[^\\]]+)?\\]\\]`, "i");
  const plainRegex = new RegExp(escaped, "i");

  const lines = markdown
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (wikiRegex.test(line)) {
      const cleaned = line.replace(/^[-*#>+\s]+/, "").trim();
      return cleaned.length > 180 ? `${cleaned.slice(0, 177)}...` : cleaned;
    }
  }

  for (const line of lines) {
    if (plainRegex.test(line)) {
      const cleaned = line.replace(/^[-*#>+\s]+/, "").trim();
      return cleaned.length > 180 ? `${cleaned.slice(0, 177)}...` : cleaned;
    }
  }

  const fallback = lines.find((l) => !l.startsWith("#")) || lines[0] || "";
  return fallback.replace(/^[-*#>+\s]+/, "").slice(0, 160);
}

function stripMarkdownPreview(md: string): string {
  return md
    .replace(/^#+\s+.*/gm, "")
    .replace(/\[\[([^\[\]|]+)(?:\|([^\[\]]+))?\]\]/g, (_, t, alias) => alias || t)
    .replace(/[*_`>#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function NeuralVaultPage() {
  const [nodes, setNodes] = useState<VaultNode[]>([]);
  const [links, setLinks] = useState<VaultLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // Filters & Search
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [orphanFilter, setOrphanFilter] = useState<"all" | "connected" | "orphan">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchMode, setSearchMode] = useState<"fuzzy" | "regex">("fuzzy");
  const [clusterGravityOn, setClusterGravityOn] = useState<boolean>(true);

  // Active selection & Hover
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<{
    node: VaultNode;
    screenX: number;
    screenY: number;
  } | null>(null);

  // Editor state
  const [editTitle, setEditTitle] = useState("");
  const [editDomain, setEditDomain] = useState("engineering");
  const [editTagsInput, setEditTagsInput] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editPinned, setEditPinned] = useState(false);
  const [editorMode, setEditorMode] = useState<"split" | "write" | "preview">("split");
  const [isDirty, setIsDirty] = useState(false);

  // Create modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDomain, setNewDomain] = useState("engineering");
  const [newTags, setNewTags] = useState("architecture, synthesis");

  // Physics & Canvas refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const simNodesRef = useRef<Map<string, SimNode>>(new Map());
  const cameraRef = useRef({ x: 0, y: 0, zoom: 1, targetZoom: 1 });
  const dragStateRef = useRef<{
    mode: "none" | "pan" | "node";
    nodeId: string | null;
    startX: number;
    startY: number;
    camStartX: number;
    camStartY: number;
    moved: boolean;
  }>({
    mode: "none",
    nodeId: null,
    startX: 0,
    startY: 0,
    camStartX: 0,
    camStartY: 0,
    moved: false,
  });
  const [fpsDisplay, setFpsDisplay] = useState<number>(60);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const loadVault = useCallback(async (preserveSelection = true) => {
    setLoading(true);
    try {
      const res = await fetch("/api/vault", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data.nodes)) {
        setNodes(data.nodes);
        setLinks(Array.isArray(data.links) ? data.links : []);
        if (!preserveSelection || !selectedId) {
          const first =
            data.nodes.find((n: VaultNode) => n.is_pinned) || data.nodes[0];
          if (first) setSelectedId(first.id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch vault:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    loadVault(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Degree counts per node
  const degreeMap = useMemo(() => {
    const map = new Map<string, { out: number; in: number; total: number }>();
    for (const n of nodes) {
      map.set(n.id, { out: 0, in: 0, total: 0 });
    }
    for (const l of links) {
      const s = map.get(l.source_node_id);
      const t = map.get(l.target_node_id);
      if (s) {
        s.out += 1;
        s.total += 1;
      }
      if (t) {
        t.in += 1;
        t.total += 1;
      }
    }
    return map;
  }, [nodes, links]);

  // All unique tags
  const allTags = useMemo(() => {
    const s = new Set<string>();
    for (const n of nodes) {
      for (const t of n.tags || []) {
        if (t) s.add(t);
      }
    }
    return Array.from(s).sort();
  }, [nodes]);

  // Filter & Search evaluation
  const { visibleNodeIds, searchMatchedIds, regexError } = useMemo(() => {
    const visible = new Set<string>();
    const matched = new Set<string>();
    let rxErr: string | null = null;
    let compiledRegex: RegExp | null = null;

    const q = searchQuery.trim();
    if (q && searchMode === "regex") {
      try {
        compiledRegex = new RegExp(q, "i");
      } catch (e: any) {
        rxErr = e?.message || "Invalid regex";
      }
    }

    for (const n of nodes) {
      if (domainFilter !== "all" && n.domain !== domainFilter) continue;
      if (tagFilter !== "all" && !(n.tags || []).includes(tagFilter)) continue;

      const deg = degreeMap.get(n.id)?.total ?? 0;
      if (orphanFilter === "orphan" && deg > 0) continue;
      if (orphanFilter === "connected" && deg === 0) continue;

      visible.add(n.id);

      if (q) {
        const corpus = `${n.title} ${n.domain} ${(n.tags || []).join(" ")} ${n.content_markdown}`;
        if (searchMode === "regex") {
          if (compiledRegex && compiledRegex.test(corpus)) {
            matched.add(n.id);
          }
        } else if (fuzzyMatch(corpus, q)) {
          matched.add(n.id);
        }
      }
    }

    return {
      visibleNodeIds: visible,
      searchMatchedIds: matched,
      regexError: rxErr,
    };
  }, [nodes, domainFilter, tagFilter, orphanFilter, searchQuery, searchMode, degreeMap]);

  // Sync editor fields when selectedId changes
  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedId) || null,
    [nodes, selectedId]
  );

  useEffect(() => {
    if (selectedNode) {
      setEditTitle(selectedNode.title);
      setEditDomain(selectedNode.domain || "engineering");
      setEditTagsInput((selectedNode.tags || []).join(", "));
      setEditContent(selectedNode.content_markdown || "");
      setEditPinned(Boolean(selectedNode.is_pinned));
      setIsDirty(false);
    }
  }, [selectedNode]);

  // Sync simulation nodes map whenever nodes/degreeMap change
  useEffect(() => {
    const map = simNodesRef.current;
    const validIds = new Set(nodes.map((n) => n.id));

    Array.from(map.keys()).forEach((existingId) => {
      if (!validIds.has(existingId)) {
        map.delete(existingId);
      }
    });

    nodes.forEach((n, idx) => {
      const deg = degreeMap.get(n.id)?.total ?? 0;
      const radius = Math.min(24, 9 + deg * 2.1 + (n.is_pinned ? 2.5 : 0));
      const existing = map.get(n.id);
      if (existing) {
        existing.radius = radius;
      } else {
        const info = getDomainInfo(n.domain);
        const jitterAngle = info.angle + ((idx % 5) - 2) * 0.24;
        const r = 135 + (idx % 4) * 38;
        map.set(n.id, {
          id: n.id,
          x: Math.cos(jitterAngle) * r + (Math.random() - 0.5) * 30,
          y: Math.sin(jitterAngle) * r + (Math.random() - 0.5) * 30,
          vx: 0,
          vy: 0,
          radius,
        });
      }
    });
  }, [nodes, degreeMap]);

  // Save node & re-sync [[Wikilinks]]
  const handleSaveNode = useCallback(async () => {
    if (!selectedNode) return;
    setSaving(true);
    try {
      const parsedTags = editTagsInput
        .split(",")
        .map((t) => t.trim().replace(/^#/, ""))
        .filter(Boolean);

      const res = await fetch("/api/vault", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedNode.id,
          title: editTitle,
          domain: editDomain,
          tags: parsedTags,
          content_markdown: editContent,
          is_pinned: editPinned,
          autoCreateStubs: true,
        }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.nodes)) {
        setNodes(data.nodes);
        setLinks(data.links || []);
        setIsDirty(false);
        setStatusBanner("Graph synchronized & [[Wikilinks]] indexed");
        setTimeout(() => setStatusBanner(null), 2600);
      }
    } catch (err) {
      console.error("Failed saving node:", err);
    } finally {
      setSaving(false);
    }
  }, [selectedNode, editTitle, editDomain, editTagsInput, editContent, editPinned]);

  // Ctrl/Cmd + S shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        if (selectedNode) {
          e.preventDefault();
          handleSaveNode();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedNode, handleSaveNode]);

  const handleCreateNode = async () => {
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      const parsedTags = newTags
        .split(",")
        .map((t) => t.trim().replace(/^#/, ""))
        .filter(Boolean);
      const res = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          domain: newDomain,
          tags: parsedTags,
          is_pinned: false,
          content_markdown: `# ${newTitle.trim()}\n\nConnected doctrine for [[Chairman Living OS Master Architecture]].\n\n## Operational Notes\n- `,
        }),
      });
      const data = await res.json();
      if (res.ok && data.node) {
        setNodes(data.nodes || []);
        setLinks(data.links || []);
        setSelectedId(data.node.id);
        setShowNewModal(false);
        setNewTitle("");
        setStatusBanner(`Created "${data.node.title}"`);
        setTimeout(() => setStatusBanner(null), 2500);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNode = async () => {
    if (!selectedNode) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/vault?id=${encodeURIComponent(selectedNode.id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.nodes)) {
        setNodes(data.nodes);
        setLinks(data.links || []);
        setSelectedId(data.nodes[0]?.id || null);
      }
    } finally {
      setSaving(false);
    }
  };

  const focusNodeOnCanvas = useCallback((nodeId: string) => {
    setSelectedId(nodeId);
    const sim = simNodesRef.current.get(nodeId);
    if (sim) {
      cameraRef.current.x = -sim.x;
      cameraRef.current.y = -sim.y;
      cameraRef.current.targetZoom = Math.max(cameraRef.current.targetZoom, 1.18);
    }
  }, []);

  const insertWikilinkAtCursor = (targetTitle: string) => {
    const token = `[[${targetTitle}]]`;
    const el = textareaRef.current;
    if (!el) {
      setEditContent((prev) => `${prev}\n- ${token}`);
      setIsDirty(true);
      return;
    }
    const start = el.selectionStart ?? editContent.length;
    const end = el.selectionEnd ?? editContent.length;
    const next =
      editContent.slice(0, start) + token + editContent.slice(end);
    setEditContent(next);
    setIsDirty(true);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    }, 10);
  };

  // Bi-directional backlinks & unlinked mentions for selectedNode
  const { inboundBacklinks, outboundLinks, unlinkedMentions } = useMemo(() => {
    if (!selectedNode) {
      return { inboundBacklinks: [], outboundLinks: [], unlinkedMentions: [] };
    }
    const nodeById = new Map(nodes.map((n) => [n.id, n]));

    const inboundIds = new Set<string>();
    const outboundIds = new Set<string>();

    for (const l of links) {
      if (l.target_node_id === selectedNode.id && l.source_node_id !== selectedNode.id) {
        inboundIds.add(l.source_node_id);
      }
      if (l.source_node_id === selectedNode.id && l.target_node_id !== selectedNode.id) {
        outboundIds.add(l.target_node_id);
      }
    }

    const inbound = Array.from(inboundIds)
      .map((id) => nodeById.get(id))
      .filter((n): n is VaultNode => Boolean(n))
      .map((sourceDoc) => ({
        node: sourceDoc,
        excerpt: extractSentenceExcerpt(sourceDoc.content_markdown, selectedNode.title),
      }));

    const outbound = Array.from(outboundIds)
      .map((id) => nodeById.get(id))
      .filter((n): n is VaultNode => Boolean(n))
      .map((targetDoc) => ({
        node: targetDoc,
        excerpt: extractSentenceExcerpt(editContent || selectedNode.content_markdown, targetDoc.title),
      }));

    const escaped = selectedNode.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const plainRx = new RegExp(`\\b${escaped}\\b`, "i");
    const unlinked = nodes
      .filter(
        (n) =>
          n.id !== selectedNode.id &&
          !inboundIds.has(n.id) &&
          plainRx.test(n.content_markdown || "")
      )
      .map((n) => ({
        node: n,
        excerpt: extractSentenceExcerpt(n.content_markdown, selectedNode.title),
      }));

    return {
      inboundBacklinks: inbound,
      outboundLinks: outbound,
      unlinkedMentions: unlinked,
    };
  }, [selectedNode, nodes, links, editContent]);

  const convertUnlinkedMention = async (sourceDoc: VaultNode) => {
    if (!selectedNode) return;
    const escaped = selectedNode.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rx = new RegExp(`(?<!\\[\\[)\\b(${escaped})\\b(?!\\]\\])`, "i");
    const updatedMarkdown = sourceDoc.content_markdown.replace(
      rx,
      `[[${selectedNode.title}]]`
    );
    const res = await fetch("/api/vault", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: sourceDoc.id,
        content_markdown: updatedMarkdown,
      }),
    });
    const data = await res.json();
    if (res.ok && Array.isArray(data.nodes)) {
      setNodes(data.nodes);
      setLinks(data.links || []);
      setStatusBanner(`Linked mention inside "${sourceDoc.title}"`);
      setTimeout(() => setStatusBanner(null), 2400);
    }
  };

  // ─── 60 FPS Force-Directed Physics & Canvas Renderer ────────────────────────
  useEffect(() => {
    let rafId = 0;
    let frameCount = 0;
    let lastFpsStamp = performance.now();

    const renderFrame = (now: number) => {
      frameCount++;
      if (now - lastFpsStamp >= 1000) {
        setFpsDisplay(Math.min(60, Math.round((frameCount * 1000) / (now - lastFpsStamp))));
        frameCount = 0;
        lastFpsStamp = now;
      }

      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) {
        rafId = requestAnimationFrame(renderFrame);
        return;
      }

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = Math.max(300, Math.floor(rect.width));
      const height = Math.max(320, Math.floor(rect.height));

      if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        rafId = requestAnimationFrame(renderFrame);
        return;
      }

      // Smooth zoom interpolation
      const cam = cameraRef.current;
      cam.zoom += (cam.targetZoom - cam.zoom) * 0.16;

      // Active visible nodes for physics
      const visibleNodes = nodes.filter((n) => visibleNodeIds.has(n.id));
      const simMap = simNodesRef.current;
      const activeSimList: Array<{ data: VaultNode; sim: SimNode }> = [];
      for (const n of visibleNodes) {
        const s = simMap.get(n.id);
        if (s) activeSimList.push({ data: n, sim: s });
      }

      // 1. Coulomb Node Repulsion
      const repulsionStrength = 4200;
      for (let i = 0; i < activeSimList.length; i++) {
        for (let j = i + 1; j < activeSimList.length; j++) {
          const a = activeSimList[i].sim;
          const b = activeSimList[j].sim;
          let dx = b.x - a.x;
          let dy = b.y - a.y;
          const distSq = dx * dx + dy * dy + 140;
          const dist = Math.sqrt(distSq);
          const force = repulsionStrength / distSq;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          a.vx -= fx;
          a.vy -= fy;
          b.vx += fx;
          b.vy += fy;
        }
      }

      // 2. Hooke Link Spring Attraction
      const springK = 0.022;
      const restLength = 138;
      for (const link of links) {
        if (
          !visibleNodeIds.has(link.source_node_id) ||
          !visibleNodeIds.has(link.target_node_id)
        ) {
          continue;
        }
        const s = simMap.get(link.source_node_id);
        const t = simMap.get(link.target_node_id);
        if (!s || !t) continue;
        const dx = t.x - s.x;
        const dy = t.y - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const displacement = dist - restLength;
        const force = springK * displacement;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        s.vx += fx;
        s.vy += fy;
        t.vx -= fx;
        t.vy -= fy;
      }

      // 3. Domain Cluster Gravity + Soft Radial Containment
      const clusterOrbitRadius = 175;
      for (const { data, sim } of activeSimList) {
        if (
          dragStateRef.current.mode === "node" &&
          dragStateRef.current.nodeId === sim.id
        ) {
          sim.vx = 0;
          sim.vy = 0;
          continue;
        }

        if (clusterGravityOn) {
          const info = getDomainInfo(data.domain);
          const targetX = Math.cos(info.angle) * clusterOrbitRadius;
          const targetY = Math.sin(info.angle) * clusterOrbitRadius;
          sim.vx += (targetX - sim.x) * 0.0048;
          sim.vy += (targetY - sim.y) * 0.0048;
        } else {
          sim.vx += -sim.x * 0.0024;
          sim.vy += -sim.y * 0.0024;
        }

        // Gentle center gravity so orphan nodes stay gracefully framed
        sim.vx += -sim.x * 0.0012;
        sim.vy += -sim.y * 0.0012;

        // Damping & velocity clamp
        sim.vx *= 0.84;
        sim.vy *= 0.84;
        const maxV = 12;
        const speed = Math.hypot(sim.vx, sim.vy);
        if (speed > maxV) {
          sim.vx = (sim.vx / speed) * maxV;
          sim.vy = (sim.vy / speed) * maxV;
        }

        sim.x += sim.vx;
        sim.y += sim.vy;
      }

      // ─── Draw Canvas ────────────────────────────────────────────────────────
      ctx.save();
      ctx.scale(dpr, dpr);

      // Deep Obsidian Space Background
      const bgGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.45,
        20,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.75
      );
      bgGrad.addColorStop(0, "#111626");
      bgGrad.addColorStop(0.65, "#0a0d16");
      bgGrad.addColorStop(1, "#07090f");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle coordinate grid
      ctx.save();
      const gridStep = 48 * cam.zoom;
      if (gridStep >= 18) {
        const offsetX = ((width / 2 + cam.x * cam.zoom) % gridStep + gridStep) % gridStep;
        const offsetY = ((height / 2 + cam.y * cam.zoom) % gridStep + gridStep) % gridStep;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.026)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let gx = offsetX; gx < width; gx += gridStep) {
          ctx.moveTo(gx, 0);
          ctx.lineTo(gx, height);
        }
        for (let gy = offsetY; gy < height; gy += gridStep) {
          ctx.moveTo(0, gy);
          ctx.lineTo(width, gy);
        }
        ctx.stroke();
      }
      ctx.restore();

      // World Transform
      ctx.translate(width / 2 + cam.x * cam.zoom, height / 2 + cam.y * cam.zoom);
      ctx.scale(cam.zoom, cam.zoom);

      // Domain Cluster Nebulae (when clusterGravityOn)
      if (clusterGravityOn) {
        for (const [domKey, meta] of Object.entries(DOMAIN_META)) {
          if (domainFilter !== "all" && domainFilter !== domKey) continue;
          const cx = Math.cos(meta.angle) * clusterOrbitRadius;
          const cy = Math.sin(meta.angle) * clusterOrbitRadius;
          const neb = ctx.createRadialGradient(cx, cy, 8, cx, cy, 130);
          neb.addColorStop(0, meta.glow.replace("0.35", "0.11"));
          neb.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = neb;
          ctx.beginPath();
          ctx.arc(cx, cy, 130, 0, Math.PI * 2);
          ctx.fill();

          ctx.font = "600 9px ui-monospace, SFMono-Regular, Menlo, monospace";
          ctx.fillStyle = "rgba(255,255,255,0.22)";
          ctx.textAlign = "center";
          ctx.fillText(meta.label.toUpperCase(), cx, cy - 92);
        }
      }

      const hasSearch = searchQuery.trim().length > 0 && !regexError;
      const focusAnchorId = hoveredNode?.node.id || selectedId;

      // Neighbor lookup for highlighting connected branches
      const connectedToFocus = new Set<string>();
      if (focusAnchorId) {
        connectedToFocus.add(focusAnchorId);
        for (const l of links) {
          if (l.source_node_id === focusAnchorId) connectedToFocus.add(l.target_node_id);
          if (l.target_node_id === focusAnchorId) connectedToFocus.add(l.source_node_id);
        }
      }

      // Draw Links
      const pulsePhase = (now * 0.00055) % 1;
      for (const link of links) {
        if (
          !visibleNodeIds.has(link.source_node_id) ||
          !visibleNodeIds.has(link.target_node_id)
        ) {
          continue;
        }
        const s = simMap.get(link.source_node_id);
        const t = simMap.get(link.target_node_id);
        if (!s || !t) continue;

        const touchesSearch =
          hasSearch &&
          (searchMatchedIds.has(link.source_node_id) ||
            searchMatchedIds.has(link.target_node_id));
        const touchesFocus =
          focusAnchorId &&
          (link.source_node_id === focusAnchorId ||
            link.target_node_id === focusAnchorId);

        let alpha = 0.24;
        if (hasSearch) {
          alpha = touchesSearch ? 0.68 : 0.05;
        } else if (focusAnchorId) {
          alpha = touchesFocus ? 0.78 : 0.14;
        }

        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);
        ctx.strokeStyle = touchesFocus
          ? `rgba(196, 181, 253, ${alpha})`
          : `rgba(148, 163, 184, ${alpha})`;
        ctx.lineWidth = touchesFocus ? 1.8 : 1.0;
        ctx.stroke();

        // Directional photon pulse on active links
        if (touchesFocus) {
          const px = s.x + (t.x - s.x) * pulsePhase;
          const py = s.y + (t.y - s.y) * pulsePhase;
          ctx.beginPath();
          ctx.arc(px, py, 2.4, 0, Math.PI * 2);
          ctx.fillStyle = "#e9d5ff";
          ctx.fill();
        }
      }

      // Draw Nodes
      for (const { data, sim } of activeSimList) {
        const info = getDomainInfo(data.domain);
        const isSelected = data.id === selectedId;
        const isHovered = hoveredNode?.node.id === data.id;
        const isSearchMatch = hasSearch && searchMatchedIds.has(data.id);
        const deg = degreeMap.get(data.id)?.total ?? 0;

        let dimFactor = 1;
        if (hasSearch && !isSearchMatch) {
          dimFactor = 0.14;
        } else if (!hasSearch && focusAnchorId && !connectedToFocus.has(data.id)) {
          dimFactor = 0.42;
        }

        ctx.save();
        ctx.globalAlpha = dimFactor;

        // Outer halo for selected, hovered, or search-matched
        if (isSelected || isHovered || isSearchMatch) {
          const haloRadius = sim.radius + (isSearchMatch ? 14 : 10);
          const halo = ctx.createRadialGradient(
            sim.x,
            sim.y,
            sim.radius * 0.5,
            sim.x,
            sim.y,
            haloRadius
          );
          halo.addColorStop(0, isSearchMatch ? "rgba(250, 204, 21, 0.55)" : info.glow);
          halo.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(sim.x, sim.y, haloRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        // Orphan dashed ring indicator
        if (deg === 0) {
          ctx.save();
          ctx.setLineDash([3, 3]);
          ctx.strokeStyle = "rgba(251, 191, 36, 0.7)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(sim.x, sim.y, sim.radius + 4.5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // Core sphere
        ctx.beginPath();
        ctx.arc(sim.x, sim.y, sim.radius, 0, Math.PI * 2);
        ctx.fillStyle = info.color;
        ctx.fill();

        ctx.lineWidth = isSelected ? 2.6 : isHovered ? 2.0 : 1.2;
        ctx.strokeStyle = isSelected
          ? "#ffffff"
          : isSearchMatch
          ? "#fde047"
          : "rgba(15, 23, 42, 0.85)";
        ctx.stroke();

        // Inner specular dot for pinned nodes
        if (data.is_pinned) {
          ctx.beginPath();
          ctx.arc(sim.x, sim.y, 3.1, 0, Math.PI * 2);
          ctx.fillStyle = "#090b11";
          ctx.fill();
        }

        // Node Title Label
        if (cam.zoom >= 0.55 || isSelected || isHovered || isSearchMatch) {
          const shortTitle =
            data.title.length > 30 ? `${data.title.slice(0, 28)}…` : data.title;
          ctx.font = `${isSelected || isSearchMatch ? "700" : "500"} 11px Inter, system-ui, sans-serif`;
          ctx.textAlign = "center";
          ctx.fillStyle = isSearchMatch
            ? "#fef08a"
            : isSelected
            ? "#ffffff"
            : "rgba(226, 232, 240, 0.88)";
          ctx.fillText(shortTitle, sim.x, sim.y + sim.radius + 14);
        }

        ctx.restore();
      }

      ctx.restore();
      rafId = requestAnimationFrame(renderFrame);
    };

    rafId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(rafId);
  }, [
    nodes,
    links,
    visibleNodeIds,
    searchMatchedIds,
    searchQuery,
    regexError,
    selectedId,
    hoveredNode,
    clusterGravityOn,
    domainFilter,
    degreeMap,
  ]);

  // Coordinate helper: Screen -> World
  const screenToWorld = (clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { wx: 0, wy: 0, sx: 0, sy: 0 };
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    const cam = cameraRef.current;
    const wx = (sx - rect.width / 2) / cam.zoom - cam.x;
    const wy = (sy - rect.height / 2) / cam.zoom - cam.y;
    return { wx, wy, sx, sy };
  };

  const findHitNode = (wx: number, wy: number): VaultNode | null => {
    const visible = nodes.filter((n) => visibleNodeIds.has(n.id));
    for (let i = visible.length - 1; i >= 0; i--) {
      const n = visible[i];
      const s = simNodesRef.current.get(n.id);
      if (!s) continue;
      const dist = Math.hypot(wx - s.x, wy - s.y);
      if (dist <= s.radius + 6) return n;
    }
    return null;
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { wx, wy } = screenToWorld(e.clientX, e.clientY);
    const hit = findHitNode(wx, wy);
    if (hit) {
      dragStateRef.current = {
        mode: "node",
        nodeId: hit.id,
        startX: e.clientX,
        startY: e.clientY,
        camStartX: cameraRef.current.x,
        camStartY: cameraRef.current.y,
        moved: false,
      };
    } else {
      dragStateRef.current = {
        mode: "pan",
        nodeId: null,
        startX: e.clientX,
        startY: e.clientY,
        camStartX: cameraRef.current.x,
        camStartY: cameraRef.current.y,
        moved: false,
      };
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { wx, wy, sx, sy } = screenToWorld(e.clientX, e.clientY);
    const drag = dragStateRef.current;

    if (drag.mode === "node" && drag.nodeId) {
      const sim = simNodesRef.current.get(drag.nodeId);
      if (sim) {
        sim.x = wx;
        sim.y = wy;
        sim.vx = 0;
        sim.vy = 0;
      }
      if (Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > 4) {
        drag.moved = true;
      }
      setHoveredNode(null);
      return;
    }

    if (drag.mode === "pan") {
      const dx = (e.clientX - drag.startX) / cameraRef.current.zoom;
      const dy = (e.clientY - drag.startY) / cameraRef.current.zoom;
      cameraRef.current.x = drag.camStartX + dx;
      cameraRef.current.y = drag.camStartY + dy;
      if (Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > 4) {
        drag.moved = true;
      }
      return;
    }

    const hit = findHitNode(wx, wy);
    if (hit) {
      setHoveredNode({ node: hit, screenX: sx, screenY: sy });
    } else if (hoveredNode) {
      setHoveredNode(null);
    }
  };

  const handleCanvasMouseUp = () => {
    const drag = dragStateRef.current;
    if (drag.mode === "node" && drag.nodeId && !drag.moved) {
      setSelectedId(drag.nodeId);
    }
    dragStateRef.current = {
      mode: "none",
      nodeId: null,
      startX: 0,
      startY: 0,
      camStartX: 0,
      camStartY: 0,
      moved: false,
    };
  };

  const handleCanvasWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 0.89;
    cameraRef.current.targetZoom = Math.min(
      3.2,
      Math.max(0.35, cameraRef.current.targetZoom * factor)
    );
  };

  // Render Markdown with clickable [[Wikilink]] pills
  const renderRichMarkdownPreview = (markdown: string) => {
    const lines = markdown.split(/\r?\n/);
    const nodeByLower = new Map(
      nodes.map((n) => [n.title.trim().toLowerCase(), n])
    );

    const renderInlineWithWikilinks = (text: string, keyPrefix: string) => {
      const parts: React.ReactNode[] = [];
      const regex = /\[\[([^\[\]|]+)(?:\|([^\[\]]+))?\]\]/g;
      let lastIndex = 0;
      let m: RegExpExecArray | null;
      let idx = 0;
      while ((m = regex.exec(text)) !== null) {
        if (m.index > lastIndex) {
          parts.push(text.slice(lastIndex, m.index));
        }
        const targetTitle = m[1].trim();
        const displayLabel = (m[2] || m[1]).trim();
        const matchedTarget = nodeByLower.get(targetTitle.toLowerCase());
        const domInfo = matchedTarget
          ? getDomainInfo(matchedTarget.domain)
          : { color: "#a855f7" };

        parts.push(
          <button
            key={`${keyPrefix}-wl-${idx++}`}
            type="button"
            onClick={() => {
              if (matchedTarget) focusNodeOnCanvas(matchedTarget.id);
            }}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded-md text-xs font-semibold border transition-all hover:brightness-125"
            style={{
              color: domInfo.color,
              borderColor: `${domInfo.color}55`,
              backgroundColor: `${domInfo.color}18`,
            }}
            title={
              matchedTarget
                ? `Jump to "${matchedTarget.title}" (${matchedTarget.domain})`
                : `Unresolved wikilink — Save to auto-materialize "${targetTitle}"`
            }
          >
            <Link2 size={11} />
            {displayLabel}
          </button>
        );
        lastIndex = regex.lastIndex;
      }
      if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
      }
      return parts;
    };

    return (
      <div className="space-y-2.5 text-xs leading-relaxed text-zinc-300">
        {lines.map((line, i) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={i} className="h-1.5" />;
          if (trimmed.startsWith("# ")) {
            return (
              <h2 key={i} className="text-base font-bold text-white tracking-wide pt-1">
                {trimmed.slice(2)}
              </h2>
            );
          }
          if (trimmed.startsWith("## ")) {
            return (
              <h3
                key={i}
                className="text-xs font-bold uppercase tracking-[0.14em] text-violet-300 pt-2 border-t border-white/[0.06]"
              >
                {trimmed.slice(3)}
              </h3>
            );
          }
          if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
            return (
              <div key={i} className="flex items-start gap-2 pl-1">
                <span className="text-violet-400 mt-1">•</span>
                <span className="flex-1">
                  {renderInlineWithWikilinks(trimmed.slice(2), `li-${i}`)}
                </span>
              </div>
            );
          }
          if (trimmed.startsWith(">")) {
            return (
              <blockquote
                key={i}
                className="pl-3 py-1 border-l-2 border-amber-500/60 bg-amber-500/5 rounded-r text-amber-200/90 italic"
              >
                {renderInlineWithWikilinks(trimmed.replace(/^>\s*/, ""), `bq-${i}`)}
              </blockquote>
            );
          }
          return (
            <p key={i}>
              {renderInlineWithWikilinks(trimmed, `p-${i}`)}
            </p>
          );
        })}
      </div>
    );
  };

  const orphanCount = useMemo(
    () => nodes.filter((n) => (degreeMap.get(n.id)?.total ?? 0) === 0).length,
    [nodes, degreeMap]
  );

  return (
    <ExecutiveModuleShell
      moduleId="VAULT"
      eyebrow="Section 14 · Neural Knowledge Topology"
      title="The Neural Vault"
      subtitle="60 FPS Force-Directed Second Brain, [[Wikilink]] Edge Synthesis & Bi-Directional Backlink Inspector"
      accentColor="#a855f7"
      headerActions={
        <>
          {statusBanner && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
              <CheckCircle2 size={13} />
              {statusBanner}
            </div>
          )}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[11px] font-mono text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{fpsDisplay} FPS</span>
            <span className="text-zinc-600">|</span>
            <span>{nodes.length} NODES</span>
            <span className="text-zinc-600">|</span>
            <span>{links.length} LINKS</span>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold tracking-wider uppercase transition-all shadow-lg shadow-violet-600/25"
          >
            <Plus size={14} />
            New Vault Node
          </button>
        </>
      }
    >
      {/* Multi-Dimensional Filter & Search Command Bar */}
      <div className="p-4 rounded-2xl bg-[#0d111d]/90 border border-white/[0.08] backdrop-blur-xl flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        {/* Domain Cluster Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setDomainFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wider uppercase transition-all border ${
              domainFilter === "all"
                ? "bg-white/15 text-white border-white/30"
                : "bg-white/[0.03] text-zinc-400 border-white/[0.06] hover:text-zinc-200"
            }`}
          >
            All Domains ({nodes.length})
          </button>
          {Object.entries(DOMAIN_META).map(([key, meta]) => {
            const count = nodes.filter((n) => n.domain === key).length;
            const active = domainFilter === key;
            return (
              <button
                key={key}
                onClick={() => setDomainFilter(active ? "all" : key)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide transition-all border"
                style={{
                  backgroundColor: active ? `${meta.color}24` : "rgba(255,255,255,0.025)",
                  borderColor: active ? meta.color : "rgba(255,255,255,0.07)",
                  color: active ? "#ffffff" : "#a1a1aa",
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: meta.color }}
                />
                {meta.label}
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Tag + Orphan Status + Fuzzy/Regex Search */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tag selector */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/[0.08]">
            <Tag size={12} className="text-violet-400" />
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="bg-transparent text-xs text-zinc-200 focus:outline-none"
            >
              <option value="all" className="bg-[#0d111d]">
                All Tags ({allTags.length})
              </option>
              {allTags.map((t) => (
                <option key={t} value={t} className="bg-[#0d111d]">
                  #{t}
                </option>
              ))}
            </select>
          </div>

          {/* Orphan Status */}
          <div className="flex rounded-lg overflow-hidden border border-white/[0.08] bg-black/40 text-[11px]">
            {(
              [
                { id: "all", label: "All" },
                { id: "connected", label: "Linked" },
                { id: "orphan", label: `Orphans (${orphanCount})` },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                onClick={() => setOrphanFilter(opt.id)}
                className={`px-2.5 py-1.5 font-semibold transition-colors ${
                  orphanFilter === opt.id
                    ? "bg-amber-500/20 text-amber-300"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Fuzzy / Regex Search Bar */}
          <div className="relative flex items-center bg-black/50 border border-white/[0.1] rounded-lg overflow-hidden min-w-[250px] flex-1 sm:flex-initial">
            <Search size={13} className="ml-2.5 text-zinc-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                searchMode === "regex"
                  ? "Regex highlight e.g. (MNQ|solar|canine)"
                  : "Fuzzy highlight nodes & dim unrelated..."
              }
              className="bg-transparent px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none w-full"
            />
            <button
              type="button"
              onClick={() =>
                setSearchMode((m) => (m === "fuzzy" ? "regex" : "fuzzy"))
              }
              className={`px-2 py-1 mr-1 rounded text-[10px] font-mono font-bold uppercase border transition-colors ${
                searchMode === "regex"
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-violet-500/20 text-violet-300 border-violet-500/40"
              }`}
              title="Switch between Fuzzy and Regular Expression search"
            >
              {searchMode === "regex" ? "/.*/" : "FZY"}
            </button>
          </div>
        </div>
      </div>

      {regexError && (
        <div className="px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle size={14} />
          Regex syntax warning: {regexError}
        </div>
      )}

      {/* Main Split Architecture: 60 FPS Force Graph Canvas (Left) + Markdown Wikilink Editor & Backlink Inspector (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        {/* Left 7 Cols: Interactive Force-Directed Graph Canvas */}
        <div className="xl:col-span-7 flex flex-col gap-3">
          <div
            ref={containerRef}
            className="relative h-[620px] rounded-2xl overflow-hidden border border-white/[0.09] bg-[#080b12] shadow-2xl select-none"
          >
            <canvas
              ref={canvasRef}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={() => {
                handleCanvasMouseUp();
                setHoveredNode(null);
              }}
              onWheel={handleCanvasWheel}
              className="w-full h-full cursor-grab active:cursor-grabbing block"
            />

            {/* Floating Canvas Camera & Physics Controls */}
            <div className="absolute top-3.5 left-3.5 flex flex-wrap items-center gap-1.5 z-10">
              <button
                onClick={() => setClusterGravityOn((v) => !v)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold backdrop-blur-md border transition-all ${
                  clusterGravityOn
                    ? "bg-violet-500/20 border-violet-400/40 text-violet-200"
                    : "bg-black/60 border-white/10 text-zinc-400"
                }`}
                title="Toggle 5-Domain Orbital Cluster Gravity"
              >
                <Orbit size={13} />
                Cluster Gravity: {clusterGravityOn ? "ON" : "OFF"}
              </button>
              <button
                onClick={() => {
                  cameraRef.current.x = 0;
                  cameraRef.current.y = 0;
                  cameraRef.current.targetZoom = 1;
                }}
                className="p-1.5 rounded-lg bg-black/60 hover:bg-white/10 border border-white/10 text-zinc-300 backdrop-blur-md"
                title="Recenter Graph Camera"
              >
                <LocateFixed size={14} />
              </button>
              <button
                onClick={() => {
                  cameraRef.current.targetZoom = Math.min(
                    3.2,
                    cameraRef.current.targetZoom * 1.22
                  );
                }}
                className="p-1.5 rounded-lg bg-black/60 hover:bg-white/10 border border-white/10 text-zinc-300 backdrop-blur-md"
                title="Zoom In"
              >
                <ZoomIn size={14} />
              </button>
              <button
                onClick={() => {
                  cameraRef.current.targetZoom = Math.max(
                    0.35,
                    cameraRef.current.targetZoom * 0.82
                  );
                }}
                className="p-1.5 rounded-lg bg-black/60 hover:bg-white/10 border border-white/10 text-zinc-300 backdrop-blur-md"
                title="Zoom Out"
              >
                <ZoomOut size={14} />
              </button>
              <button
                onClick={() => loadVault(true)}
                className="p-1.5 rounded-lg bg-black/60 hover:bg-white/10 border border-white/10 text-zinc-300 backdrop-blur-md"
                title="Refresh Graph from Supabase PostgreSQL"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              </button>
            </div>

            {/* Search Match Telemetry Pill */}
            {searchQuery.trim() && !regexError && (
              <div className="absolute top-3.5 right-3.5 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-400/40 backdrop-blur-md text-amber-200 text-xs font-semibold z-10">
                Highlighting {searchMatchedIds.size} matching{" "}
                {searchMatchedIds.size === 1 ? "node" : "nodes"}
              </div>
            )}

            {/* Instant Floating Glass Hover Preview Card */}
            {hoveredNode && (
              <div
                className="pointer-events-none absolute z-20 w-72 p-3.5 rounded-xl bg-[#0e1322]/90 backdrop-blur-xl border border-white/15 shadow-2xl transition-opacity duration-75"
                style={{
                  left: Math.min(
                    Math.max(12, hoveredNode.screenX + 16),
                    (containerRef.current?.clientWidth || 600) - 300
                  ),
                  top: Math.min(
                    Math.max(12, hoveredNode.screenY - 24),
                    (containerRef.current?.clientHeight || 560) - 165
                  ),
                }}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: `${getDomainInfo(hoveredNode.node.domain).color}22`,
                      color: getDomainInfo(hoveredNode.node.domain).color,
                      border: `1px solid ${getDomainInfo(hoveredNode.node.domain).color}55`,
                    }}
                  >
                    {getDomainInfo(hoveredNode.node.domain).label}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">
                    {degreeMap.get(hoveredNode.node.id)?.out ?? 0} out ·{" "}
                    {degreeMap.get(hoveredNode.node.id)?.in ?? 0} backlinks
                  </span>
                </div>
                <div className="text-xs font-bold text-white leading-snug mb-1">
                  {hoveredNode.node.title}
                </div>
                <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                  {stripMarkdownPreview(hoveredNode.node.content_markdown) ||
                    "Empty vault note."}
                </p>
                {(hoveredNode.node.tags || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {hoveredNode.node.tags.slice(0, 4).map((t) => (
                      <span
                        key={t}
                        className="px-1.5 py-0.5 rounded bg-white/[0.06] text-[9.5px] font-mono text-zinc-300"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Bottom Legend Overlay */}
            <div className="absolute bottom-3 left-3.5 right-3.5 flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-black/55 backdrop-blur-md border border-white/[0.07] text-[10.5px] text-zinc-400">
              <div className="flex flex-wrap items-center gap-3">
                {Object.entries(DOMAIN_META).map(([k, m]) => (
                  <span key={k} className="inline-flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: m.color }}
                    />
                    {m.label}
                  </span>
                ))}
                <span className="inline-flex items-center gap-1.5 text-amber-300/90">
                  <span className="w-2.5 h-2.5 rounded-full border border-dashed border-amber-400" />
                  Orphan (0 links)
                </span>
              </div>
              <span className="font-mono text-[10px] text-zinc-500">
                Drag node = spring physics · Scroll = zoom · Click = inspect
              </span>
            </div>
          </div>

          {/* Quick Vault Node Directory Strip */}
          <div className="p-3.5 rounded-2xl bg-[#0d111d]/85 border border-white/[0.07]">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400 mb-2.5 flex items-center justify-between">
              <span>Filtered Vault Index ({visibleNodeIds.size})</span>
              <span className="text-zinc-500 font-mono">Click any pill to center camera</span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
              {nodes
                .filter((n) => visibleNodeIds.has(n.id))
                .map((n) => {
                  const info = getDomainInfo(n.domain);
                  const active = n.id === selectedId;
                  const deg = degreeMap.get(n.id)?.total ?? 0;
                  return (
                    <button
                      key={n.id}
                      onClick={() => focusNodeOnCanvas(n.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] border transition-all ${
                        active
                          ? "bg-white/15 border-white/40 text-white font-bold"
                          : "bg-white/[0.03] border-white/[0.06] text-zinc-300 hover:bg-white/[0.08]"
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: info.color }}
                      />
                      <span className="truncate max-w-[180px]">{n.title}</span>
                      <span className="text-[9.5px] font-mono text-zinc-500">
                        [{deg}]
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Split Markdown [[Wikilink]] Editor & Bi-Directional Backlink Inspector */}
        <div className="xl:col-span-5 flex flex-col gap-4">
          {selectedNode ? (
            <>
              {/* Document Editor Card */}
              <div className="p-5 rounded-2xl bg-[#0d111d]/95 border border-white/[0.09] flex flex-col gap-3.5 shadow-xl">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => {
                        setEditTitle(e.target.value);
                        setIsDirty(true);
                      }}
                      className="w-full bg-transparent text-base font-bold text-white focus:outline-none border-b border-transparent focus:border-violet-500/50 pb-0.5"
                      placeholder="Document Title..."
                    />
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <select
                        value={editDomain}
                        onChange={(e) => {
                          setEditDomain(e.target.value);
                          setIsDirty(true);
                        }}
                        className="px-2.5 py-1 rounded-md bg-black/50 border border-white/10 text-[11px] font-semibold text-zinc-200 focus:outline-none"
                      >
                        {Object.entries(DOMAIN_META).map(([k, m]) => (
                          <option key={k} value={k} className="bg-[#0d111d]">
                            {m.label}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => {
                          setEditPinned((p) => !p);
                          setIsDirty(true);
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
                          editPinned
                            ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                            : "bg-white/[0.03] border-white/10 text-zinc-400"
                        }`}
                      >
                        <Pin size={11} />
                        {editPinned ? "Pinned" : "Pin"}
                      </button>

                      <input
                        type="text"
                        value={editTagsInput}
                        onChange={(e) => {
                          setEditTagsInput(e.target.value);
                          setIsDirty(true);
                        }}
                        placeholder="tags, comma, separated"
                        className="flex-1 min-w-[130px] px-2.5 py-1 rounded-md bg-black/40 border border-white/10 text-[11px] font-mono text-zinc-300 focus:outline-none focus:border-violet-500/50"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={handleSaveNode}
                      disabled={saving}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all ${
                        isDirty
                          ? "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/30"
                          : "bg-white/10 hover:bg-white/15 text-zinc-200"
                      }`}
                      title="Save & Re-index [[Wikilinks]] (Ctrl+S)"
                    >
                      <Save size={13} />
                      {saving ? "Syncing..." : isDirty ? "Save*" : "Saved"}
                    </button>
                    <button
                      onClick={handleDeleteNode}
                      disabled={saving}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/25 text-rose-400 transition-colors"
                      title="Delete Vault Node"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Editor Mode Switcher + Quick [[Wikilink]] Injector */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/[0.06]">
                  <div className="flex rounded-lg overflow-hidden border border-white/10 bg-black/40 text-[11px]">
                    {(
                      [
                        { id: "write", label: "Markdown", icon: <Edit3 size={11} /> },
                        { id: "split", label: "Split", icon: <Columns size={11} /> },
                        { id: "preview", label: "Preview", icon: <Eye size={11} /> },
                      ] as const
                    ).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setEditorMode(m.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 font-semibold transition-colors ${
                          editorMode === m.id
                            ? "bg-violet-500/25 text-violet-200"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        {m.icon}
                        {m.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-zinc-500">
                      Insert [[Wikilink]]:
                    </span>
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          insertWikilinkAtCursor(e.target.value);
                        }
                      }}
                      className="px-2 py-1 rounded bg-violet-500/15 border border-violet-500/30 text-[11px] text-violet-200 focus:outline-none max-w-[170px]"
                    >
                      <option value="" className="bg-[#0d111d]">
                        + Link target node...
                      </option>
                      {nodes
                        .filter((n) => n.id !== selectedNode.id)
                        .map((n) => (
                          <option key={n.id} value={n.title} className="bg-[#0d111d]">
                            [[{n.title}]]
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Split / Write / Preview Body */}
                <div
                  className={`grid gap-3 ${
                    editorMode === "split" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
                  }`}
                >
                  {(editorMode === "write" || editorMode === "split") && (
                    <textarea
                      ref={textareaRef}
                      value={editContent}
                      onChange={(e) => {
                        setEditContent(e.target.value);
                        setIsDirty(true);
                      }}
                      rows={12}
                      placeholder="Write sovereign notes using [[Target Node Title]] to forge live physics graph links..."
                      className="w-full p-3 rounded-xl bg-[#070a11] border border-white/[0.08] focus:border-violet-500/50 focus:outline-none font-mono text-xs leading-relaxed text-zinc-200 resize-y"
                    />
                  )}

                  {(editorMode === "preview" || editorMode === "split") && (
                    <div className="p-3.5 rounded-xl bg-[#080c15] border border-white/[0.07] max-h-[290px] overflow-y-auto">
                      {renderRichMarkdownPreview(editContent)}
                    </div>
                  )}
                </div>
              </div>

              {/* Bi-Directional Backlinks Inspector */}
              <div className="p-5 rounded-2xl bg-[#0d111d]/95 border border-white/[0.09] flex flex-col gap-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Network size={15} className="text-violet-400" />
                    <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-100">
                      Bi-Directional Backlinks Inspector
                    </h3>
                  </div>
                  <span className="text-[10.5px] font-mono text-zinc-400">
                    {inboundBacklinks.length} inbound · {outboundLinks.length} outbound
                  </span>
                </div>

                {/* Inbound Backlinks (Referenced By) */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-400 flex items-center gap-1.5">
                    <ArrowDownLeft size={12} />
                    Referenced By ({inboundBacklinks.length} Documents)
                  </div>
                  {inboundBacklinks.length === 0 ? (
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-xs text-zinc-500">
                      No inbound backlinks yet. Reference{" "}
                      <code className="text-violet-300">
                        [[{selectedNode.title}]]
                      </code>{" "}
                      inside another note to materialize an edge.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {inboundBacklinks.map(({ node: src, excerpt }) => {
                        const info = getDomainInfo(src.domain);
                        return (
                          <div
                            key={src.id}
                            onClick={() => focusNodeOnCanvas(src.id)}
                            className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] cursor-pointer transition-all group"
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-xs font-bold text-white group-hover:text-violet-300 transition-colors flex items-center gap-1.5">
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: info.color }}
                                />
                                {src.title}
                              </span>
                              <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                                {info.label}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-400 leading-relaxed font-mono bg-black/30 p-2 rounded-lg border border-white/[0.04]">
                              “{excerpt}”
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Outbound Wikilinks */}
                <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                  <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-sky-400 flex items-center gap-1.5">
                    <ArrowUpRight size={12} />
                    Outbound Connections ({outboundLinks.length})
                  </div>
                  {outboundLinks.length === 0 ? (
                    <div className="text-xs text-zinc-500">
                      No outbound <code className="text-sky-300">[[Wikilinks]]</code> in
                      this note.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {outboundLinks.map(({ node: tgt, excerpt }) => {
                        const info = getDomainInfo(tgt.domain);
                        return (
                          <button
                            key={tgt.id}
                            type="button"
                            onClick={() => focusNodeOnCanvas(tgt.id)}
                            className="text-left p-2.5 rounded-xl bg-white/[0.025] hover:bg-white/[0.06] border border-white/[0.07] transition-all"
                          >
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-100 truncate">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: info.color }}
                              />
                              <span className="truncate">{tgt.title}</span>
                            </div>
                            <div className="text-[10.5px] text-zinc-500 line-clamp-1 mt-1">
                              {excerpt}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Unlinked Mentions Detector */}
                {unlinkedMentions.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                    <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-400 flex items-center gap-1.5">
                      <Sparkles size={12} />
                      Implicit Unlinked Mentions ({unlinkedMentions.length})
                    </div>
                    {unlinkedMentions.map(({ node: uNode, excerpt }) => (
                      <div
                        key={uNode.id}
                        className="p-2.5 rounded-xl bg-amber-500/[0.05] border border-amber-500/20 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-amber-200 truncate">
                            {uNode.title}
                          </div>
                          <div className="text-[10.5px] text-zinc-400 truncate">
                            {excerpt}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => convertUnlinkedMention(uNode)}
                          className="shrink-0 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400/40 text-[10.5px] font-bold text-amber-200"
                        >
                          Link [[...]]
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-8 rounded-2xl bg-[#0d111d]/80 border border-white/[0.08] text-center text-zinc-400 text-sm">
              {loading
                ? "Synchronizing Neural Vault graph from PostgreSQL..."
                : "Select any node on the force-directed graph to inspect & edit."}
            </div>
          )}
        </div>
      </div>

      {/* Create New Vault Node Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#0e1320] border border-white/15 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-white">
                Materialize New Vault Node
              </h2>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                ESC
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10.5px] uppercase tracking-wider text-zinc-400 mb-1">
                  Node Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Autonomous Yard RFID Sensor Spec"
                  className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/15 text-xs text-white focus:outline-none focus:border-violet-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[10.5px] uppercase tracking-wider text-zinc-400 mb-1">
                  Domain Cluster
                </label>
                <select
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/15 text-xs text-white focus:outline-none"
                >
                  {Object.entries(DOMAIN_META).map(([k, m]) => (
                    <option key={k} value={k} className="bg-[#0e1320]">
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10.5px] uppercase tracking-wider text-zinc-400 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/15 text-xs font-mono text-zinc-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-zinc-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNode}
                disabled={!newTitle.trim() || saving}
                className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-xs font-bold uppercase tracking-wider text-white"
              >
                {saving ? "Creating..." : "Create & Link"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ExecutiveModuleShell>
  );
}
