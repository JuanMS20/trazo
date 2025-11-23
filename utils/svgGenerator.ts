import rough from 'roughjs';
import { DiagramData, DiagramNode, DiagramEdge } from '../types';

export const generateSvgString = (data: DiagramData): string => {
  if (!data.nodes || data.nodes.length === 0) return '<svg></svg>';

  // 1. Calculate Bounding Box
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  data.nodes.forEach(node => {
    minX = Math.min(minX, node.x - node.width / 2);
    minY = Math.min(minY, node.y - node.height / 2);
    maxX = Math.max(maxX, node.x + node.width / 2);
    maxY = Math.max(maxY, node.y + node.height / 2);
  });

  const padding = 50;
  const width = maxX - minX + padding * 2;
  const height = maxY - minY + padding * 2;
  const offsetX = -minX + padding;
  const offsetY = -minY + padding;

  const generator = rough.generator();
  let svgContent = '';

  // Helper to convert rough paths to SVG string
  const drawableToSvg = (drawable: any) => {
    const paths = generator.toPaths(drawable);
    return paths.map((p: any) =>
      `<path d="${p.d}" stroke="${p.stroke}" stroke-width="${p.strokeWidth}" fill="${p.fill || 'none'}" />`
    ).join('');
  };

  // 2. Render Edges
  data.edges.forEach(edge => {
    const fromNode = data.nodes.find(n => n.id === edge.fromId);
    const toNode = data.nodes.find(n => n.id === edge.toId);

    if (!fromNode || !toNode) return;

    const x1 = fromNode.x + offsetX;
    const y1 = fromNode.y + offsetY;
    const x2 = toNode.x + offsetX;
    const y2 = toNode.y + offsetY;

    const isInfographic = fromNode.variant === 'infographic' || toNode.variant === 'infographic';

    if (isInfographic) {
        const cx = (x1 + x2) / 2;
        const cy = (y1 + y2) / 2 - 50;

        const curve = generator.curve(
            [[x1, y1], [cx, cy], [x2, y2]],
            { roughness: 0.5, bowing: 0.5, stroke: '#cbd5e1', strokeWidth: 2 }
        );
        svgContent += drawableToSvg(curve);

        const circle = generator.circle(x2, y2, 8, { fill: 'white', fillStyle: 'solid', stroke: '#cbd5e1' });
        svgContent += drawableToSvg(circle);
    } else {
        const line = generator.line(x1, y1, x2, y2, {
            roughness: 1.2, bowing: 2, stroke: '#94a3b8', strokeWidth: 1.5
        });
        svgContent += drawableToSvg(line);
    }
  });

  // 3. Render Nodes
  data.nodes.forEach(node => {
      const cx = node.x + offsetX;
      const cy = node.y + offsetY;
      const w = node.width;
      const h = node.height;
      const x = cx - w / 2;
      const y = cy - h / 2;

      const options = {
        roughness: node.variant === 'infographic' ? 1.5 : 2.5,
        bowing: node.variant === 'infographic' ? 0.5 : 2,
        fill: node.color || 'white',
        fillStyle: 'hachure',
        fillWeight: 1,
        hachureGap: 4,
        stroke: node.variant === 'infographic' ? '#1e293b' : '#1e293b',
        strokeWidth: node.variant === 'infographic' ? 3 : 2,
        disableMultiStroke: node.variant === 'infographic'
      };

      if (node.variant === 'infographic') {
          options.stroke = '#1e293b';
          options.roughness = 0.5;
          options.bowing = 0.2;
      }

      let shape;
      if (node.type === 'circle' || node.type === 'ellipse') {
          shape = generator.ellipse(cx, cy, w - 4, h - 4, options);
      } else {
          shape = generator.rectangle(x + 2, y + 2, w - 4, h - 4, options);
      }

      svgContent += drawableToSvg(shape);

      // Render Text (Manual approximation)
      const textColor = '#1E293B';
      const fontFamily = 'Caveat, cursive';

      // Main Text
      svgContent += `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" fill="${textColor}" style="font-family: ${fontFamily}; font-size: ${node.variant === 'infographic' && node.label === 'Main' ? '24px' : '18px'}; font-weight: bold;">${node.text}</text>`;

      // Label (Infographic)
      if (node.variant === 'infographic' && node.label && node.label !== 'Main') {
           svgContent += `<text x="${x + w - 15}" y="${y + 15}" text-anchor="end" fill="rgba(30,41,59,0.2)" style="font-family: 'Manrope', sans-serif; font-size: 32px; font-weight: bold;">${node.label}</text>`;
      }

      // Description
      if (node.variant === 'infographic' && node.description) {
           svgContent += `<text x="${cx}" y="${cy + 25}" text-anchor="middle" fill="#4b5563" style="font-family: 'Inter', sans-serif; font-size: 10px;">${node.description}</text>`;
      }

      // Icon (Standard)
      if (node.variant !== 'infographic' && node.icon) {
          // Note: Material Symbols are fonts. We need to ensure font is loaded or ignore icon.
          // Embedding font icons in pure SVG is hard without embedding the font.
          // We'll skip icon for pure SVG export or use a placeholder text.
      }
  });

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background-color: #FDFBF7;">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Inter:wght@400&family=Manrope:wght@700&display=swap');
      </style>
      ${svgContent}
    </svg>
  `;
};
