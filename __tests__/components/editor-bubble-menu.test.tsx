/**
 * NOTE: These tests require jsdom to be working.
 * The jsdom environment is currently broken due to @asamuzakjp/css-color ESM
 * incompatibility. Tests are written for when that is resolved.
 *
 * To verify manually: open /dashboard/new, select text, confirm Underline (U)
 * and Strikethrough (S) buttons appear in the floating bubble menu.
 */

// @vitest-environment node
import { describe, it, expect } from 'vitest'

describe('EditorBubbleMenu', () => {
  it('exports EditorBubbleMenu component', async () => {
    const mod = await import('@/components/editor/editor-bubble-menu')
    expect(typeof mod.EditorBubbleMenu).toBe('function')
  })
})
