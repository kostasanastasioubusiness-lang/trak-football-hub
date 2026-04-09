import { Home, PlusCircle, Target, Award, User, Users, Calendar, Activity, Bell } from 'lucide-react'
import type { Role } from '@/lib/types'

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
}

function getNavItems(role: Role): NavItem[] {
  if (role === 'player') return [
    { label: 'Home', path: '/player/home', icon: <Home size={18} /> },
    { label: 'Log', path: '/player/log', icon: <PlusCircle size={18} /> },
    { label: 'Goals', path: '/player/goals', icon: <Target size={18} /> },
    { label: 'Medals', path: '/player/medals', icon: <Award size={18} /> },
    { label: 'Profile', path: '/player/profile', icon: <User size={18} /> },
  ]
  if (role === 'coach') return [
    { label: 'Home', path: '/coach/home', icon: <Home size={18} /> },
    { label: 'Squad', path: '/coach/squad', icon: <Users size={18} /> },
    { label: 'Sessions', path: '/coach/sessions', icon: <Calendar size={18} /> },
    { label: 'Profile', path: '/coach/profile', icon: <User size={18} /> },
  ]
  return [
    { label: 'Home', path: '/parent/home', icon: <Home size={18} /> },
    { label: 'Matches', path: '/parent/matches', icon: <Activity size={18} /> },
    { label: 'Goals', path: '/parent/goals', icon: <Target size={18} /> },
    { label: 'Alerts', path: '/parent/alerts', icon: <Bell size={18} /> },
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
      className="fixed bottom-0 left-0 right-0 flex justify-around items-center px-4 py-2 border-t border-white/[0.07] z-50"
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
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
              isActive ? 'text-[#C8F25A]' : 'text-white/35'
            }`}
          >
            {item.icon}
            <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 500, fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              {item.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
