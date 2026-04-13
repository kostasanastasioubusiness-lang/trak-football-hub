import type { Role } from '@/lib/types'

interface NavItem {
  label: string
  path: string
  emoji: string
}

function getNavItems(role: Role): NavItem[] {
  if (role === 'player') return [
    { label: 'Home', path: '/player/home', emoji: '\u{1F3E0}' },
    { label: 'Log', path: '/player/logchoose', emoji: '\u{270F}\u{FE0F}' },
    { label: 'Goals', path: '/player/goals', emoji: '\u{1F3AF}' },
    { label: 'Medals', path: '/player/medals', emoji: '\u{1F3C5}' },
    { label: 'Profile', path: '/player/profile', emoji: '\u{1F464}' },
  ]
  if (role === 'coach') return [
    { label: 'Home', path: '/coach/home', emoji: '\u{1F3E0}' },
    { label: 'Squad', path: '/coach/squad', emoji: '\u{1F465}' },
    { label: 'Sessions', path: '/coach/sessions', emoji: '\u{1F4C5}' },
    { label: 'Assess', path: '/coach/assess', emoji: '\u{2B50}' },
  ]
  return [
    { label: 'Home', path: '/parent/home', emoji: '\u{1F3E0}' },
    { label: 'Matches', path: '/parent/matches', emoji: '\u{26BD}' },
    { label: 'Goals', path: '/parent/goals', emoji: '\u{1F3AF}' },
    { label: 'Alerts', path: '/parent/alerts', emoji: '\u{1F514}' },
  ]
}

interface NavBarProps {
  role: Role
  activeTab: string
  onNavigate: (path: string) => void
}

export function NavBar({ role, activeTab, onNavigate }: NavBarProps) {
  const items = getNavItems(role)
  return (
    <nav
      className="fixed bottom-0 w-full max-w-[430px] mx-auto left-1/2 -translate-x-1/2 flex justify-around items-center px-4 py-2 border-t border-white/[0.07] z-50"
      style={{
        background: 'rgba(10, 10, 11, 0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
      }}
    >
      {items.map(item => {
        const isActive = activeTab === item.path
        return (
          <button
            key={item.path}
            onClick={() => onNavigate(item.path)}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all relative"
            style={{
              background: isActive ? 'rgba(200,242,90,0.06)' : 'transparent',
              minWidth: 52,
            }}
          >
            <span className="text-[16px] leading-none" style={{ filter: isActive ? 'none' : 'grayscale(1) opacity(0.4)' }}>
              {item.emoji}
            </span>
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontWeight: 500,
                fontSize: '9px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase' as const,
                color: isActive ? '#C8F25A' : 'rgba(255,255,255,0.35)',
              }}
            >
              {item.label}
            </span>
            {isActive && (
              <span
                className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                style={{ background: '#C8F25A' }}
              />
            )}
          </button>
        )
      })}
    </nav>
  )
}
