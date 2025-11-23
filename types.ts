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
