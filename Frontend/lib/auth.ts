export type LearnHubUser = {
  id: number
  email: string
  username: string
  full_name?: string | null
  phone?: string | null
  bio?: string | null
  role: "student" | "instructor" | "admin"
  is_active: boolean
  deleted_at?: string | null
  admin_locked_at?: string | null
  admin_locked_reason?: string | null
  created_at?: string
  updated_at?: string
}

const TOKEN_KEY = "learnhub-auth-token"
const USER_KEY = "learnhub-user"
const LEGACY_DEMO_KEY = "learnhub-demo-auth"

export function roleLabel(role: LearnHubUser["role"]) {
  if (role === "admin") return "Quản trị viên"
  if (role === "instructor") return "Giảng viên"
  return "Học viên"
}

export function saveAuth(token: string, user: LearnHubUser) {
  // Ignore old demo/local auth on purpose. A user must log in in the current browser session.
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(LEGACY_DEMO_KEY)
  sessionStorage.setItem(TOKEN_KEY, token)
  sessionStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function updateStoredUser(user: LearnHubUser) {
  if (!getStoredToken()) return
  sessionStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function getStoredToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function getStoredUser(): LearnHubUser | null {
  if (!getStoredToken()) return null

  const stored = sessionStorage.getItem(USER_KEY)
  if (!stored) return null

  try {
    const user = JSON.parse(stored)
    if (!user?.username || !user?.role) return null
    return user
  } catch {
    return null
  }
}

export function clearAuth() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(LEGACY_DEMO_KEY)
}

export function redirectPathForRole(role: LearnHubUser["role"]) {
  if (role === "admin") return "/admin"
  if (role === "instructor") return "/instructor"
  return "/dashboard"
}
