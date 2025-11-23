import { DiagramNode, DiagramEdge } from '../types';
import { layoutDiagram } from './layoutEngine';

// Heuristics
const LIST_MARKERS = ['-', '*', '1.', '2.', '•'];
const COMPARISON_KEYWORDS = ['vs', 'diferencia', 'comparar', 'contra', 'frente a'];
const CYCLE_KEYWORDS = ['ciclo', 'repetir', 'bucle', 'proceso', 'pasos'];
const HIERARCHY_KEYWORDS = ['consiste en', 'tipos de', 'clasifica', 'dividen', 'partes', 'componentes'];

// Mock Knowledge Base for "Expansion"
const KNOWLEDGE_BASE: Record<string, { title: string; nodes: { title: string; desc: string }[] }> = {
    'guerra mundial': {
        title: 'La Segunda Guerra Mundial impacta la política global',
        nodes: [
            { title: 'Naciones Unidas', desc: 'Organización internacional para la paz' },
            { title: 'Guerra Fría', desc: 'Rivalidad geopolítica entre superpotencias' },
            { title: 'Descolonización', desc: 'Fin de los imperios coloniales europeos' }
        ]
    },
    'marketing': {
        title: 'Estrategia de Marketing Digital',
        nodes: [
            { title: 'SEO', desc: 'Optimización para motores de búsqueda' },
            { title: 'Redes Sociales', desc: 'Construcción de comunidad y marca' },
            { title: 'Email Marketing', desc: 'Fidelización de clientes' }
        ]
    },
    'ciclo del agua': {
        title: 'El Ciclo Hidrológico Vital',
        nodes: [
            { title: 'Evaporación', desc: 'El agua se convierte en vapor' },
            { title: 'Condensación', desc: 'Formación de nubes' },
            { title: 'Precipitación', desc: 'Lluvia, nieve o granizo' }
        ]
    }
};

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

  static async analyzeAndGenerate(text: string, progressCallback: (step: string) => void): Promise<{ nodes: DiagramNode[], edges: DiagramEdge[], type?: string }> {

    // Step 1: Semantic Analysis
    progressCallback("🤖 Analizando semántica...");
    await sleep(800); // Fake delay

    const lowerText = text.toLowerCase().trim();
    const sentences = text.split(/[.!?\n]/).filter(s => s.trim().length > 3);

    // Check for "Creative Expansion Mode" (Short text < 50 chars)
    if (text.length < 50 && !text.includes('\n')) {
        progressCallback("✨ Activando Modo Creativo...");
        await sleep(800);

        // Check knowledge base or generate generic
        let data = { title: `Análisis Profundo de: ${text}`, nodes: [{ title: 'Concepto Clave 1', desc: 'Descripción detallada del punto.' }, { title: 'Concepto Clave 2', desc: 'Impacto relevante en el contexto.' }] };

        for (const key in KNOWLEDGE_BASE) {
            if (lowerText.includes(key)) {
                data = KNOWLEDGE_BASE[key];
                break;
            }
        }

        // Build Infographic Structure
        const nodes: DiagramNode[] = [];
        const edges: DiagramEdge[] = [];

        // Central Node (Bottom/Center)
        const rootId = 'root-infographic';
        nodes.push({
            id: rootId,
            text: data.title,
            x: 400, y: 500, // Starting pos, will be laid out
            width: 220, height: 220,
            type: 'circle',
            color: '#FDE68A', // Gold
            variant: 'infographic',
            label: 'Main'
        });

        // Branches
        data.nodes.forEach((item, i) => {
            const id = `info-node-${i}`;
            nodes.push({
                id,
                text: item.title,
                description: item.desc,
                label: (i + 1).toString(),
                x: 0, y: 0,
                width: 180, height: 180,
                type: 'circle',
                color: 'white',
                variant: 'infographic'
            });

            edges.push({
                id: `edge-${i}`,
                fromId: rootId,
                toId: id
            });
        });

        // Manual Layout for Infographic (Star/Tree up)
        // Root at 400, 500.
        // Children in an arc above.
        const centerX = 400;
        const centerY = 500;
        const radius = 300;
        const startAngle = Math.PI; // 180 deg (left)
        const endAngle = 2 * Math.PI; // 360 deg (right)
        // Actually better: from 5/4 PI to 7/4 PI (top left to top right)
        // Let's spread them from 210 degrees to 330 degrees.
        const totalAngle = 120 * (Math.PI / 180);
        const startRad = 210 * (Math.PI / 180);

        nodes.forEach((n) => {
            if (n.id === rootId) {
                n.x = centerX;
                n.y = centerY;
            } else {
                const index = parseInt(n.label || '0') - 1;
                const count = data.nodes.length;
                // Spread evenly
                const angleStep = count > 1 ? totalAngle / (count - 1) : 0;
                const angle = startRad + (index * angleStep);

                n.x = centerX + radius * Math.cos(angle);
                n.y = centerY + radius * Math.sin(angle);
            }
        });

        progressCallback("🎨 Diseñando Infografía...");
        await sleep(600);

        return { nodes, edges, type: 'infographic' };
    }

    // Standard Logic for Longer Text
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
    // Only run dagre if not infographic (infographic has manual layout above)
    progressCallback("📐 Calculando geometría...");
    await sleep(800);

    const layoutData = layoutDiagram(nodes, edges);

    // Step 3: Final Polish
    progressCallback("🎨 Renderizando estilo 'Napkin'...");
    await sleep(600);

    return { nodes: layoutData.nodes, edges: layoutData.edges };
  }
}
