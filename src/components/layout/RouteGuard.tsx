import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export function RouteGuard({ allowedRole, children }: { allowedRole: string; children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()

  if (loading) return <div className="min-h-screen bg-[#0A0A0B]" />

  if (!user) return <Navigate to="/" replace />

  if (profile && profile.role !== allowedRole) {
    return <Navigate to={`/${profile.role === 'player' ? 'player' : profile.role === 'coach' ? 'coach' : 'parent'}/home`} replace />
  }

  return <>{children}</>
}
