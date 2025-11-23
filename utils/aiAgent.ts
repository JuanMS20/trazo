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

    // 1. ANÁLISIS: Preparamos la llamada a Chutes.ai
    progressCallback(`🧠 Consultando a ${MODEL}...`);

    if (!API_KEY) {
      console.error("Falta la API Key de Chutes");
      throw new Error("API Key no configurada");
    }

    // Definimos el prompt del sistema con instrucciones estrictas de JSON
    const systemPrompt = `
      Eres un experto arquitecto de información y visualización de datos. Tu única tarea es convertir texto en una estructura JSON para diagramas.

      Reglas de Salida:
      1. RESPONDE ÚNICAMENTE CON UN JSON VÁLIDO. No añadas texto antes ni después. No uses bloques de código markdown (\`\`\`json).
      2. Estructura JSON requerida:
         {
           "nodes": [ { "id": "string", "text": "string (max 6 palabras)", "type": "rectangle|circle|diamond", "variant": "default|infographic" } ],
           "edges": [ { "id": "string", "fromId": "string", "toId": "string", "label": "string (opcional)" } ]
         }
      3. Lógica de Diseño:
         - Usa 'diamond' para decisiones o preguntas clave.
         - Usa 'circle' para conceptos centrales, inicio o fin.
         - Usa 'rectangle' para pasos de proceso o información.
      4. Simplifica el texto de los nodos para que sea visualmente digerible.
      ${forceType ? `5. IMPORTANTE: El usuario solicitó explícitamente un diagrama tipo: ${forceType}. Estructura los nodos acorde a eso.` : ''}
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
          temperature: 0.7, // Un poco de creatividad pero controlada
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error de API (${response.status}): ${errorText}`);
      }

      const data = await response.json();

      // Validamos que haya respuesta
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error("Formato de respuesta inesperado de Chutes.ai");
      }

      let content = data.choices[0].message.content;

      // Limpieza defensiva por si el modelo incluye bloques markdown
      content = content.replace(/```json/g, '').replace(/```/g, '').trim();

      // 2. PROCESAMIENTO: Parseamos el JSON
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
      const layoutData = layoutDiagram(nodes, edges);

      return {
        nodes: layoutData.nodes,
        edges: layoutData.edges,
        type: (forceType as any) || 'flowchart'
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
        type: 'flowchart'
      };
    }
  }
}
