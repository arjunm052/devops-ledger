import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'

export const CodeBlockCustom = CodeBlockLowlight.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      filename: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-filename'),
        renderHTML: (attributes) => {
          if (!attributes.filename) return {}
          return { 'data-filename': attributes.filename }
        },
      },
    }
  },
})
