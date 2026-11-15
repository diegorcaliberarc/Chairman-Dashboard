import { Node, Edge } from "@xyflow/react";

export function getAutoLayoutedNodes(
  nodes: Node[],
  edges: Edge[],
  direction: "TB" | "LR" = "TB"
): Node[] {
  if (nodes.length === 0) return [];

  // 1. Build adjacency & in-degree maps
  const inDegree: Record<string, number> = {};
  const childrenMap: Record<string, string[]> = {};

  nodes.forEach((n) => {
    inDegree[n.id] = 0;
    childrenMap[n.id] = [];
  });

  edges.forEach((e) => {
    if (inDegree[e.target] !== undefined) {
      inDegree[e.target] += 1;
    }
    if (childrenMap[e.source]) {
      childrenMap[e.source].push(e.target);
    }
  });

  // 2. Assign depth level using BFS from roots
  const levels: Record<string, number> = {};
  const queue: { id: string; depth: number }[] = [];

  // Nodes with 0 in-degree are roots
  nodes.forEach((n) => {
    if ((inDegree[n.id] ?? 0) === 0) {
      queue.push({ id: n.id, depth: 0 });
      levels[n.id] = 0;
    }
  });

  // If cyclic or no 0 in-degree found, pick first node as root
  if (queue.length === 0 && nodes.length > 0) {
    queue.push({ id: nodes[0].id, depth: 0 });
    levels[nodes[0].id] = 0;
  }

  const visited = new Set<string>();

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);

    const children = childrenMap[id] || [];
    children.forEach((childId) => {
      const nextDepth = depth + 1;
      if (levels[childId] === undefined || levels[childId] < nextDepth) {
        levels[childId] = nextDepth;
      }
      queue.push({ id: childId, depth: nextDepth });
    });
  }

  // Any unvisited nodes (disconnected islands)
  nodes.forEach((n) => {
    if (levels[n.id] === undefined) {
      levels[n.id] = 1;
    }
  });

  // 3. Group nodes by level
  const levelGroups: Record<number, Node[]> = {};
  nodes.forEach((n) => {
    const lvl = levels[n.id] ?? 0;
    if (!levelGroups[lvl]) levelGroups[lvl] = [];
    levelGroups[lvl].push(n);
  });

  // 4. Calculate X, Y positions based on layout direction
  const nodeWidth = 280;
  const nodeHeight = 150;
  const gapX = 60;
  const gapY = 120;

  const layoutedNodes: Node[] = [];

  Object.entries(levelGroups).forEach(([levelStr, groupNodes]) => {
    const level = parseInt(levelStr, 10);
    const count = groupNodes.length;

    if (direction === "TB") {
      const totalWidth = count * nodeWidth + (count - 1) * gapX;
      const startX = -totalWidth / 2 + nodeWidth / 2 + 500;
      const posY = level * (nodeHeight + gapY) + 50;

      groupNodes.forEach((node, idx) => {
        const posX = startX + idx * (nodeWidth + gapX);
        layoutedNodes.push({
          ...node,
          position: { x: posX, y: posY },
        });
      });
    } else {
      // LR: Left to Right
      const totalHeight = count * nodeHeight + (count - 1) * gapY;
      const startY = -totalHeight / 2 + nodeHeight / 2 + 300;
      const posX = level * (nodeWidth + gapX * 1.5) + 50;

      groupNodes.forEach((node, idx) => {
        const posY = startY + idx * (nodeHeight + gapY);
        layoutedNodes.push({
          ...node,
          position: { x: posX, y: posY },
        });
      });
    }
  });

  return layoutedNodes;
}
