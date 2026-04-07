import { Node, mergeAttributes, type RawCommands, type CommandProps } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { DiagramNodeView } from '@/components/editor/diagram-node-view'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    diagram: {
      setDiagram: (attrs?: { title?: string; svgHtml?: string }) => ReturnType
    }
  }
}

export const Diagram = Node.create({
  name: 'diagram',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      title: {
        default: '',
        parseHTML: (el) =>
          el.querySelector('.diagram-title')?.textContent?.trim() ?? '',
      },
      svgHtml: {
        default: '',
        parseHTML: (el) => {
          const svg = el.querySelector('svg')
          return svg ? svg.outerHTML : ''
        },
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div.diagram-wrap' }]
  },

  renderHTML({ node }) {
    return [
      'div',
      mergeAttributes({
        class: 'diagram-wrap',
        'data-type': 'diagram',
        'data-diagram-title': node.attrs.title as string,
      }),
      ['div', { class: 'diagram-title' }, node.attrs.title as string],
    ]
  },

  addCommands(): Partial<RawCommands> {
    return {
      setDiagram:
        (attrs) =>
        (props: CommandProps) => {
          return props.commands.insertContent({
            type: this.name,
            attrs: {
              title: attrs?.title ?? 'Diagram',
              svgHtml:
                attrs?.svgHtml ??
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80"><rect width="200" height="80" fill="#111827"/></svg>',
            },
          })
        },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(DiagramNodeView)
  },
})
