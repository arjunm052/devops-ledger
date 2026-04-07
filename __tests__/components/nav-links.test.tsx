import { render, screen } from '@testing-library/react'
import { NavLinks } from '@/components/nav-links'

// Mock usePathname so we control the active route
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}))

import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Home' },
  { href: '/tags', label: 'Tags' },
  { href: '/about', label: 'About' },
]

describe('NavLinks', () => {
  it('renders all links', () => {
    vi.mocked(usePathname).mockReturnValue('/')
    render(<NavLinks links={links} />)
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Tags')).toBeInTheDocument()
    expect(screen.getByText('About')).toBeInTheDocument()
  })

  it('marks the current path as active', () => {
    vi.mocked(usePathname).mockReturnValue('/tags')
    render(<NavLinks links={links} />)
    const tagsLink = screen.getByText('Tags').closest('a')
    expect(tagsLink).toHaveAttribute('data-active', 'true')
  })

  it('does not mark non-current paths as active', () => {
    vi.mocked(usePathname).mockReturnValue('/tags')
    render(<NavLinks links={links} />)
    const homeLink = screen.getByText('Home').closest('a')
    expect(homeLink).toHaveAttribute('data-active', 'false')
  })
})
