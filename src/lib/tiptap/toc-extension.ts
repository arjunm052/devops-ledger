import { Node, type RawCommands, type CommandProps } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { TocNodeView } from '@/components/editor/toc-node'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    tableOfContents: {
      insertTableOfContents: () => ReturnType
    }
  }
}

export const TableOfContents = Node.create({
  name: 'tableOfContents',
  group: 'block',
  atom: true,

  parseHTML() {
    return [{ tag: 'div[data-toc]' }]
  },

  renderHTML() {
    return ['div', { 'data-toc': '', class: 'toc-block' }, 'Table of Contents']
  },

  addCommands(): Partial<RawCommands> {
    return {
      insertTableOfContents:
        () =>
        (props: CommandProps) => {
          return props.commands.insertContent({ type: this.name })
        },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(TocNodeView)
  },
})
