import { Node, mergeAttributes, type RawCommands, type CommandProps } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { CalloutNodeView } from '@/components/editor/callout-node'

export type CalloutType = 'info' | 'warning' | 'tip' | 'danger'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (attrs?: { type?: CalloutType }) => ReturnType
      toggleCalloutType: (type: CalloutType) => ReturnType
    }
  }
}

export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      type: {
        default: 'info' as CalloutType,
        parseHTML: (element) => element.getAttribute('data-callout-type') || 'info',
        renderHTML: (attributes) => ({
          'data-callout-type': attributes.type,
        }),
      },
      label: {
        default: null as string | null,
        parseHTML: (element) => element.getAttribute('data-callout-label') || null,
        renderHTML: (attributes) => {
          if (!attributes.label) return {}
          return { 'data-callout-label': attributes.label }
        },
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-callout-type]' }]
  },

  renderHTML({ node, HTMLAttributes }) {
    const type = (node.attrs.type || 'info') as CalloutType
    const variant =
      type === 'info'
        ? 'callout-info'
        : type === 'warning'
          ? 'callout-warn'
          : type === 'tip'
            ? 'callout-success'
            : 'callout-danger'
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        class: `callout ${variant}`,
        'data-callout-type': type,
      }),
      0,
    ]
  },

  addCommands(): Partial<RawCommands> {
    return {
      setCallout:
        (attrs?: { type?: CalloutType }) =>
        (props: CommandProps) => {
          return props.commands.wrapIn(this.name, attrs)
        },
      toggleCalloutType:
        (type: CalloutType) =>
        (props: CommandProps) => {
          return props.commands.updateAttributes(this.name, { type })
        },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutNodeView)
  },
})
