import dagre from 'dagre';
import * as d3 from 'd3-force';
import { DiagramNode, DiagramEdge, DiagramData } from '../../types';

// Helper to estimate dimensions based on text
const estimateDimensions = (node: DiagramNode) => {
    if (node.width > 0 && node.height > 0) {
        return { width: node.width, height: node.height };
    }

    // More robust estimation
    // Assumes ~10px average char width for font size 18-24px
    const baseWidth = 140;
    const baseHeight = 80;
    const charWidth = 9;
    const lineHeight = 24;

    const lines = Math.ceil(node.text.length / 20); // Wrap approx every 20 chars
    const maxLineLength = Math.min(node.text.length, 20);

    const textWidth = maxLineLength * charWidth;
    const textHeight = lines * lineHeight;

    // Add padding
    const width = Math.max(baseWidth, textWidth + 40);
    const height = Math.max(baseHeight, textHeight + 50 + (node.description ? 30 : 0)); // Add extra for description

    return { width, height };
};

const layoutForceDirected = (nodes: DiagramNode[], edges: DiagramEdge[], type: DiagramData['type']): DiagramData => {
    // 1. Prepare nodes with dimensions
    const simNodes = nodes.map(node => {
        const { width, height } = estimateDimensions(node);
        return {
            ...node,
            width,
            height,
            x: 0,
            y: 0,
            vx: 0,
            vy: 0
        };
    });

    const simLinks = edges.map(edge => ({
        source: edge.fromId,
        target: edge.toId,
        id: edge.id
    }));

    // 2. Setup Simulation
    const simulation = d3.forceSimulation(simNodes as any)
        .force("link", d3.forceLink(simLinks).id((d: any) => d.id).distance(180))
        .force("charge", d3.forceManyBody().strength(-800)) // Repulsion
        .force("center", d3.forceCenter(0, 0))
        .force("collision", d3.forceCollide().radius((d: any) => Math.max(d.width, d.height) / 1.2).iterations(3))
        .stop(); // Don't run automatically

    // 3. Run Simulation synchronously
    // 300 iterations is usually enough for settling small to medium graphs
    simulation.tick(300);

    // 4. Extract positions
    const finalNodes = simNodes.map(n => ({
        ...n,
        // d3 simulation updates x and y on the node objects
        x: n.x || 0,
        y: n.y || 0
    }));

    return {
        nodes: finalNodes,
        edges,
        type
    };
};

export const layoutDiagram = (nodes: DiagramNode[], edges: DiagramEdge[], type: DiagramData['type'] = 'flowchart'): DiagramData => {

  // 1. FORCE DIRECTED (Mindmap, Network)
  if (type === 'mindmap' || (type as any) === 'network') {
      return layoutForceDirected(nodes, edges, type);
  }

  // 2. CYCLE LAYOUT (Radial)
  if (type === 'cycle') {
      const count = nodes.length;
      const radius = Math.max(250, count * 60); // Dynamic radius based on node count
      const centerX = 0;
      const centerY = 0;
      const angleStep = (2 * Math.PI) / count;

      const layoutedNodes = nodes.map((node, index) => {
          const angle = index * angleStep - Math.PI / 2; // Start from top (-90 deg)

          const { width, height } = estimateDimensions(node);

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

  // 3. MATRIX LAYOUT (Grid / Quadrants)
  if (type === 'infographic' || (type as any) === 'matrix') {
      // Matrix / Quadrants (2x2 or list)
      const layoutedNodes = nodes.map((node, index) => {
          const { width, height } = estimateDimensions(node);

          // 2 columns
          const col = index % 2;
          const row = Math.floor(index / 2);

          const colWidth = 320;
          const rowHeight = 220;

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

  // 4. DAGRE (Default, Hierarchy, Timeline, Flowchart)
  const g = new dagre.graphlib.Graph();

  const isTimeline = (type as any) === 'timeline';

  // Set an object for the graph label
  g.setGraph({
      rankdir: isTimeline ? 'LR' : 'TB', // LR for timeline, TB for others
      align: 'DL',
      marginx: 50,
      marginy: 50,
      nodesep: isTimeline ? 60 : 100,
      ranksep: isTimeline ? 120 : 140
  });

  g.setDefaultEdgeLabel(function() { return {}; });

  // Add nodes to the graph with calculated dimensions if not present
  nodes.forEach(node => {
    const { width, height } = estimateDimensions(node);

    g.setNode(node.id, {
        label: node.text,
        width,
        height
    });

    // Update the node object reference for later
    node.width = width;
    node.height = height;
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
