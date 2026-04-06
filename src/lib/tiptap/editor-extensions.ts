import type { Extensions } from '@tiptap/core'
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
import Placeholder from '@tiptap/extension-placeholder'
import { common, createLowlight } from 'lowlight'
import dockerfile from 'highlight.js/lib/languages/dockerfile'
import nginx from 'highlight.js/lib/languages/nginx'

const lowlight = createLowlight(common)
lowlight.register('dockerfile', dockerfile)
lowlight.register('nginx', nginx)

export { lowlight }

export interface CreateEditorExtensionsOptions {
  /** When set, adds Placeholder extension */
  placeholder?: string
  /** Passed to Link.configure */
  linkOpenOnClick: boolean
}

/**
 * Shared Tiptap extensions for the post editor and read-only renderer.
 * Keeps lowlight languages and code-block options in sync.
 */
export function createEditorExtensions(
  options: CreateEditorExtensionsOptions
): Extensions {
  const exts: Extensions = [
    StarterKit.configure({
      codeBlock: false,
    }),
    CodeBlockLowlight.configure({
      lowlight,
      defaultLanguage: 'typescript',
      enableTabIndentation: true,
      exitOnTripleEnter: true,
      exitOnArrowDown: true,
      HTMLAttributes: {
        class: 'hljs',
      },
    }),
    Image.configure({
      allowBase64: false,
    }),
    Link.configure({
      openOnClick: options.linkOpenOnClick,
    }),
    Table.configure({ resizable: false }),
    TableRow,
    TableHeader,
    TableCell,
    Youtube.configure({ inline: false }),
    Typography,
  ]

  if (options.placeholder !== undefined) {
    exts.push(
      Placeholder.configure({
        placeholder: options.placeholder,
      })
    )
  }

  return exts
}
