'use client'

import { useEditor, EditorContent, type Content } from '@tiptap/react'
import { createEditorExtensions } from '@/lib/tiptap/editor-extensions'

interface TiptapRendererProps {
  // Tiptap JSON document — typed as unknown to accept Supabase's Json type
  content: unknown
}

export default function TiptapRenderer({ content }: TiptapRendererProps) {
  const editor = useEditor({
    extensions: createEditorExtensions({ linkOpenOnClick: true }),
    content: content as Content,
    editable: false,
    immediatelyRender: false,
  })

  return (
    <div
      className="max-w-none"
    >
      <EditorContent editor={editor} />
    </div>
  )
}
