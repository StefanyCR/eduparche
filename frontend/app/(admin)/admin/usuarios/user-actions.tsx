'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import type { UserStatus } from '@/lib/types'

type Action = {
  label: string
  nextStatus: UserStatus
  variant: 'success' | 'danger' | 'default'
}

const ACTIONS: Partial<Record<UserStatus, Action[]>> = {
  PENDING_APPROVAL: [
    { label: 'Aprobar',   nextStatus: 'ACTIVE',   variant: 'success' },
    { label: 'Rechazar',  nextStatus: 'REJECTED',  variant: 'danger'  },
  ],
  ACTIVE: [
    { label: 'Desactivar', nextStatus: 'INACTIVE', variant: 'danger' },
  ],
  INACTIVE: [
    { label: 'Reactivar', nextStatus: 'ACTIVE', variant: 'success' },
  ],
  REJECTED: [
    { label: 'Reactivar', nextStatus: 'ACTIVE', variant: 'success' },
  ],
}

const variantClass: Record<string, string> = {
  success: 'text-success border-success/30 hover:bg-success-bg',
  danger:  'text-danger  border-danger/30  hover:bg-danger-bg',
  default: 'text-secondary border-border   hover:bg-surface-high',
}

export default function UserActions({
  userId,
  status,
}: {
  userId: string
  status: UserStatus
}) {
  const router   = useRouter()
  const [loading, setLoading] = useState(false)
  const actions = ACTIONS[status] ?? []

  if (actions.length === 0) return null

  async function handleAction(nextStatus: UserStatus) {
    setLoading(true)
    try {
      await api.patch(`/users/${userId}/status`, { status: nextStatus })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      {actions.map((action) => (
        <button
          key={action.nextStatus}
          disabled={loading}
          onClick={() => handleAction(action.nextStatus)}
          className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors disabled:opacity-50 ${variantClass[action.variant]}`}
        >
          {action.label}
        </button>
      ))}
    </div>
  )
}
