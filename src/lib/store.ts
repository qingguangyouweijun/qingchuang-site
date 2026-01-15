import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Profile, ContactPool } from './types'

interface AuthState {
  user: { id: string; email: string } | null
  profile: Profile | null
  contact: ContactPool | null
  isLoading: boolean
  isAuthenticated: boolean
  
  setUser: (user: { id: string; email: string } | null) => void
  setProfile: (profile: Profile | null) => void
  setContact: (contact: ContactPool | null) => void
  setLoading: (loading: boolean) => void
  updateBalance: (newBalance: number) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      contact: null,
      isLoading: true,
      isAuthenticated: false,
      
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user,
        isLoading: false 
      }),
      
      setProfile: (profile) => set({ profile }),
      
      setContact: (contact) => set({ contact }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      updateBalance: (newBalance) => set((state) => ({
        profile: state.profile ? { ...state.profile, balance: newBalance } : null
      })),
      
      logout: () => set({ 
        user: null, 
        profile: null, 
        contact: null,
        isAuthenticated: false 
      }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
)
