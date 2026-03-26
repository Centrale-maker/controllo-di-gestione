import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/hooks/useAuth'
import AuthGuard from '@/components/AuthGuard'
import AppLayout from '@/components/layout/AppLayout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Analytics from '@/pages/Analytics'
import Upload from '@/pages/Upload'

function ComingSoon({ page }: { page: string }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-lg font-medium text-[#64748B]">{page} — in arrivo</p>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Route protette da autenticazione */}
          <Route element={<AuthGuard />}>
            <Route element={<AppLayout />}>

              {/* Accessibili a tutti gli utenti autenticati */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/analytics" element={<Analytics />} />
<Route path="/upload" element={<Upload />} />
              <Route path="/storico" element={<ComingSoon page="Storico" />} />
              <Route path="/settings" element={<ComingSoon page="Impostazioni" />} />

            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
