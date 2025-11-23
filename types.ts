export enum ViewState {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  LOADING = 'LOADING',
  WORKSPACE = 'WORKSPACE'
}

export interface Note {
  id: string;
  title: string;
  type: 'Diagram' | 'Text' | 'List' | 'Flowchart';
  icon: string;
  isFavorite?: boolean;
  isDeleted?: boolean;
}

// Diagram Types
export interface DiagramNode {
  id: string;
  text: string; // Main text or Title
  description?: string; // Subtext for infographic
  label?: string; // e.g. "1", "A"
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'rectangle' | 'circle' | 'ellipse' | 'diamond';
  color?: string;
  icon?: string;
  variant?: 'default' | 'infographic'; // To switch rendering style
}

export interface DiagramEdge {
  id: string;
  fromId: string;
  toId: string;
  label?: string;
}

export interface DiagramData {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  type: 'flowchart' | 'mindmap' | 'cycle' | 'hierarchy' | 'infographic' | 'matrix' | 'timeline';
  sourceText?: string;
}
