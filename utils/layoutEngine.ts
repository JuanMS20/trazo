import dagre from 'dagre';
import { DiagramNode, DiagramEdge, DiagramData } from '../types';

export const layoutDiagram = (nodes: DiagramNode[], edges: DiagramEdge[]): DiagramData => {
  const g = new dagre.graphlib.Graph();

  // Set an object for the graph label
  g.setGraph({
      rankdir: 'TB', // Top to Bottom layout
      align: 'DL',   // Alignment
      marginx: 50,
      marginy: 50,
      nodesep: 80, // Horizontal separation between nodes (increased)
      ranksep: 120 // Vertical separation between ranks (increased)
  });

  g.setDefaultEdgeLabel(function() { return {}; });

  // Add nodes to the graph with calculated dimensions if not present
  nodes.forEach(node => {
    // Heuristic for width/height based on text length if not manually set adequately
    const charCount = node.text.length + (node.description?.length || 0) * 0.8;
    const estimatedWidth = Math.max(160, charCount * 7); // Min width 160
    const estimatedHeight = Math.max(80, (charCount / 20) * 20 + 60); // Wrap approx

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

  // Determine graph bounds to help centering
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  const layoutedNodes = nodes.map(node => {
    const nodeWithPos = g.node(node.id);

    // Dagre gives center coordinates
    const x = nodeWithPos.x;
    const y = nodeWithPos.y;

    minX = Math.min(minX, x - node.width / 2);
    minY = Math.min(minY, y - node.height / 2);
    maxX = Math.max(maxX, x + node.width / 2);
    maxY = Math.max(maxY, y + node.height / 2);

    return {
      ...node,
      x: x,
      y: y
    };
  });

  // We can return the bounding box or center offset if needed,
  // but for now we just return the layouted nodes.
  // The Canvas component should handle the "center on screen" logic
  // by calculating the difference between the canvas center and the graph center.

  return {
    nodes: layoutedNodes,
    edges: edges,
    type: 'flowchart'
  };
};
