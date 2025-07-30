import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

export type UserRole = 'admin' | 'user'

export interface UserWithRole extends User {
  role?: UserRole
}

export async function getUserRole(userId: string): Promise<UserRole | null> {
  const supabase = createClient()
  
  try {
    console.log('Fetching user role for:', userId)
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    console.log('Profile query result:', { profile, error })

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - user doesn't have a profile yet
        console.log('No profile found for user, defaulting to user role')
        return 'user'
      }
      console.error('Error fetching user role:', error)
      return 'user' // Default to user role instead of null
    }

    if (!profile) {
      console.log('Profile is null, defaulting to user role')
      return 'user'
    }

    console.log('User role found:', profile.role)
    return profile.role as UserRole
  } catch (error) {
    console.error('Unexpected error fetching user role:', error)
    return 'user' // Default to user role instead of null
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