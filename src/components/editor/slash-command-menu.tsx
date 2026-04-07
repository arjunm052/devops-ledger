'use client'

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { Extension, type Editor, type Range } from '@tiptap/core'
import { ReactRenderer } from '@tiptap/react'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import tippy, { type Instance as TippyInstance } from 'tippy.js'
import {
  Type,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  ListChecks,
  Code2,
  Quote,
  Info,
  AlertTriangle,
  Lightbulb,
  ShieldAlert,
  Image,
  Table2,
  Minus,
  Video,
  ListTree,
  Sparkles,
  ClipboardList,
  FlaskConical,
  Workflow,
  Columns2,
  Shapes,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SlashCommandItem {
  title: string
  description: string
  icon: React.ReactNode
  command: (params: { editor: Editor; range: Range }) => void
}

// ─── Command list ─────────────────────────────────────────────────────────────

function buildItems(): SlashCommandItem[] {
  return [
    {
      title: 'Text',
      description: 'Plain paragraph',
      icon: <Type size={16} />,
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setParagraph().run(),
    },
    {
      title: 'Heading 2',
      description: 'Large section heading',
      icon: <Heading2 size={16} />,
      command: ({ editor, range }) =>
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setHeading({ level: 2 })
          .run(),
    },
    {
      title: 'Heading 3',
      description: 'Medium section heading',
      icon: <Heading3 size={16} />,
      command: ({ editor, range }) =>
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setHeading({ level: 3 })
          .run(),
    },
    {
      title: 'Heading 4',
      description: 'Small section heading',
      icon: <Heading4 size={16} />,
      command: ({ editor, range }) =>
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setHeading({ level: 4 })
          .run(),
    },
    {
      title: 'Bullet List',
      description: 'Unordered list',
      icon: <List size={16} />,
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleBulletList().run(),
    },
    {
      title: 'Numbered List',
      description: 'Ordered list',
      icon: <ListOrdered size={16} />,
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
    },
    {
      title: 'Task List',
      description: 'Checklist items',
      icon: <ListChecks size={16} />,
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleTaskList().run(),
    },
    {
      title: 'Code Block',
      description: 'Syntax-highlighted code',
      icon: <Code2 size={16} />,
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
    },
    {
      title: 'Blockquote',
      description: 'Highlight a quote',
      icon: <Quote size={16} />,
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
    },
    {
      title: 'Callout Info',
      description: 'Blue informational callout',
      icon: <Info size={16} />,
      command: ({ editor, range }) =>
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setCallout({ type: 'info' })
          .run(),
    },
    {
      title: 'Callout Warning',
      description: 'Yellow warning callout',
      icon: <AlertTriangle size={16} />,
      command: ({ editor, range }) =>
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setCallout({ type: 'warning' })
          .run(),
    },
    {
      title: 'Callout Tip',
      description: 'Green tip callout',
      icon: <Lightbulb size={16} />,
      command: ({ editor, range }) =>
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setCallout({ type: 'tip' })
          .run(),
    },
    {
      title: 'Callout Danger',
      description: 'Red danger callout',
      icon: <ShieldAlert size={16} />,
      command: ({ editor, range }) =>
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setCallout({ type: 'danger' })
          .run(),
    },
    {
      title: 'Image',
      description: 'Upload or embed an image',
      icon: <Image size={16} />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run()
        window.dispatchEvent(new CustomEvent('editor:insert-image'))
      },
    },
    {
      title: 'Table',
      description: '3×3 grid table',
      icon: <Table2 size={16} />,
      command: ({ editor, range }) =>
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run(),
    },
    {
      title: 'Divider',
      description: 'Horizontal rule',
      icon: <Minus size={16} />,
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
    },
    {
      title: 'YouTube',
      description: 'Embed a YouTube video',
      icon: <Video size={16} />,
      command: ({ editor, range }) => {
        const url = window.prompt('YouTube URL:')
        if (url) {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .setYoutubeVideo({ src: url })
            .run()
        } else {
          editor.chain().focus().deleteRange(range).run()
        }
      },
    },
    {
      title: 'Table of Contents',
      description: 'Auto-generated TOC',
      icon: <ListTree size={16} />,
      command: ({ editor, range }) =>
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertTableOfContents()
          .run(),
    },
    {
      title: 'Analogy box',
      description: 'Teal analogy callout (study template)',
      icon: <Sparkles size={16} />,
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setAnalogy().run(),
    },
    {
      title: 'Section summary',
      description: 'Gradient summary box with bullets',
      icon: <ClipboardList size={16} />,
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setSummaryBox().run(),
    },
    {
      title: 'Practice task',
      description: 'Purple task / lab box',
      icon: <FlaskConical size={16} />,
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setTaskBox().run(),
    },
    {
      title: 'Flow steps',
      description: 'Numbered step cards',
      icon: <Workflow size={16} />,
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setFlowList().run(),
    },
    {
      title: 'Two-column cards',
      description: 'Side-by-side mini cards',
      icon: <Columns2 size={16} />,
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setTwoCol().run(),
    },
    {
      title: 'Diagram (SVG)',
      description: 'Titled SVG diagram block',
      icon: <Shapes size={16} />,
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setDiagram().run(),
    },
  ]
}

function filterItems(items: SlashCommandItem[], query: string) {
  if (!query) return items
  const q = query.toLowerCase()
  return items.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
  )
}

// ─── Menu Component ───────────────────────────────────────────────────────────

export interface SlashCommandMenuRef {
  onKeyDown: (event: KeyboardEvent) => boolean
}

interface SlashCommandMenuProps {
  items: SlashCommandItem[]
  command: (item: SlashCommandItem) => void
}

const SlashCommandMenu = forwardRef<SlashCommandMenuRef, SlashCommandMenuProps>(
  function SlashCommandMenu({ items, command }, ref) {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)

    // Reset selection when items change
    const itemsLen = items.length
    useEffect(() => {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedIndex(0)
    }, [itemsLen])

    // Scroll selected item into view
    useEffect(() => {
      const container = containerRef.current
      if (!container) return
      const selected = container.querySelector<HTMLButtonElement>(
        '[data-selected="true"]'
      )
      selected?.scrollIntoView({ block: 'nearest' })
    }, [selectedIndex])

    const selectItem = useCallback(
      (index: number) => {
        const item = items[index]
        if (item) command(item)
      },
      [items, command]
    )

    useImperativeHandle(ref, () => ({
      onKeyDown: (event: KeyboardEvent) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex((i) => (i - 1 + items.length) % items.length)
          return true
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex((i) => (i + 1) % items.length)
          return true
        }
        if (event.key === 'Enter') {
          selectItem(selectedIndex)
          return true
        }
        return false
      },
    }))

    if (!items.length) {
      return (
        <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-muted-text)] shadow-lg">
          No results
        </div>
      )
    }

    return (
      <div
        ref={containerRef}
        className="max-h-80 overflow-y-auto rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-1 shadow-lg"
        style={{ minWidth: 240 }}
      >
        {items.map((item, index) => (
          <button
            key={item.title}
            data-selected={index === selectedIndex}
            onMouseEnter={() => setSelectedIndex(index)}
            onMouseDown={(e) => {
              e.preventDefault()
              selectItem(index)
            }}
            className={`flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors ${
              index === selectedIndex
                ? 'bg-[var(--color-surface-raised)]'
                : 'hover:bg-[var(--color-surface-dim)]'
            }`}
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-dim)] text-[var(--color-muted-text)]">
              {item.icon}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-[var(--color-body)]">
                {item.title}
              </span>
              <span className="block truncate text-xs text-[var(--color-muted-text)]">
                {item.description}
              </span>
            </span>
          </button>
        ))}
      </div>
    )
  }
)

// ─── Tiptap Extension ─────────────────────────────────────────────────────────

const slashPluginKey = new PluginKey('slashCommand')

interface SlashState {
  active: boolean
  query: string
  range: Range | null
  decorationId: string | null
}

export const SlashCommands = Extension.create({
  name: 'slashCommands',

  addProseMirrorPlugins() {
    const editor = this.editor
    let component: ReactRenderer<SlashCommandMenuRef> | null = null
    let popup: TippyInstance[] | null = null

    function destroyPopup() {
      popup?.[0]?.destroy()
      component?.destroy()
      component = null
      popup = null
    }

    function showPopup(state: SlashState) {
      if (!state.range) return

      const items = filterItems(buildItems(), state.query)

      const props = {
        items,
        command: (item: SlashCommandItem) => {
          if (!state.range) return
          item.command({ editor, range: state.range })
          destroyPopup()
        },
      }

      if (component) {
        component.updateProps(props)
        return
      }

      component = new ReactRenderer(SlashCommandMenu, {
        editor,
        props,
      }) as ReactRenderer<SlashCommandMenuRef>

      const { from } = state.range
      const domRect = editor.view.coordsAtPos(from)

      const virtualEl = {
        getBoundingClientRect() {
          return {
            top: domRect.top,
            bottom: domRect.bottom,
            left: domRect.left,
            right: domRect.left,
            width: 0,
            height: domRect.bottom - domRect.top,
            x: domRect.left,
            y: domRect.top,
            toJSON() {
              return this
            },
          }
        },
      }

      popup = tippy('body', {
        getReferenceClientRect: virtualEl.getBoundingClientRect,
        appendTo: () => document.body,
        content: component.element,
        showOnCreate: true,
        interactive: true,
        trigger: 'manual',
        placement: 'bottom-start',
        animation: 'shift-away',
        theme: 'slash-menu',
        maxWidth: 'none',
        zIndex: 9999,
        onHide() {
          destroyPopup()
        },
      })
    }

    return [
      new Plugin({
        key: slashPluginKey,

        state: {
          init(): SlashState {
            return {
              active: false,
              query: '',
              range: null,
              decorationId: null,
            }
          },

          apply(tr, prev): SlashState {
            const meta = tr.getMeta(slashPluginKey) as
              | Partial<SlashState>
              | undefined
            if (meta !== undefined) {
              return { ...prev, ...meta }
            }
            if (!tr.docChanged) return prev
            if (prev.active && prev.range) {
              const from = tr.mapping.map(prev.range.from)
              const to = tr.mapping.map(prev.range.to)
              return { ...prev, range: { from, to } }
            }
            return prev
          },
        },

        props: {
          handleKeyDown(view, event) {
            const pluginState = slashPluginKey.getState(
              view.state
            ) as SlashState
            if (!pluginState.active) return false
            if (component?.ref) {
              return (
                component.ref as unknown as SlashCommandMenuRef
              ).onKeyDown(event)
            }
            return false
          },

          decorations(state) {
            const pluginState = slashPluginKey.getState(state) as SlashState
            if (!pluginState.active || !pluginState.range) return null
            return DecorationSet.create(state.doc, [
              Decoration.inline(pluginState.range.from, pluginState.range.to, {
                class: 'slash-command-active',
              }),
            ])
          },
        },

        view() {
          return {
            update(view) {
              const pluginState = slashPluginKey.getState(
                view.state
              ) as SlashState
              if (pluginState.active && pluginState.range) {
                const filteredItems = filterItems(
                  buildItems(),
                  pluginState.query
                )
                if (component) {
                  component.updateProps({
                    items: filteredItems,
                    command: (item: SlashCommandItem) => {
                      if (!pluginState.range) return
                      item.command({ editor, range: pluginState.range })
                      destroyPopup()
                    },
                  })
                } else {
                  showPopup(pluginState)
                }
              } else {
                destroyPopup()
              }
            },
            destroy() {
              destroyPopup()
            },
          }
        },
      }),

      // Input handler plugin
      new Plugin({
        props: {
          handleTextInput(view, from, to, text) {
            if (text !== '/') return false

            // Only activate at the start of a line or after whitespace
            const { doc } = view.state
            const $from = doc.resolve(from)
            const textBefore = $from.parent.textContent.slice(
              0,
              $from.parentOffset
            )

            if (textBefore.length > 0 && !/\s$/.test(textBefore)) return false

            // Let the default insert happen, then activate plugin state
            setTimeout(() => {
              const newFrom = from
              const newTo = newFrom + 1
              const tr = view.state.tr.setMeta(slashPluginKey, {
                active: true,
                query: '',
                range: { from: newFrom, to: newTo },
              })
              view.dispatch(tr)
            }, 0)

            return false
          },

          handleKeyDown(view, event) {
            const pluginState = slashPluginKey.getState(
              view.state
            ) as SlashState
            if (!pluginState.active) return false

            if (event.key === 'Escape') {
              view.dispatch(
                view.state.tr.setMeta(slashPluginKey, { active: false })
              )
              destroyPopup()
              return true
            }

            // Keep query in sync as user types
            if (
              event.key.length === 1 ||
              event.key === 'Backspace' ||
              event.key === 'Delete'
            ) {
              setTimeout(() => {
                const { selection } = view.state
                const pos = selection.from
                const $pos = view.state.doc.resolve(pos)
                const textBefore = $pos.parent.textContent.slice(
                  0,
                  $pos.parentOffset
                )
                const slashIndex = textBefore.lastIndexOf('/')
                if (slashIndex === -1) {
                  view.dispatch(
                    view.state.tr.setMeta(slashPluginKey, { active: false })
                  )
                  destroyPopup()
                  return
                }
                const newQuery = textBefore.slice(slashIndex + 1)
                const rangeFrom =
                  pos - $pos.parentOffset + slashIndex
                view.dispatch(
                  view.state.tr.setMeta(slashPluginKey, {
                    query: newQuery,
                    range: { from: rangeFrom, to: pos },
                  })
                )
              }, 0)
            }

            return false
          },
        },
      }),
    ]
  },
})
