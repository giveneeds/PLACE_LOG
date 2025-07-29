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
      const role = await getUserRole(authUser.id)
      const userWithRole: UserWithRole = { ...authUser, role: role || undefined }
      setUser(userWithRole)
      setUserRole(role)
    } else {
      setUser(null)
      setUserRole(null)
    }
  }

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      await updateUserWithRole(user)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await updateUserWithRole(session?.user ?? null)
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