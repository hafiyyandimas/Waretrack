import { createFileRoute, redirect } from '@tanstack/react-router'
import { Gudang } from '../components/Gudang'

export const Route = createFileRoute('/gudang')({
  beforeLoad: () => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem('auth_user') || sessionStorage.getItem('auth_user')
    if (!stored) return redirect({ to: '/login' })
    const user = JSON.parse(stored)
    const ok = user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Staff Gudang'
    if (!ok) return redirect({ to: '/' })
  },
  component: Gudang,
})