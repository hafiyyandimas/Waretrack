import { createFileRoute } from '@tanstack/react-router'
import { Reports } from '../components/Reports'

export const Route = createFileRoute('/reports')({
  component: Reports,
})