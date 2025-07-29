import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

export type UserRole = 'admin' | 'user'

export interface UserWithRole extends User {
  role?: UserRole
}

export async function getUserRole(userId: string): Promise<UserRole | null> {
  const supabase = createClient()
  
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      return null
    }

    return profile.role as UserRole
  } catch (error) {
    console.error('Error fetching user role:', error)
    return null
  }
}

export function hasPermission(userRole: UserRole | null, requiredRole: UserRole): boolean {
  if (!userRole) return false
  
  const roleHierarchy: Record<UserRole, number> = {
    user: 1,
    admin: 2,
  }
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

export function canAccessAdminFeatures(userRole: UserRole | null): boolean {
  return hasPermission(userRole, 'admin')
}

export function canViewMarketingMemos(userRole: UserRole | null): boolean {
  return hasPermission(userRole, 'user')
}

export function canManageUsers(userRole: UserRole | null): boolean {
  return hasPermission(userRole, 'admin')
}

export function canManageData(userRole: UserRole | null): boolean {
  return hasPermission(userRole, 'admin')
}