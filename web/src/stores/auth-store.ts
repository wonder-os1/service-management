import { create } from "zustand"
import { User } from "@/types"
import { getStoredUser, logout as authLogout, fetchCurrentUser } from "@/lib/auth"

interface AuthState {
  user: User | null
  isLoading: boolean
  setUser: (user: User | null) => void
  loadUser: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  setUser: (user) => set({ user }),

  loadUser: async () => {
    set({ isLoading: true })
    try {
      const storedUser = getStoredUser()
      if (storedUser) {
        set({ user: storedUser, isLoading: false })
        // Fetch fresh user data in background
        try {
          const freshUser = await fetchCurrentUser()
          set({ user: freshUser })
        } catch {
          // If token is invalid, stored user is cleared by the interceptor
        }
      } else {
        set({ user: null, isLoading: false })
      }
    } catch {
      set({ user: null, isLoading: false })
    }
  },

  logout: async () => {
    set({ user: null })
    await authLogout()
  },
}))
