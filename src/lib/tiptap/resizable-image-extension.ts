import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import type { EditorView } from '@tiptap/pm/view'
import { uploadPostImage } from '@/actions/post-images'
import { getImageFileFromDataTransfer } from '@/components/article-editor/image-clipboard'

// ─── Pending upload registry ──────────────────────────────────────────────────
// Maps blob URL → original File so the NodeView's Retry button can re-upload.

const pendingUploads = new Map<string, File>()

export function getPendingUpload(blobUrl: string): File | undefined {
  return pendingUploads.get(blobUrl)
}

export function removePendingUpload(blobUrl: string): void {
  pendingUploads.delete(blobUrl)
}

// ─── Upload helper ────────────────────────────────────────────────────────────
// Shared by the paste plugin and insertImageFromFile in editor-page.tsx.

export async function performOptimisticInsert(
  view: EditorView,
  file: File
): Promise<void> {
  const blobUrl = URL.createObjectURL(file)
  pendingUploads.set(blobUrl, file)

  const nodeType = view.state.schema.nodes.resizableImage
  const node = nodeType.create({
    src: blobUrl,
    alt: file.name,
    uploadState: 'uploading',
  })

  const tr = view.state.tr.replaceSelectionWith(node)
  view.dispatch(tr)

  const fd = new FormData()
  fd.set('file', file)

  try {
    const result = await uploadPostImage(fd)

    // Find node by blob URL — position may have shifted during upload
    let found = false
    view.state.doc.descendants((n, pos) => {
      if (found) return false
      if (n.type.name === 'resizableImage' && n.attrs.src === blobUrl) {
        found = true
        if ('error' in result) {
          view.dispatch(
            view.state.tr.setNodeAttribute(pos, 'uploadState', 'error')
          )
        } else {
          view.dispatch(
            view.state.tr
              .setNodeAttribute(pos, 'src', result.url)
              .setNodeAttribute(pos, 'uploadState', 'idle')
          )
          removePendingUpload(blobUrl)
          URL.revokeObjectURL(blobUrl)
        }
        return false
      }
    })

    if (!found) {
      // Node was deleted before upload finished — clean up
      removePendingUpload(blobUrl)
      URL.revokeObjectURL(blobUrl)
    }
  } catch {
    // Network or server error — mark node as error if it still exists
    let found = false
    view.state.doc.descendants((n, pos) => {
      if (found) return false
      if (n.type.name === 'resizableImage' && n.attrs.src === blobUrl) {
        found = true
        view.dispatch(
          view.state.tr.setNodeAttribute(pos, 'uploadState', 'error')
        )
        return false
      }
    })
  }
}

// ─── Extension ────────────────────────────────────────────────────────────────

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    resizableImage: {
      /** Insert an already-uploaded image by URL */
      setResizableImage: (attrs: {
        src: string
        alt?: string
        width?: string
        caption?: string
      }) => ReturnType
    }
  }
}

export const ResizableImage = Node.create({
  name: 'resizableImage',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: '' },
      width: { default: null },
      caption: { default: '' },
      uploadState: { default: 'idle' },
    }
  },

  parseHTML() {
    return [{ tag: 'figure[data-resizable-image]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const { src, alt, width, caption, uploadState } = HTMLAttributes as {
      src: string | null
      alt: string
      width: string | null
      caption: string
      uploadState: string
    }

    // Don't persist uploading/error states or blob URLs to HTML
    if (uploadState !== 'idle' || !src || src.startsWith('blob:')) {
      return ['figure', { 'data-resizable-image': '' }, 0]
    }

    const figAttrs: Record<string, string> = { 'data-resizable-image': '' }
    if (width) figAttrs['data-width'] = width
    if (caption) figAttrs['data-caption'] = caption

    const children: unknown[] = [
      ['img', mergeAttributes({ src, alt: alt ?? '', ...(width ? { style: `width:${width}` } : {}) })],
    ]
    if (caption) {
      children.push(['figcaption', {}, caption])
    }

    return ['figure', figAttrs, ...children]
  },

  addCommands() {
    return {
      setResizableImage:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { ...attrs, uploadState: 'idle' },
          }),
    }
  },

  addNodeView() {
    // Lazily imported to avoid circular dependency at module load time.
    // The NodeView component lives in the components layer which imports from here.
    const { ResizableImageNodeView } = require('@/components/editor/resizable-image-node-view') as typeof import('@/components/editor/resizable-image-node-view')
    return ReactNodeViewRenderer(ResizableImageNodeView)
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('resizable-image-paste'),
        props: {
          handlePaste(view, event) {
            const file = getImageFileFromDataTransfer(event.clipboardData)
            if (!file) return false
            event.preventDefault()
            void performOptimisticInsert(view, file)
            return true
          },
        },
      }),
    ]
  },
})
