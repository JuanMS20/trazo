import { DiagramNode, DiagramEdge, DiagramData } from '../types';
import { layoutDiagram } from './layoutEngine';

const API_KEY = process.env.CHUTES_API_KEY;
const API_URL = process.env.CHUTES_API_URL || "https://llm.chutes.ai/v1/chat/completions";
const MODEL = process.env.CHUTES_MODEL || "kimik2-0905";

export class AiAgent {
  static async analyzeAndGenerate(
    text: string,
    progressCallback: (step: string) => void,
    forceType?: string
  ): Promise<DiagramData> {

    if (!API_KEY) {
      console.error("Falta la API Key de Chutes");
      throw new Error("API Key no configurada");
    }

    let archetype = forceType;
    let rationale = "";

    // STEP 1: ANALYSIS (Chain-of-Thought)
    if (!forceType) {
        progressCallback("🧠 Analizando estructura del pensamiento...");
        try {
            const analysisPrompt = `
                Analyze the following text and determine the best visual archetype to represent it.

                Options:
                - 'Process' (Sequential steps, workflows)
                - 'Comparison' (Pros/cons, vs, two concepts)
                - 'Hierarchy' (Organizational charts, taxonomy)
                - 'Timeline' (History, sequence of events over time)
                - 'Cycle' (Loops, repeating processes)
                - 'Network' (Interconnected ideas, mindmaps)

                Return ONLY a valid JSON object:
                { "archetype": "Process|Comparison|Hierarchy|Timeline|Cycle|Network", "reasoning": "short explanation" }
            `;

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
                body: JSON.stringify({
                    model: MODEL,
                    messages: [
                        { role: "system", content: analysisPrompt },
                        { role: "user", content: `Text: "${text}"` }
                    ],
                    temperature: 0.3,
                    max_tokens: 500
                })
            });

            if (response.ok) {
                const data = await response.json();
                let content = data.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '').trim();
                const analysis = JSON.parse(content);
                archetype = analysis.archetype;
                rationale = analysis.reasoning;
                progressCallback(`💡 Detectado: ${archetype} (${rationale})`);
            } else {
                console.warn("Analysis step failed, defaulting to Process");
                archetype = 'Process';
            }
        } catch (e) {
            console.warn("Analysis error", e);
            archetype = 'Process';
        }
    }

    // Map Archetype to Internal Types
    let diagramType: DiagramData['type'] = 'flowchart';
    switch (archetype?.toLowerCase()) {
        case 'process': diagramType = 'flowchart'; break;
        case 'comparison': diagramType = 'matrix'; break;
        case 'hierarchy': diagramType = 'hierarchy'; break; // We treat hierarchy as flowchart usually but we can add specific handling if needed
        case 'timeline': diagramType = 'timeline'; break;
        case 'cycle': diagramType = 'cycle'; break;
        case 'network': diagramType = 'network'; break;
        default: diagramType = 'flowchart';
    }

    // Override if forceType matched an internal type directly (legacy support)
    if (forceType && ['flowchart', 'mindmap', 'cycle', 'hierarchy', 'infographic', 'matrix', 'timeline', 'network'].includes(forceType)) {
        diagramType = forceType as any;
    }

    // STEP 2: GENERATION
    progressCallback(`🎨 Generando diagrama tipo ${diagramType}...`);

    const systemPrompt = `
      Eres un experto arquitecto de información y visualización de datos. Tu tarea es convertir texto en una estructura JSON para diagramas.

      ARCHETIPO DETECTADO: ${archetype} (${rationale})

      INSTRUCCIONES DE DISEÑO SEGÚN ARCHETIPO:
      - Process: Usa nudos secuenciales.
      - Comparison: Usa una estructura de 2 columnas o cuadrantes.
      - Hierarchy: Usa una estructura de árbol (Padre -> Hijos).
      - Timeline: Usa una secuencia lineal horizontal.
      - Cycle: Usa un flujo circular cerrado.
      - Network: Usa nodos interconectados centralizados.

      Reglas de Salida:
      1. RESPONDE ÚNICAMENTE CON UN JSON VÁLIDO. No añadas texto antes ni después. No uses bloques de código markdown (\`\`\`json).
      2. Estructura JSON requerida:
         {
           "nodes": [ { "id": "string", "text": "string (max 6 palabras)", "type": "rectangle|circle|diamond|container", "variant": "default|infographic" } ],
           "edges": [ { "id": "string", "fromId": "string", "toId": "string", "label": "string (opcional)" } ]
         }
      3. Lógica de Diseño General:
         - Usa 'diamond' para decisiones o preguntas clave.
         - Usa 'circle' para conceptos centrales, inicio o fin.
         - Usa 'rectangle' para pasos de proceso o información.
         - Usa 'container' para agrupar conceptos relacionados. Los nodos contenedores deben ser más grandes y englobar visualmente a otros nodos.
         - Si es 'Comparison', asegúrate de crear nodos que representen las categorías a comparar.
      4. Simplifica el texto de los nodos para que sea visualmente digerible.
    `;

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Genera el diagrama para este texto: "${text}"` }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error de API (${response.status}): ${errorText}`);
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error("Formato de respuesta inesperado de Chutes.ai");
      }

      let content = data.choices[0].message.content;
      content = content.replace(/```json/g, '').replace(/```/g, '').trim();

      progressCallback("DT Procesando estructura...");
      let result;
      try {
          result = JSON.parse(content);
      } catch (e) {
          console.error("Fallo al parsear JSON:", content);
          throw new Error("La IA no devolvió un JSON válido.");
      }

      let nodes: DiagramNode[] = result.nodes || [];
      let edges: DiagramEdge[] = result.edges || [];

      // Saneamiento de datos
      nodes = nodes.map(node => ({
        ...node,
        width: node.width || 150,
        height: node.height || 80,
        x: 0,
        y: 0
      }));

      // 3. GEOMETRÍA: Calculamos posiciones
      progressCallback("📐 Dibujando diagrama...");
      const layoutData = layoutDiagram(nodes, edges, diagramType);

      return {
        nodes: layoutData.nodes,
        edges: layoutData.edges,
        type: diagramType,
        sourceText: text
      };

    } catch (error) {
      console.error("Error en AI Agent:", error);
      // Fallback visual en caso de error
      return {
        nodes: [
            { id: 'err1', text: 'Error de Conexión', x: 0, y: 0, width: 180, height: 80, type: 'diamond', color: '#FECACA' },
            { id: 'err2', text: 'Intenta de nuevo', x: 0, y: 0, width: 180, height: 80, type: 'rectangle' }
        ],
        edges: [
            { id: 'e1', fromId: 'err1', toId: 'err2', label: 'Revisar consola' }
        ],
        type: 'flowchart',
        sourceText: text
      };
    }
  }
}
