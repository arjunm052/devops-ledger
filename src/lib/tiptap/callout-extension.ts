import { Node, mergeAttributes, type RawCommands, type CommandProps } from '@tiptap/core'

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
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-callout-type]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { class: 'callout' }),
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
})
