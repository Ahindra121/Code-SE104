export type LearnHubUser = {
  id: number
  email: string
  username: string
  full_name?: string | null
  role: "student" | "instructor" | "admin"
  is_active: boolean
}

export function roleLabel(role: LearnHubUser["role"]) {
  if (role === "admin") return "Quản trị viên"
  if (role === "instructor") return "Giảng viên"
  return "Học viên"
}

function legacyRoleLabel(role: LearnHubUser["role"]) {
  if (role === "admin") return "Quáº£n trá»‹ viÃªn"
  if (role === "instructor") return "Giáº£ng viÃªn"
  return "Há»c viÃªn"
}

export function saveAuth(token: string, user: LearnHubUser) {
  localStorage.setItem("learnhub-auth-token", token)
  localStorage.setItem("learnhub-user", JSON.stringify(user))
  localStorage.setItem(
    "learnhub-demo-auth",
    JSON.stringify({
      username: user.username,
      role: legacyRoleLabel(user.role),
      apiRole: user.role,
    })
  )
}

export function getStoredToken(): string | null {
  return localStorage.getItem("learnhub-auth-token")
}

export function getStoredUser(): LearnHubUser | null {
  if (!getStoredToken()) return null

  const stored = localStorage.getItem("learnhub-user")
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
  localStorage.removeItem("learnhub-auth-token")
  localStorage.removeItem("learnhub-user")
  localStorage.removeItem("learnhub-demo-auth")
}

export function redirectPathForRole(role: LearnHubUser["role"]) {
  if (role === "admin") return "/admin"
  if (role === "instructor") return "/instructor"
  return "/dashboard"
}
