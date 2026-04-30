import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  BarChart2,
  Upload,
  TrendingUp,
  Calculator,
} from 'lucide-react'

const NAV_ITEMS = [
  { path: '/dashboard',     label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { path: '/analytics',     label: 'Analytics', icon: <BarChart2 size={20} /> },
  { path: '/budget',        label: 'Budget',    icon: <Calculator size={20} /> },
  { path: '/upload',        label: 'Costi',     icon: <Upload size={20} /> },
  { path: '/upload-ricavi', label: 'Ricavi',    icon: <TrendingUp size={20} /> },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E2E8F0] safe-area-pb">
      <div className="flex items-stretch justify-around h-16 px-1">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[44px] transition-colors ${
                isActive ? 'text-[#1E3A5F]' : 'text-[#64748B]'
              }`
            }
          >
            {item.icon}
            <span className="text-[10px] font-medium leading-none">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
