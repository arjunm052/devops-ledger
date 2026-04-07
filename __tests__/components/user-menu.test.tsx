import { render, screen, fireEvent } from '@testing-library/react'
import { UserMenu } from '@/components/user-menu'

const baseProps = {
  email: 'arjun@example.com',
  userName: 'Arjun Meena',
  avatarUrl: null,
  isAuthor: false,
}

// Helper — open the dropdown by clicking the trigger button
function openMenu() {
  fireEvent.click(screen.getByRole('button'))
}

describe('UserMenu', () => {
  it('renders initials in the trigger avatar', () => {
    render(<UserMenu {...baseProps} />)
    // AvatarFallback in the trigger is always visible (not portal-rendered)
    // getAllByText because initials also appear in the dropdown header when open
    expect(screen.getAllByText('AM')[0]).toBeInTheDocument()
  })

  it('does not show author items when isAuthor is false', () => {
    render(<UserMenu {...baseProps} />)
    openMenu()
    expect(screen.queryByText('New Article')).not.toBeInTheDocument()
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
  })

  it('shows author items when isAuthor is true', () => {
    render(<UserMenu {...baseProps} isAuthor={true} />)
    openMenu()
    expect(screen.getByText('New Article')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('shows role badge when isAuthor is true', () => {
    render(<UserMenu {...baseProps} isAuthor={true} />)
    openMenu()
    expect(screen.getByText('✦ Author')).toBeInTheDocument()
  })

  it('does not show role badge when isAuthor is false', () => {
    render(<UserMenu {...baseProps} isAuthor={false} />)
    openMenu()
    expect(screen.queryByText('✦ Author')).not.toBeInTheDocument()
  })

  it('always renders Settings and Sign Out', () => {
    render(<UserMenu {...baseProps} />)
    openMenu()
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('Sign Out')).toBeInTheDocument()
  })
})
