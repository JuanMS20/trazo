import { DiagramData, DiagramNode, DiagramEdge } from '../types';

const COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD'];

export const generateDiagramFromText = (text: string, type: DiagramData['type'] = 'flowchart'): DiagramData => {
  // Basic NLP simulation: split by sentences or key phrases
  const phrases = text
    .split(/[.,\n]/)
    .map(s => s.trim())
    .filter(s => s.length > 5 && s.length < 50) // Filter too short or too long
    .slice(0, 8); // Limit nodes

  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];

  if (phrases.length === 0) {
    phrases.push("Idea Principal", "Concepto A", "Concepto B");
  }

  const centerX = 400;
  const centerY = 300;

  switch (type) {
    case 'mindmap':
      // Central node
      nodes.push({
        id: 'root',
        text: phrases[0] || 'Tema Central',
        x: centerX,
        y: centerY,
        width: 140,
        height: 60,
        type: 'ellipse',
        color: '#FDE68A'
      });

      // Radial nodes
      phrases.slice(1).forEach((phrase, i) => {
        const angle = (i / (phrases.length - 1)) * 2 * Math.PI;
        const radius = 200;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        const id = `node-${i}`;

        nodes.push({
            id,
            text: phrase,
            x,
            y,
            width: 120,
            height: 50,
            type: 'rectangle',
            color: 'white'
        });

        edges.push({
            id: `edge-${i}`,
            fromId: 'root',
            toId: id
        });
      });
      break;

    case 'flowchart':
    case 'hierarchy': // Simplification: hierarchy acts similar to flowchart top-down here for demo
      let currentY = 100;
      phrases.forEach((phrase, i) => {
        const id = `node-${i}`;
        nodes.push({
            id,
            text: phrase,
            x: centerX,
            y: currentY,
            width: 160,
            height: 60,
            type: i === 0 ? 'circle' : (i === phrases.length -1 ? 'circle' : 'rectangle'),
            color: i === 0 ? '#BFDBFE' : 'white'
        });

        if (i > 0) {
            edges.push({
                id: `edge-${i}`,
                fromId: `node-${i-1}`,
                toId: id
            });
        }
        currentY += 120;
      });
      break;

    case 'cycle':
      const radius = 150;
      phrases.forEach((phrase, i) => {
        const angle = (i / phrases.length) * 2 * Math.PI - (Math.PI / 2);
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        const id = `node-${i}`;

        nodes.push({
            id,
            text: phrase,
            x,
            y,
            width: 110,
            height: 50,
            type: 'circle',
            color: '#E9D5FF'
        });

        const nextIndex = (i + 1) % phrases.length;
        edges.push({
            id: `edge-${i}`,
            fromId: id,
            toId: `node-${nextIndex}`
        });
      });
      break;
  }

  return { nodes, edges, type };
};
