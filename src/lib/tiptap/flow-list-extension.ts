import { Node, mergeAttributes, type RawCommands, type CommandProps } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { FlowItemNodeView } from '@/components/editor/flow-item-node'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    flowList: {
      setFlowList: () => ReturnType
    }
  }
}

export const FlowItem = Node.create({
  name: 'flowItem',
  group: 'flowItem',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      step: {
        default: 1,
        parseHTML: (el) => {
          const t = el.querySelector('.flow-num')?.textContent?.trim()
          const n = t ? parseInt(t, 10) : NaN
          return Number.isFinite(n) ? n : 1
        },
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div.flow-step' }]
  },

  renderHTML({ node }) {
    const step = node.attrs.step as number
    return [
      'div',
      mergeAttributes({
        class: 'flow-step',
        'data-flow-step': String(step),
      }),
      0,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(FlowItemNodeView)
  },
})

export const FlowList = Node.create({
  name: 'flowList',
  group: 'block',
  content: 'flowItem+',
  defining: true,

  parseHTML() {
    return [{ tag: 'div.flow' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { class: 'flow', 'data-type': 'flowList' }),
      0,
    ]
  },

  addCommands(): Partial<RawCommands> {
    return {
      setFlowList:
        () =>
        (props: CommandProps) => {
          return props.commands.insertContent({
            type: 'flowList',
            content: [
              {
                type: 'flowItem',
                attrs: { step: 1 },
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      { type: 'text', text: 'Step title', marks: [{ type: 'bold' }] },
                    ],
                  },
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Step description.' }],
                  },
                ],
              },
              {
                type: 'flowItem',
                attrs: { step: 2 },
                content: [{ type: 'paragraph' }],
              },
            ],
          })
        },
    }
  },
})
