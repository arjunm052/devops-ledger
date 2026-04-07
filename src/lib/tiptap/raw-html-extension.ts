import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { RawHtmlNodeView } from '@/components/editor/raw-html-node-view'

export const RawHtml = Node.create({
  name: 'rawHtml',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      html: {
        default: '',
        parseHTML: (element) =>
          element.getAttribute('data-raw-html-content') ?? '',
        renderHTML: (attributes) => ({
          'data-raw-html-content': attributes.html,
        }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-raw-html]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-raw-html': 'true' }, HTMLAttributes)]
  },

  addNodeView() {
    return ReactNodeViewRenderer(RawHtmlNodeView)
  },
})
