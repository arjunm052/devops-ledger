// @vitest-environment node
import { slugify } from '@/lib/tiptap/slugify'

describe('slugify', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('strips non-alphanumeric characters', () => {
    expect(slugify('The Architecture!')).toBe('the-architecture')
  })

  it('collapses multiple hyphens', () => {
    expect(slugify('foo  --  bar')).toBe('foo-bar')
  })

  it('strips leading and trailing hyphens', () => {
    expect(slugify('  hello  ')).toBe('hello')
  })

  it('returns empty string for whitespace-only input', () => {
    expect(slugify('   ')).toBe('')
  })

  it('handles numbers', () => {
    expect(slugify('Step 1: Install Docker')).toBe('step-1-install-docker')
  })

  it('handles unicode by stripping non-ASCII non-word chars', () => {
    expect(slugify('Hello: World')).toBe('hello-world')
  })
})
