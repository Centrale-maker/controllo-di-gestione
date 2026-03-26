import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import type { UserRole } from '@/types'

interface Props {
  minRole: 'editor' | 'admin'
}

function roleLevel(role: UserRole | null): number {
  if (role === 'admin') return 2
  if (role === 'editor') return 1
  return 0
}

const MIN_LEVEL: Record<'editor' | 'admin', number> = { editor: 1, admin: 2 }

export default function RoleGuard({ minRole }: Props) {
  const { role } = useAuth()
  if (roleLevel(role) < MIN_LEVEL[minRole]) return <Navigate to="/dashboard" replace />
  return <Outlet />
}
