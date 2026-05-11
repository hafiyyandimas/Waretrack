import { createFileRoute, redirect } from '@tanstack/react-router'
import { Users } from '../components/Users'

export const Route = createFileRoute('/users')({
  beforeLoad: () => {
    const stored = localStorage.getItem('auth_user') || sessionStorage.getItem('auth_user')
    if (!stored) throw redirect({ to: '/login' })
    const user = JSON.parse(stored)
    if (user.role !== 'Super Admin') throw redirect({ to: '/' })
  },
  component: Users,
})