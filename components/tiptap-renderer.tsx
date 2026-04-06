'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import Youtube from '@tiptap/extension-youtube'
import Typography from '@tiptap/extension-typography'
import { common, createLowlight } from 'lowlight'
import dockerfile from 'highlight.js/lib/languages/dockerfile'
import nginx from 'highlight.js/lib/languages/nginx'

const lowlight = createLowlight(common)
lowlight.register('dockerfile', dockerfile)
lowlight.register('nginx', nginx)

interface TiptapRendererProps {
  content: any
}

export default function TiptapRenderer({ content }: TiptapRendererProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Image,
      Link.configure({
        openOnClick: true,
      }),
      Table.configure({
        resizable: false,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Youtube.configure({
        inline: false,
      }),
      Typography,
    ],
    content,
    editable: false,
    immediatelyRender: false,
  })

  return (
    <div
      className={[
        'prose prose-lg max-w-none',
        'prose-headings:font-[family-name:var(--font-space-grotesk)]',
        'prose-p:font-[family-name:var(--font-newsreader)]',
        'prose-pre:bg-slate-900 prose-pre:text-slate-100',
      ].join(' ')}
    >
      <EditorContent editor={editor} />
    </div>
  )
}
