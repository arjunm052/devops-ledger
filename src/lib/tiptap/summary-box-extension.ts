import { Node, mergeAttributes, type RawCommands, type CommandProps } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { SummaryBoxNodeView } from '@/components/editor/summary-box-node'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    summaryBox: {
      setSummaryBox: (attrs?: { title?: string }) => ReturnType
    }
  }
}

export const SummaryBox = Node.create({
  name: 'summaryBox',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      title: {
        default: '// Section summary',
        parseHTML: (el) =>
          el.getAttribute('data-summary-title') ??
          el.querySelector('.summary-title')?.textContent?.trim() ??
          '// Section summary',
        renderHTML: (attributes) => ({
          'data-summary-title': attributes.title as string,
        }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div.summary-box' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        class: 'summary-box',
        'data-type': 'summaryBox',
      }),
      0,
    ]
  },

  addCommands(): Partial<RawCommands> {
    return {
      setSummaryBox:
        (attrs?: { title?: string }) =>
        (props: CommandProps) => {
          return props.commands.insertContent({
            type: this.name,
            attrs: { title: attrs?.title ?? '// Section summary' },
            content: [
              {
                type: 'bulletList',
                content: [
                  {
                    type: 'listItem',
                    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Key point' }] }],
                  },
                ],
              },
            ],
          })
        },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(SummaryBoxNodeView)
  },
})
