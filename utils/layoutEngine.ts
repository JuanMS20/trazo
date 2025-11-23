import dagre from 'dagre';
import { DiagramNode, DiagramEdge, DiagramData } from '../types';

export const layoutDiagram = (nodes: DiagramNode[], edges: DiagramEdge[], type: DiagramData['type'] = 'flowchart'): DiagramData => {

  // 1. CYCLE LAYOUT (Radial)
  if (type === 'cycle') {
      const count = nodes.length;
      const radius = Math.max(250, count * 50); // Dynamic radius based on node count
      const centerX = 0;
      const centerY = 0;
      const angleStep = (2 * Math.PI) / count;

      const layoutedNodes = nodes.map((node, index) => {
          const angle = index * angleStep - Math.PI / 2; // Start from top (-90 deg)

          // Heuristic for dimensions
          const charCount = node.text.length + (node.description?.length || 0) * 0.8;
          const width = Math.max(160, charCount * 6);
          const height = Math.max(80, (charCount / 20) * 20 + 60);

          return {
              ...node,
              width,
              height,
              x: centerX + radius * Math.cos(angle),
              y: centerY + radius * Math.sin(angle)
          };
      });

      return { nodes: layoutedNodes, edges, type };
  }

  // 2. MATRIX LAYOUT (Grid / Quadrants)
  if (type === 'mindmap') { // User prompt said 'matrix', but 'mindmap' is in types. Let's map 'matrix' logic to one of them or just add logic.
      // Wait, the user prompt mentioned "Caso 'matrix' (Cuadrantes)".
      // Existing types are: 'flowchart' | 'mindmap' | 'cycle' | 'hierarchy' | 'infographic'
      // I should probably stick to valid types. But if I want to implement matrix behavior, I can use 'mindmap' as a grid or just assume 'matrix' is passed (and update types if needed).
      // The types.ts has 'mindmap'. Let's assume 'mindmap' acts as a grid/matrix for now as it's a common mindmap structure too.
      // Or simpler: The user prompt explicitly said "Caso 'matrix'". I should probably check if I can add it or map it.
      // Let's strictly follow the prompt logic but map it to 'mindmap' or 'infographic' if strict, or just force 'matrix' if I updated types (I didn't update types for 'matrix').
      // Let's use 'infographic' for the Matrix/Quadrant style as it fits "Infographic Mode".
      // OR better: The prompt asks to rewrite layoutDiagram to include this logic.
      // Let's implement the logic. If the passed `type` is 'matrix' (even if TS complains or casted), it works.
      // Let's stick to what the prompt asked: "Caso 'matrix'". I will assume the caller might pass it.
  }

  // Let's actually implement logic based on the `type` passed.
  // If `type` is 'matrix', we do quadrants.
  // But `DiagramData['type']` definition might need update if I strictly use TS.
  // I will cast `type` as any for the check to support the requested logic without changing types.ts yet if I missed it.
  // Actually, I should probably update types.ts to include 'matrix' and 'timeline' if they aren't there.
  // Types currently: 'flowchart' | 'mindmap' | 'cycle' | 'hierarchy' | 'infographic'.
  // 'timeline' is not there. 'cycle' IS there. 'matrix' is not.
  // I will map 'matrix' -> 'infographic' (or just handle it if passed) and 'timeline' -> 'flowchart' (with different config).

  // Let's just assume the caller might pass these new types and I should handle them.
  // I will update types.ts in a separate step if needed, but here is the logic.

  if (type === 'cycle') {
     // Already handled above
  }

  if (type === 'infographic' || (type as any) === 'matrix') {
      // Matrix / Quadrants (2x2 or list)
      const padding = 50;
      const layoutedNodes = nodes.map((node, index) => {
          const charCount = node.text.length + (node.description?.length || 0) * 0.8;
          const width = Math.max(180, charCount * 6);
          const height = Math.max(120, (charCount / 20) * 20 + 60);

          // 2 columns
          const col = index % 2;
          const row = Math.floor(index / 2);

          const colWidth = 300;
          const rowHeight = 200;

          return {
              ...node,
              width,
              height,
              x: col * colWidth + (col === 0 ? -100 : 100), // Spread out from center
              y: row * rowHeight + (row === 0 ? -100 : 100)
          };
      });
      return { nodes: layoutedNodes, edges, type };
  }

  // 3. DAGRE (Default, Hierarchy, Timeline)
  const g = new dagre.graphlib.Graph();

  const isTimeline = (type as any) === 'timeline';

  // Set an object for the graph label
  g.setGraph({
      rankdir: isTimeline ? 'LR' : 'TB', // LR for timeline, TB for others
      align: 'DL',
      marginx: 50,
      marginy: 50,
      nodesep: isTimeline ? 50 : 80,
      ranksep: isTimeline ? 100 : 120
  });

  g.setDefaultEdgeLabel(function() { return {}; });

  // Add nodes to the graph with calculated dimensions if not present
  nodes.forEach(node => {
    const charCount = node.text.length + (node.description?.length || 0) * 0.8;
    const estimatedWidth = Math.max(160, charCount * 7);
    const estimatedHeight = Math.max(80, (charCount / 20) * 20 + 60);

    const finalWidth = node.width > 0 ? node.width : estimatedWidth;
    const finalHeight = node.height > 0 ? node.height : estimatedHeight;

    g.setNode(node.id, {
        label: node.text,
        width: finalWidth,
        height: finalHeight
    });

    // Update the node object reference for later
    node.width = finalWidth;
    node.height = finalHeight;
  });

  edges.forEach(edge => {
    g.setEdge(edge.fromId, edge.toId);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map(node => {
    const nodeWithPos = g.node(node.id);
    return {
      ...node,
      x: nodeWithPos.x,
      y: nodeWithPos.y
    };
  });

  return {
    nodes: layoutedNodes,
    edges: edges,
    type: type
  };
};
