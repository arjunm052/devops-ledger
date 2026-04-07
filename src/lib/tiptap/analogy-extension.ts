import { Node, mergeAttributes, type RawCommands, type CommandProps } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { AnalogyNodeView } from '@/components/editor/analogy-node'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    analogy: {
      setAnalogy: (attrs?: { label?: string }) => ReturnType
    }
  }
}

export const Analogy = Node.create({
  name: 'analogy',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      label: {
        default: 'Analogy',
        parseHTML: (el) =>
          el.getAttribute('data-analogy-label') ??
          el.querySelector('.analogy-label')?.textContent?.trim() ??
          'Analogy',
        renderHTML: (attributes) => ({
          'data-analogy-label': attributes.label as string,
        }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div.analogy' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { class: 'analogy', 'data-type': 'analogy' }),
      0,
    ]
  },

  addCommands(): Partial<RawCommands> {
    return {
      setAnalogy:
        (attrs?: { label?: string }) =>
        (props: CommandProps) => {
          return props.commands.insertContent({
            type: this.name,
            attrs: { label: attrs?.label ?? 'Analogy' },
            content: [{ type: 'paragraph' }],
          })
        },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(AnalogyNodeView)
  },
})
