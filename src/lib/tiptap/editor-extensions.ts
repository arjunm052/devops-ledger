import type { Extensions } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import Youtube from '@tiptap/extension-youtube'
import Typography from '@tiptap/extension-typography'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import { common, createLowlight } from 'lowlight'
import dockerfile from 'highlight.js/lib/languages/dockerfile'
import nginx from 'highlight.js/lib/languages/nginx'
import yaml from 'highlight.js/lib/languages/yaml'
import ini from 'highlight.js/lib/languages/ini'
import powershell from 'highlight.js/lib/languages/powershell'

import { Markdown } from 'tiptap-markdown'

import { CodeBlockCustom } from './code-block-custom'
import { Callout } from './callout-extension'
import { TableOfContents } from './toc-extension'

const lowlight = createLowlight(common)
lowlight.register('dockerfile', dockerfile)
lowlight.register('nginx', nginx)
lowlight.register('yaml', yaml)
lowlight.register('ini', ini)
lowlight.register('powershell', powershell)

export { lowlight }

export interface CreateEditorExtensionsOptions {
  placeholder?: string
  linkOpenOnClick: boolean
}

export function createEditorExtensions(
  options: CreateEditorExtensionsOptions
): Extensions {
  const exts: Extensions = [
    StarterKit.configure({
      codeBlock: false,
    }),
    CodeBlockCustom.configure({
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
    CharacterCount,
    TaskList,
    TaskItem.configure({ nested: true }),
    Underline,
    Highlight.configure({ multicolor: false }),
    Markdown.configure({
      html: true,
      transformPastedText: true,
      transformCopiedText: true,
    }),
    Callout,
    TableOfContents,
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
