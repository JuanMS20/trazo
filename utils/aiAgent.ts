import { DiagramNode, DiagramEdge } from '../types';
import { layoutDiagram } from './layoutEngine';

// Heuristics to detect steps
const SEQUENTIAL_CONNECTORS = ['luego', 'después', 'entonces', 'finalmente', 'primero', 'segundo', 'paso', 'primero', 'siguiente'];
const CAUSAL_CONNECTORS = ['porque', 'debido a', 'causa', 'resultado'];
const LIST_MARKERS = ['-', '*', '1.', '2.', '•'];

interface AnalysisResult {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Simulates an AI agent that parses text and extracts structure.
 * It includes simulated delays to mimic "thinking" time.
 */
export class AiAgent {

  static async analyzeAndGenerate(text: string, progressCallback: (step: string) => void): Promise<{ nodes: DiagramNode[], edges: DiagramEdge[] }> {

    // Step 1: Semantic Analysis
    progressCallback("🤖 Analizando semántica...");
    await sleep(800); // Fake delay

    const sentences = text.split(/[.!?\n]/).filter(s => s.trim().length > 3);
    const nodes: DiagramNode[] = [];
    const edges: DiagramEdge[] = [];

    // Heuristic: Identify if it's a list or a narrative
    const isList = sentences.some(s => LIST_MARKERS.some(m => s.trim().startsWith(m)));

    if (isList) {
        // Handle as a list/hierarchy
        // Root node is implicit or the first sentence if it looks like a header
        const rootId = 'root';
        nodes.push({
            id: rootId,
            text: "Concepto Principal", // Fallback logic could be better
            x: 0, y: 0, width: 160, height: 60, type: 'circle', color: '#FDE68A'
        });

        sentences.forEach((s, i) => {
            const cleanText = s.replace(/^[-*•\d\.]+\s*/, '').trim();
            if (!cleanText) return;

            const id = `node-${i}`;
            nodes.push({
                id,
                text: cleanText.substring(0, 50) + (cleanText.length > 50 ? '...' : ''),
                x: 0, y: 0, width: 140, height: 70, type: 'rectangle', color: 'white'
            });

            edges.push({ id: `edge-${i}`, fromId: rootId, toId: id });
        });

    } else {
        // Handle as a sequence/flow
        sentences.forEach((s, i) => {
            const cleanText = s.trim();
            const id = `node-${i}`;

            // Determine type based on content
            let type: DiagramNode['type'] = 'rectangle';
            let color = 'white';

            if (i === 0) {
                type = 'circle';
                color = '#BFDBFE'; // Blueish for start
            } else if (i === sentences.length - 1) {
                type = 'circle';
                color = '#BFDBFE'; // End
            } else if (cleanText.includes('?')) {
                type = 'diamond'; // Decision
                color = '#FECACA';
            }

            nodes.push({
                id,
                text: cleanText.substring(0, 40) + (cleanText.length > 40 ? '...' : ''),
                x: 0, y: 0, width: 150, height: 70, type, color
            });

            if (i > 0) {
                edges.push({ id: `edge-${i}`, fromId: `node-${i-1}`, toId: id });
            }
        });
    }

    // Step 2: Structural Optimization (Layout)
    progressCallback("📐 Calculando geometría...");
    await sleep(800); // Fake delay

    const layoutData = layoutDiagram(nodes, edges);

    // Step 3: Final Polish
    progressCallback("🎨 Renderizando estilo 'Napkin'...");
    await sleep(600);

    return { nodes: layoutData.nodes, edges: layoutData.edges };
  }
}
