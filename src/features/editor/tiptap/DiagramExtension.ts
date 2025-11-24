import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { DiagramNodeView } from './DiagramNodeView';

export const DiagramExtension = Node.create({
  name: 'diagram',

  group: 'block',

  atom: true,

  draggable: true,

  addAttributes() {
    return {
      data: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="diagram"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'diagram' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DiagramNodeView);
  },
});
