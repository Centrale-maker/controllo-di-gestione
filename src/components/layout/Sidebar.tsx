import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  BarChart2,
  Upload,
  History,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface NavItem {
  path: string
  label: string
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { path: '/analytics', label: 'Analytics', icon: <BarChart2 size={20} /> },
  { path: '/storico', label: 'Storico', icon: <History size={20} /> },
  { path: '/settings', label: 'Impostazioni', icon: <Settings size={20} /> },
  { path: '/upload', label: 'Upload', icon: <Upload size={20} /> },
]

export default function Sidebar() {
  const { profile, role, isSuperAdmin, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(() =>
    localStorage.getItem('sidebar-collapsed') === 'true'
  )

  function toggle() {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('sidebar-collapsed', String(next))
  }

  const initials = profile?.full_name?.charAt(0)?.toUpperCase() ?? '?'

  return (
    <aside
      className={`relative flex flex-col h-full bg-[#1E3A5F] text-white shrink-0 transition-[width] duration-200 overflow-hidden ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Pulsante toggle */}
      <button
        onClick={toggle}
        title={collapsed ? 'Espandi menu' : 'Comprimi menu'}
        className="absolute -right-3 top-[22px] z-20 w-6 h-6 rounded-full bg-white border border-[#E2E8F0] shadow flex items-center justify-center text-[#1E3A5F] hover:bg-[#F1F5F9] transition-colors"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Logo */}
      <div
        className={`flex items-center border-b border-white/10 shrink-0 ${
          collapsed ? 'justify-center px-0 py-5' : 'gap-3 px-6 py-5'
        }`}
      >
        <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
          <span className="text-sm font-bold">IGS</span>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">Financial Dashboard</p>
            <p className="text-xs text-white/60 truncate">Italian Global Solution</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
              } ${
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            {item.icon}
            {!collapsed && item.label}
          </NavLink>
        ))}

        {isSuperAdmin && (
          <>
            {!collapsed && (
              <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                Sistema
              </p>
            )}
            {collapsed && <div className="my-2 border-t border-white/10" />}
            <NavLink
              to="/super-admin"
              title={collapsed ? 'Super Admin' : undefined}
              className={({ isActive }) =>
                `flex items-center rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
                } ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <ShieldCheck size={20} />
              {!collapsed && 'Super Admin'}
            </NavLink>
          </>
        )}
      </nav>

      {/* User info + logout */}
      <div className="px-2 py-4 border-t border-white/10 shrink-0">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
              title={profile?.full_name ?? 'Utente'}
            >
              <span className="text-xs font-semibold">{initials}</span>
            </div>
            <button
              onClick={logout}
              title="Esci"
              className="p-2.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </aside>
  )
}
