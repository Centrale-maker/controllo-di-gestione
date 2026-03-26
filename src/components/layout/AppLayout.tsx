import { Outlet } from 'react-router-dom'
import { useIsMobile } from '@/hooks/useIsMobile'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import TopBar from './TopBar'

export default function AppLayout() {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <div className="min-h-dvh bg-[#F8FAFC]">
        <TopBar />
        <main className="pb-16">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="flex h-dvh bg-[#F8FAFC]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
