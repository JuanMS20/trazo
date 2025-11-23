import { DiagramNode, DiagramEdge } from '../types';
import { layoutDiagram } from './layoutEngine';

// Heuristics
const LIST_MARKERS = ['-', '*', '1.', '2.', '•'];
const COMPARISON_KEYWORDS = ['vs', 'diferencia', 'comparar', 'contra', 'frente a'];
const CYCLE_KEYWORDS = ['ciclo', 'repetir', 'bucle', 'proceso', 'pasos'];
const HIERARCHY_KEYWORDS = ['consiste en', 'tipos de', 'clasifica', 'dividen', 'partes', 'componentes'];

// Simple Icon Mapping
const ICON_MAP: Record<string, string> = {
    'idea': 'lightbulb',
    'tiempo': 'schedule',
    'dinero': 'attach_money',
    'costo': 'attach_money',
    'usuario': 'person',
    'cliente': 'face',
    'servidor': 'dns',
    'base de datos': 'database',
    'objetivo': 'flag',
    'meta': 'emoji_events',
    'problema': 'warning',
    'error': 'error',
    'solución': 'check_circle',
    'inicio': 'play_arrow',
    'fin': 'stop',
    'pregunta': 'help',
    'duda': 'help',
    'herramienta': 'build',
    'trabajo': 'work',
    'email': 'mail',
    'mensaje': 'chat'
};

interface AnalysisResult {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getIconForText = (text: string): string | undefined => {
    const lower = text.toLowerCase();
    for (const key of Object.keys(ICON_MAP)) {
        if (lower.includes(key)) return ICON_MAP[key];
    }
    return undefined;
};

/**
 * Simulates an AI agent that parses text and extracts structure.
 * It includes simulated delays to mimic "thinking" time.
 */
export class AiAgent {

  static async analyzeAndGenerate(text: string, progressCallback: (step: string) => void): Promise<{ nodes: DiagramNode[], edges: DiagramEdge[] }> {

    // Step 1: Semantic Analysis
    progressCallback("🤖 Analizando semántica...");
    await sleep(800); // Fake delay

    const lowerText = text.toLowerCase();
    const sentences = text.split(/[.!?\n]/).filter(s => s.trim().length > 3);

    // Detect Layout Pattern
    let pattern = 'sequence';
    if (COMPARISON_KEYWORDS.some(k => lowerText.includes(k))) pattern = 'comparison';
    else if (CYCLE_KEYWORDS.some(k => lowerText.includes(k))) pattern = 'cycle';
    else if (HIERARCHY_KEYWORDS.some(k => lowerText.includes(k)) || sentences.some(s => LIST_MARKERS.some(m => s.trim().startsWith(m)))) pattern = 'hierarchy';

    const nodes: DiagramNode[] = [];
    const edges: DiagramEdge[] = [];

    const createNode = (id: string, text: string, type: DiagramNode['type'] = 'rectangle', color = 'white', width = 150, height = 70): DiagramNode => {
        return {
            id,
            text: text.substring(0, 40) + (text.length > 40 ? '...' : ''),
            x: 0, y: 0,
            width, height,
            type, color,
            icon: getIconForText(text) // Add icon heuristic
        };
    };

    if (pattern === 'comparison') {
        const half = Math.ceil(sentences.length / 2);
        const groupA = sentences.slice(0, half);
        const groupB = sentences.slice(half);

        groupA.forEach((s, i) => {
            const id = `col-a-${i}`;
            nodes.push(createNode(id, s.trim(), 'rectangle', '#BFDBFE'));
             if (i > 0) edges.push({ id: `edge-a-${i}`, fromId: `col-a-${i-1}`, toId: id });
        });

        groupB.forEach((s, i) => {
            const id = `col-b-${i}`;
            nodes.push(createNode(id, s.trim(), 'rectangle', '#FECACA'));
            if (i > 0) edges.push({ id: `edge-b-${i}`, fromId: `col-b-${i-1}`, toId: id });
        });

    } else if (pattern === 'cycle') {
        sentences.forEach((s, i) => {
            const id = `node-${i}`;
            nodes.push(createNode(id, s.trim(), 'circle', '#E9D5FF', 140, 140));

            if (i > 0) {
                edges.push({ id: `edge-${i}`, fromId: `node-${i-1}`, toId: id });
            }
        });
        if (nodes.length > 1) {
            edges.push({ id: 'edge-cycle', fromId: nodes[nodes.length-1].id, toId: nodes[0].id });
        }

    } else if (pattern === 'hierarchy') {
         const rootId = 'root';
         const title = sentences[0].length < 30 ? sentences[0] : "Concepto Principal";
         const children = sentences[0].length < 30 ? sentences.slice(1) : sentences;

        nodes.push(createNode(rootId, title.replace(/^[-*•\d\.]+\s*/, ''), 'diamond', '#FDE68A', 160, 80));

        children.forEach((s, i) => {
            const cleanText = s.replace(/^[-*•\d\.]+\s*/, '').trim();
            if (!cleanText) return;
            const id = `node-${i}`;
            nodes.push(createNode(id, cleanText, 'rectangle', 'white'));
            edges.push({ id: `edge-${i}`, fromId: rootId, toId: id });
        });

    } else {
        // Sequence
        sentences.forEach((s, i) => {
            const cleanText = s.trim();
            const id = `node-${i}`;
            let type: DiagramNode['type'] = 'rectangle';
            let color = 'white';

            if (i === 0) { type = 'circle'; color = '#BFDBFE'; }
            else if (i === sentences.length - 1) { type = 'circle'; color = '#BFDBFE'; }
            else if (cleanText.includes('?')) { type = 'diamond'; color = '#FECACA'; }

            nodes.push(createNode(id, cleanText, type, color));

            if (i > 0) {
                edges.push({ id: `edge-${i}`, fromId: `node-${i-1}`, toId: id });
            }
        });
    }

    // Step 2: Structural Optimization (Layout)
    progressCallback("📐 Calculando geometría...");
    await sleep(800);

    const layoutData = layoutDiagram(nodes, edges);

    // Step 3: Final Polish
    progressCallback("🎨 Renderizando estilo 'Napkin'...");
    await sleep(600);

    return { nodes: layoutData.nodes, edges: layoutData.edges };
  }
}
