import type { Extensions } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Heading from '@tiptap/extension-heading'
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

import { CodeBlockCustom } from './code-block-custom'
import { Callout } from './callout-extension'
import { TableOfContents } from './toc-extension'
import { RawHtml } from './raw-html-extension'
import { ResizableImage } from './resizable-image-extension'
import { Analogy } from './analogy-extension'
import { SummaryBox } from './summary-box-extension'
import { TaskBox } from './task-box-extension'
import { FlowItem, FlowList } from './flow-list-extension'
import { MiniCard, TwoCol } from './two-col-extension'
import { Diagram } from './diagram-extension'
import { McqQuiz } from './mcq-quiz-extension'
import { slugify } from './slugify'

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
      heading: false,
    }),
    Heading.extend({
      parseHTML() {
        return [1, 2, 3, 4, 5].map((level) => ({
          tag: `h${level}`,
          attrs: { level },
        }))
      },
      renderHTML({ node, HTMLAttributes }) {
        const level = node.attrs.level as number
        const id = slugify(node.textContent) || `h${level}`
        return [`h${level}`, { ...HTMLAttributes, id }, 0]
      },
    }).configure({ levels: [1, 2, 3, 4, 5] }),
    CodeBlockCustom.configure({
      lowlight,
      defaultLanguage: null,
      // Avoid language-* classes on <code>; prevents any theme/CSS from surfacing the label
      languageClassPrefix: null,
      enableTabIndentation: true,
      exitOnTripleEnter: true,
      exitOnArrowDown: true,
      HTMLAttributes: {
        class: 'hljs',
      },
    }),
    ResizableImage,
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
    Callout,
    MiniCard,
    TwoCol,
    FlowItem,
    FlowList,
    Analogy,
    SummaryBox,
    TaskBox,
    Diagram,
    McqQuiz,
    TableOfContents,
    RawHtml,
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
