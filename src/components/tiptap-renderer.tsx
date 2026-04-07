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
      className={[
        'prose prose-invert max-w-none',
        'prose-headings:font-[family-name:var(--font-plus-jakarta-sans)] prose-headings:text-[var(--color-heading)]',
        'prose-p:font-[family-name:var(--font-plus-jakarta-sans)] prose-p:text-[#b0b8c9] prose-p:text-[15px] prose-p:leading-[1.7]',
        'prose-li:font-[family-name:var(--font-plus-jakarta-sans)] prose-li:text-[var(--color-body)]',
        '[&_ul]:font-[family-name:var(--font-plus-jakarta-sans)] [&_ol]:font-[family-name:var(--font-plus-jakarta-sans)]',
        'prose-strong:text-[var(--color-heading)]',
        'prose-a:text-[#60a5fa] hover:prose-a:text-[#93c5fd]',
        'prose-code:text-[#93c5fd] prose-code:bg-[#1e2433] prose-code:border prose-code:border-[#252d3d] prose-code:rounded prose-code:px-[5px] prose-code:py-[1px] prose-code:font-[family-name:var(--font-jetbrains-mono)] prose-code:text-[12.5px] prose-code:font-normal prose-code:before:content-none prose-code:after:content-none',
        'prose-blockquote:border-l-[var(--color-link)] prose-blockquote:text-[var(--color-muted-text)]',
        'prose-pre:bg-transparent prose-pre:p-0',
        '[&_pre_code]:bg-transparent [&_pre_code]:border-0 [&_pre_code]:p-0 [&_pre_code]:text-inherit [&_pre_code]:text-[13px] [&_pre_code]:leading-[1.85] [&_pre_code]:rounded-none',
        '[&_.code-block-wrapper_code]:bg-transparent [&_.code-block-wrapper_code]:border-0 [&_.code-block-wrapper_code]:p-0 [&_.code-block-wrapper_code]:text-[#e2e8f0] [&_.code-block-wrapper_code]:text-[13px] [&_.code-block-wrapper_code]:leading-[1.85] [&_.code-block-wrapper_code]:rounded-none',
        '[&_.code-block-wrapper_code]:before:content-none [&_.code-block-wrapper_code]:after:content-none',
        // Task lists
        '[&_ul[data-type=taskList]]:list-none [&_ul[data-type=taskList]]:pl-0',
        '[&_ul[data-type=taskList]_li]:flex [&_ul[data-type=taskList]_li]:gap-2 [&_ul[data-type=taskList]_li]:items-start',
        '[&_ul[data-type=taskList]_li_label]:mt-1 [&_ul[data-type=taskList]_li_input]:pointer-events-none',
        // Highlight
        '[&_mark]:bg-[rgba(255,184,108,0.3)] [&_mark]:rounded-sm [&_mark]:px-0.5',
        // Images + captions
        '[&_figure]:my-6 [&_figure]:text-center',
        '[&_figure_img]:mx-auto [&_figure_img]:h-auto [&_figure_img]:rounded-md',
        '[&_figure_figcaption]:mt-2 [&_figure_figcaption]:font-[family-name:var(--font-inter)] [&_figure_figcaption]:text-sm [&_figure_figcaption]:italic [&_figure_figcaption]:text-[var(--color-muted-text)]',
      ].join(' ')}
    >
      <EditorContent editor={editor} />
    </div>
  )
}
