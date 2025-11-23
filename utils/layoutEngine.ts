import dagre from 'dagre';
import { DiagramNode, DiagramEdge, DiagramData } from '../types';

export const layoutDiagram = (nodes: DiagramNode[], edges: DiagramEdge[]): DiagramData => {
  const g = new dagre.graphlib.Graph();

  // Set an object for the graph label
  g.setGraph({
      rankdir: 'TB', // Top to Bottom layout
      marginx: 50,
      marginy: 50,
      nodesep: 70, // Horizontal separation between nodes
      ranksep: 100 // Vertical separation between ranks
  });

  // Default to assigning a new object label for each edge.
  g.setDefaultEdgeLabel(function() { return {}; });

  // Add nodes to the graph. The first argument is the node id. The second is
  // metadata about the node. In this case we're going to add labels to each of
  // our nodes.
  nodes.forEach(node => {
    g.setNode(node.id, {
        label: node.text,
        width: node.width,
        height: node.height
    });
  });

  // Add edges to the graph.
  edges.forEach(edge => {
    g.setEdge(edge.fromId, edge.toId);
  });

  // Compute layout
  dagre.layout(g);

  // Update nodes with calculated coordinates
  const layoutedNodes = nodes.map(node => {
    const nodeWithPos = g.node(node.id);
    return {
      ...node,
      x: nodeWithPos.x,
      y: nodeWithPos.y
    };
  });

  // (Optional) We could also update edge points if we wanted complex paths,
  // but for now our RoughEdge calculates straight lines from centers.

  // Calculate center of the graph to center it in the view (optional optimization)
  // For now, dagre gives coords relative to 0,0 (top left of graph).

  return {
    nodes: layoutedNodes,
    edges: edges,
    type: 'flowchart' // Defaulting to flowchart structure for auto-layout
  };
};
