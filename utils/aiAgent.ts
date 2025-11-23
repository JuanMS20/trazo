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

  static async analyzeAndGenerate(text: string, progressCallback: (step: string) => void, forceType?: string): Promise<{ nodes: DiagramNode[], edges: DiagramEdge[], type?: string }> {

    // Step 1: Semantic Analysis
    progressCallback("🤖 Analizando semántica...");
    await sleep(800); // Fake delay

    const lowerText = text.toLowerCase().trim();
    const sentences = text.split(/[.!?\n]/).filter(s => s.trim().length > 3);

    // Determine Pattern: ForceType takes precedence, else heuristics
    let pattern = 'sequence';

    if (forceType) {
        // Map forceType to pattern logic
        if (forceType === 'flowchart') pattern = 'sequence'; // Sequence/Flowchart same logic here
        else if (forceType === 'tree') pattern = 'hierarchy'; // tree map to hierarchy logic
        else pattern = forceType; // 'cycle', 'comparison', 'infographic', 'hierarchy'
    } else {
        // Heuristics
        if (text.length < 50 && !text.includes('\n')) pattern = 'infographic'; // Heuristic for infographic
        else if (COMPARISON_KEYWORDS.some(k => lowerText.includes(k))) pattern = 'comparison';
        else if (CYCLE_KEYWORDS.some(k => lowerText.includes(k))) pattern = 'cycle';
        else if (HIERARCHY_KEYWORDS.some(k => lowerText.includes(k)) || sentences.some(s => LIST_MARKERS.some(m => s.trim().startsWith(m)))) pattern = 'hierarchy';
    }

    const nodes: DiagramNode[] = [];
    const edges: DiagramEdge[] = [];

    const createNode = (id: string, text: string, type: DiagramNode['type'] = 'rectangle', color = 'white', width = 150, height = 70): DiagramNode => {
        return {
            id,
            text: text.substring(0, 40) + (text.length > 40 ? '...' : ''),
            x: 0, y: 0,
            width, height,
            type, color,
            icon: getIconForText(text)
        };
    };

    if (pattern === 'infographic') {
        progressCallback("✨ Activando Modo Creativo...");
        if (!forceType) await sleep(800); // Only sleep if auto-detected

        let data = { title: `Análisis de: ${text.substring(0,20)}...`, nodes: [{ title: 'Concepto 1', desc: 'Descripción clave.' }, { title: 'Concepto 2', desc: 'Impacto relevante.' }, { title: 'Concepto 3', desc: 'Conclusión.' }] };

        // If text matches knowledge base, use it. Even if forced, we try to use KB if text matches keys.
        for (const key in KNOWLEDGE_BASE) {
            if (lowerText.includes(key)) {
                data = KNOWLEDGE_BASE[key];
                break;
            }
        }
        // If forced infographic on long text? We might need to summarize.
        // For simulation: We just use the first few sentences as points if not in KB.
        if (text.length >= 50 && !KNOWLEDGE_BASE[Object.keys(KNOWLEDGE_BASE).find(k => lowerText.includes(k)) || '']) {
             data = {
                 title: "Resumen Visual",
                 nodes: sentences.slice(0, 4).map(s => ({ title: s.substring(0, 20), desc: s.substring(0, 50) }))
             };
        }

        const rootId = 'root-infographic';
        nodes.push({
            id: rootId,
            text: data.title,
            x: 400, y: 500,
            width: 220, height: 220,
            type: 'circle',
            color: '#FDE68A',
            variant: 'infographic',
            label: 'Main'
        });

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
            edges.push({ id: `edge-${i}`, fromId: rootId, toId: id });
        });

        // Radial Layout
        const centerX = 400;
        const centerY = 500;
        const radius = 300;
        const totalAngle = 140 * (Math.PI / 180); // Slightly wider arc
        const startRad = 200 * (Math.PI / 180);

        nodes.forEach((n) => {
            if (n.id === rootId) {
                n.x = centerX;
                n.y = centerY;
            } else {
                const index = parseInt(n.label || '0') - 1;
                const count = data.nodes.length;
                const angleStep = count > 1 ? totalAngle / (count - 1) : 0;
                const angle = startRad + (index * angleStep);
                n.x = centerX + radius * Math.cos(angle);
                n.y = centerY + radius * Math.sin(angle);
            }
        });

        return { nodes, edges, type: 'infographic' };

    } else if (pattern === 'comparison') {
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
            if (i > 0) edges.push({ id: `edge-${i}`, fromId: `node-${i-1}`, toId: id });
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
        // Sequence / Timeline
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

    // Step 2: Structural Optimization (Layout) for standard types
    progressCallback("📐 Calculando geometría...");
    await sleep(800);

    // Use dagre for layout, but check if timeline needs horizontal
    const layoutData = layoutDiagram(nodes, edges);
    // Dagre default in layoutEngine is Top-Bottom. Timeline might want Left-Right.
    // For now, sticking to one layout engine config for simplicity unless forceType is timeline?
    // Let's keep it simple.

    // Step 3: Final Polish
    progressCallback("🎨 Renderizando estilo 'Napkin'...");
    await sleep(600);

    return { nodes: layoutData.nodes, edges: layoutData.edges };
  }
}
