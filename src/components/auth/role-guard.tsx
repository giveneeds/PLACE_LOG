'use client'

import { useAuth } from '@/components/auth-provider'
import { UserRole, hasPermission } from '@/lib/auth/rbac'
import { ReactNode } from 'react'

interface RoleGuardProps {
  children: ReactNode
  requiredRole: UserRole
  fallback?: ReactNode
}

export function RoleGuard({ children, requiredRole, fallback }: RoleGuardProps) {
  const { userRole, loading } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  if (!hasPermission(userRole, requiredRole)) {
    return fallback || <div>Access denied. You don&apos;t have permission to view this content.</div>
  }

  return <>{children}</>
}

interface AdminOnlyProps {
  children: ReactNode
  fallback?: ReactNode
}

export function AdminOnly({ children, fallback }: AdminOnlyProps) {
  return (
    <RoleGuard requiredRole="admin" fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

interface AuthenticatedOnlyProps {
  children: ReactNode
  fallback?: ReactNode
}

export function AuthenticatedOnly({ children, fallback }: AuthenticatedOnlyProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return fallback || <div>Please log in to view this content.</div>
  }

  return <>{children}</>
}