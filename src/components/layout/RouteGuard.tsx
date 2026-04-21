import { Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

const DEV_MODE = import.meta.env.DEV

export function RouteGuard({ allowedRole, children }: { allowedRole: string; children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()
  const [params] = useSearchParams()

  // Dev bypass: add ?dev=player or ?dev=coach or ?dev=parent to skip auth
  const devRole = params.get('dev')
  if (DEV_MODE && devRole && devRole === allowedRole) {
    return <>{children}</>
  }

  if (loading) return <div className="min-h-screen bg-[#0A0A0B]" />

  if (!user) return <Navigate to="/" replace />

  if (profile && profile.role !== allowedRole) {
    return <Navigate to={`/${profile.role === 'player' ? 'player' : profile.role === 'coach' ? 'coach' : 'parent'}/home`} replace />
  }

  return <>{children}</>
}
