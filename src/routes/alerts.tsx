import { createFileRoute } from '@tanstack/react-router'
import { Alerts } from '../components/Alerts'

export const Route = createFileRoute('/alerts')({
  component: Alerts,
})