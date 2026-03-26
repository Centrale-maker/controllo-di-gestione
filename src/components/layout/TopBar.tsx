import { useLocation } from 'react-router-dom'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/analytics': 'Analytics',
  '/scadenze': 'Scadenze',
  '/fornitori': 'Fornitori',
  '/upload': 'Upload',
  '/storico': 'Storico',
  '/settings': 'Impostazioni',
}

export default function TopBar() {
  const { pathname } = useLocation()
  const title = PAGE_TITLES[pathname] ?? 'IGS Dashboard'

  return (
    <header className="sticky top-0 z-40 flex items-center h-14 px-4 bg-white border-b border-[#E2E8F0] shrink-0">
      <h1 className="text-lg font-semibold text-[#1A202C]">{title}</h1>
    </header>
  )
}
