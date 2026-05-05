import api from "./api"
import { User } from "@/types"

interface LoginPayload {
  email: string
  password: string
}

interface RegisterPayload {
  name: string
  email: string
  password: string
  phone?: string
  role?: "PROVIDER" | "STAFF" | "CLIENT"
}

export async function login(payload: LoginPayload): Promise<{ user: User }> {
  const { data } = await api.post("/auth/login", payload)
  const result = data.data || data
  // Token is now set as httpOnly cookie by the server
  localStorage.setItem("user", JSON.stringify(result.user))
  return { user: result.user }
}

export async function register(payload: RegisterPayload): Promise<{ user: User }> {
  const body = {
    ...payload,
    role: payload.role || "CLIENT",
  }
  const { data } = await api.post("/auth/register", body)
  const result = data.data || data
  // Token is now set as httpOnly cookie by the server
  localStorage.setItem("user", JSON.stringify(result.user))
  return { user: result.user }
}

export async function fetchCurrentUser(): Promise<User> {
  const { data } = await api.get("/auth/me")
  const user = data.data || data
  localStorage.setItem("user", JSON.stringify(user))
  return user
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null
  const user = localStorage.getItem("user")
  if (!user) return null
  try {
    return JSON.parse(user)
  } catch {
    return null
  }
}

export async function logout(): Promise<void> {
  try {
    await api.post("/auth/logout")
  } catch {
    // Continue with local cleanup even if API call fails
  }
  localStorage.removeItem("user")
  window.location.href = "/auth/login"
}

export function isAuthenticated(): boolean {
  return !!getStoredUser()
}
