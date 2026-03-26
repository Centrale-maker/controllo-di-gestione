import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  BarChart2,
  Upload,
  History,
  Settings,
  LogOut,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface NavItem {
  path: string
  label: string
  icon: React.ReactNode
  minRole?: 'editor' | 'admin'
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { path: '/analytics', label: 'Analytics', icon: <BarChart2 size={20} /> },
  { path: '/upload', label: 'Upload', icon: <Upload size={20} />, minRole: 'editor' },
  { path: '/storico', label: 'Storico', icon: <History size={20} />, minRole: 'admin' },
  { path: '/settings', label: 'Impostazioni', icon: <Settings size={20} />, minRole: 'admin' },
]


export default function Sidebar() {
  const { profile, role, logout } = useAuth()
  const visibleItems = NAV_ITEMS
  const initials = profile?.full_name?.charAt(0)?.toUpperCase() ?? '?'

  return (
    <aside className="flex flex-col w-64 h-full bg-[#1E3A5F] text-white shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
          <span className="text-sm font-bold">IGS</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">Financial Dashboard</p>
          <p className="text-xs text-white/60 truncate">Italian Global Solution</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold">{initials}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{profile?.full_name ?? 'Utente'}</p>
            <p className="text-xs text-white/60 capitalize">{role ?? ''}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut size={20} />
          Esci
        </button>
      </div>
    </aside>
  )
}
