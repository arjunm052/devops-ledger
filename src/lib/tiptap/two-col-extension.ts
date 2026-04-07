import { Node, mergeAttributes, type RawCommands, type CommandProps } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    twoCol: {
      setTwoCol: () => ReturnType
    }
  }
}

export const MiniCard = Node.create({
  name: 'miniCard',
  group: 'miniCard',
  content: 'block+',
  defining: true,

  parseHTML() {
    return [{ tag: 'div.mini-card' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { class: 'mini-card' }),
      0,
    ]
  },
})

export const TwoCol = Node.create({
  name: 'twoCol',
  group: 'block',
  content: 'miniCard+',
  isolating: true,
  defining: true,

  parseHTML() {
    return [{ tag: 'div.two-col' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        class: 'two-col',
        'data-type': 'twoCol',
      }),
      0,
    ]
  },

  addCommands(): Partial<RawCommands> {
    return {
      setTwoCol:
        () =>
        (props: CommandProps) => {
          return props.commands.insertContent({
            type: 'twoCol',
            content: [
              {
                type: 'miniCard',
                content: [
                  {
                    type: 'heading',
                    attrs: { level: 5 },
                    content: [{ type: 'text', text: 'Card title' }],
                  },
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Card content.' }],
                  },
                ],
              },
              {
                type: 'miniCard',
                content: [
                  {
                    type: 'heading',
                    attrs: { level: 5 },
                    content: [{ type: 'text', text: 'Card title' }],
                  },
                  { type: 'paragraph' },
                ],
              },
            ],
          })
        },
    }
  },
})
