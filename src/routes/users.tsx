import { createFileRoute, redirect } from '@tanstack/react-router'
import { Users } from '../components/Users'
 
export const Route = createFileRoute('/users')({
  beforeLoad: () => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem('auth_user') || sessionStorage.getItem('auth_user')
    if (!stored) return redirect({ to: '/login' })
    const user = JSON.parse(stored)
    const ok = user?.role === 'Admin' || user?.role === 'Super Admin'
    if (!ok) return redirect({ to: '/' })
  },
  component: Users,
})
 