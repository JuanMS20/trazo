import rough from 'roughjs';
import { DiagramData, DiagramNode, DiagramEdge } from '../../types';
import { calculateEdgePath } from './geometry';

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

    // We need to use the same edge routing logic for SVG export!
    // But geometry utils expect node coordinates in diagram space, which they are.
    // We will calculate paths in diagram space, then offset points for SVG.

    const pathData = calculateEdgePath(fromNode, toNode, data.nodes);
    const { points, type } = pathData;

    const offsetPoints = points.map(p => ({ x: p.x + offsetX, y: p.y + offsetY }));
    const [start, control, end] = offsetPoints;

    const isInfographic = fromNode.variant === 'infographic' || toNode.variant === 'infographic';

    if (type === 'curved' && control) {
         const curve = generator.curve(
            [[start.x, start.y], [control.x, control.y], [end.x, end.y]],
            {
                roughness: isInfographic ? 0.5 : 1.2,
                bowing: isInfographic ? 0.5 : 2,
                stroke: isInfographic ? '#cbd5e1' : '#94a3b8',
                strokeWidth: isInfographic ? 2 : 1.5
            }
        );
        svgContent += drawableToSvg(curve);
    } else {
        const line = generator.line(start.x, start.y, end.x, end.y, {
            roughness: 1.2, bowing: 2, stroke: '#94a3b8', strokeWidth: 1.5
        });
        svgContent += drawableToSvg(line);
    }

    // Arrow Head (reusing logic from RoughEdge roughly)
    const lastPoint = offsetPoints[offsetPoints.length - 1];
    const prevPoint = offsetPoints.length === 3 ? offsetPoints[1] : offsetPoints[0];

    const angle = Math.atan2(lastPoint.y - prevPoint.y, lastPoint.x - prevPoint.x);

    const arrowLen = 12;
    const x3 = lastPoint.x - arrowLen * Math.cos(angle - Math.PI / 6);
    const y3 = lastPoint.y - arrowLen * Math.sin(angle - Math.PI / 6);
    const x4 = lastPoint.x - arrowLen * Math.cos(angle + Math.PI / 6);
    const y4 = lastPoint.y - arrowLen * Math.sin(angle + Math.PI / 6);

    const arrow = generator.polygon([
          [lastPoint.x, lastPoint.y],
          [x3, y3],
          [x4, y4]
      ], {
          fill: isInfographic ? '#cbd5e1' : '#94a3b8',
          fillStyle: 'solid',
          stroke: 'none'
      });
    svgContent += drawableToSvg(arrow);

    if (isInfographic) {
        const circle = generator.circle(end.x, end.y, 8, { fill: 'white', fillStyle: 'solid', stroke: '#cbd5e1' });
        svgContent += drawableToSvg(circle);
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
      if (node.type === 'container') {
          // Container styling for export
           const containerOptions = {
               ...options,
               fill: 'transparent',
               fillStyle: 'solid',
               strokeLineDash: [5, 5],
               stroke: '#94a3b8'
           };
           shape = generator.rectangle(x + 2, y + 2, w - 4, h - 4, containerOptions);
      } else if (node.type === 'circle' || node.type === 'ellipse') {
          shape = generator.ellipse(cx, cy, w - 4, h - 4, options);
      } else if (node.type === 'diamond') {
          shape = generator.polygon([[cx, y+2], [x+w-2, cy], [cx, y+h-2], [x+2, cy]], options);
      } else {
          shape = generator.rectangle(x + 2, y + 2, w - 4, h - 4, options);
      }

      svgContent += drawableToSvg(shape);

      // Render Text (Manual approximation)
      const textColor = '#1E293B';
      // Ensure we use the correct font family string that matches the CSS import
      const fontFamily = 'Caveat, cursive';

      // Main Text
      // We attempt to wrap text manually for SVG... complexity high.
      // Simple centering for now.
      svgContent += `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" fill="${textColor}" style="font-family: ${fontFamily}; font-size: ${node.variant === 'infographic' && node.label === 'Main' ? '24px' : '18px'}; font-weight: bold;">${node.text}</text>`;

      // Label (Infographic)
      if (node.variant === 'infographic' && node.label && node.label !== 'Main') {
           svgContent += `<text x="${x + w - 15}" y="${y + 15}" text-anchor="end" fill="rgba(30,41,59,0.2)" style="font-family: 'Manrope', sans-serif; font-size: 32px; font-weight: bold;">${node.label}</text>`;
      }

      // Description
      if (node.variant === 'infographic' && node.description) {
           svgContent += `<text x="${cx}" y="${cy + 25}" text-anchor="middle" fill="#4b5563" style="font-family: 'Inter', sans-serif; font-size: 10px;">${node.description}</text>`;
      }
  });

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background-color: #FDFBF7;">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Inter:wght@400&family=Manrope:wght@700&display=swap');
        text { font-family: 'Caveat', cursive; font-weight: 700; }
      </style>
      ${svgContent}
    </svg>
  `;
};
