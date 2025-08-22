'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { UserRole, getUserRole, UserWithRole } from '@/lib/auth/rbac'

type AuthContextType = {
  user: UserWithRole | null
  loading: boolean
  userRole: UserRole | null
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  userRole: null,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserWithRole | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const updateUserWithRole = async (authUser: User | null) => {
    if (authUser) {
      try {
        console.log('Updating user with role for:', authUser.id)
        const role = await getUserRole(authUser.id)
        const userWithRole: UserWithRole = { ...authUser, role: role || 'user' }
        setUser(userWithRole)
        setUserRole(role || 'user')
        console.log('User updated with role:', role)
      } catch (error) {
        console.error('Error updating user with role:', error)
        // Set user without role in case of error
        const userWithRole: UserWithRole = { ...authUser, role: 'user' }
        setUser(userWithRole)
        setUserRole('user')
      }
    } else {
      setUser(null)
      setUserRole(null)
    }
  }

  useEffect(() => {
    const getUser = async () => {
      try {
        console.log('Getting initial user...')
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
          console.error('Error getting user:', error)
          // 에러가 있어도 로딩 상태를 해제
          setUser(null)
          setUserRole(null)
        } else {
          console.log('Initial user:', user?.id || 'No user')
          await updateUserWithRole(user)
        }
      } catch (error) {
        console.error('Unexpected error getting user:', error)
        setUser(null)
        setUserRole(null)
      } finally {
        // 항상 로딩 상태를 해제
        setLoading(false)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id || 'No user')
      
      // 로딩 상태 관리 개선
      if (event === 'SIGNED_IN') {
        try {
          setLoading(true)
          await updateUserWithRole(session?.user ?? null)
        } catch (error) {
          console.error('Error in SIGNED_IN handler:', error)
        } finally {
          setLoading(false)
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setUserRole(null)
        setLoading(false)
      } else if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        try {
          await updateUserWithRole(session?.user ?? null)
        } catch (error) {
          console.error('Error in TOKEN_REFRESHED/USER_UPDATED handler:', error)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  return (
    <AuthContext.Provider value={{ user, userRole, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}