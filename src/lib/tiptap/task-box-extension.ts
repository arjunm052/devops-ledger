import { Node, mergeAttributes, type RawCommands, type CommandProps } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { TaskBoxNodeView } from '@/components/editor/task-box-node'

export type TaskDifficulty = '1' | '2' | '3'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    taskBox: {
      setTaskBox: (attrs?: Partial<{
        badge: string
        taskTitle: string
        difficulty: TaskDifficulty
        timeEstimate: string
      }>) => ReturnType
    }
  }
}

function parseDifficulty(el: HTMLElement): TaskDifficulty {
  const diff = el.querySelector('.task-diff')
  if (diff?.classList.contains('diff-2')) return '2'
  if (diff?.classList.contains('diff-3')) return '3'
  return '1'
}


export const TaskBox = Node.create({
  name: 'taskBox',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      badge: {
        default: 'Practice',
        parseHTML: (el) =>
          el.querySelector('.task-badge')?.textContent?.trim() ?? 'Practice',
      },
      taskTitle: {
        default: '',
        parseHTML: (el) =>
          el.querySelector('.task-title')?.textContent?.trim() ?? '',
      },
      difficulty: {
        default: '1' as TaskDifficulty,
        parseHTML: (el) => parseDifficulty(el as HTMLElement),
      },
      timeEstimate: {
        default: '',
        parseHTML: (el) =>
          el.querySelector('.task-time')?.textContent?.trim() ?? '',
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div.task-box' }]
  },

  renderHTML({ node }) {
    return [
      'div',
      mergeAttributes({
        class: 'task-box',
        'data-type': 'taskBox',
        'data-badge': node.attrs.badge as string,
        'data-task-title': node.attrs.taskTitle as string,
        'data-difficulty': node.attrs.difficulty as string,
        'data-time-estimate': node.attrs.timeEstimate as string,
      }),
      0,
    ]
  },

  addCommands(): Partial<RawCommands> {
    return {
      setTaskBox:
        (attrs) =>
        (props: CommandProps) => {
          return props.commands.insertContent({
            type: this.name,
            attrs: {
              badge: attrs?.badge ?? 'Practice',
              taskTitle: attrs?.taskTitle ?? 'Task',
              difficulty: attrs?.difficulty ?? '1',
              timeEstimate: attrs?.timeEstimate ?? '15 min',
            },
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Instructions go here.' }],
              },
            ],
          })
        },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(TaskBoxNodeView)
  },
})
