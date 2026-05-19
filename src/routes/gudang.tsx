import { createFileRoute, redirect } from '@tanstack/react-router'
import { Gudang } from '../components/Gudang'

export const Route = createFileRoute('/gudang')({
  beforeLoad: () => {
    const stored = localStorage.getItem('auth_user') || sessionStorage.getItem('auth_user')
    if (!stored) throw redirect({ to: '/login' })
    const user = JSON.parse(stored)
    if (user.role !== 'Admin' && user.role !== 'Staff Gudang') throw redirect({ to: '/' })
  },
  component: Gudang,
})