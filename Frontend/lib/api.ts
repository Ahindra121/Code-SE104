import { getStoredToken } from "@/lib/auth"

export type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api"

export class ApiError extends Error {
  status: number
  data: unknown

  constructor(message: string, status: number, data: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.data = data
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = typeof window !== "undefined" ? getStoredToken() : null
  const headers = new Headers(options.headers)

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json")
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  const result = await response.json().catch(() => ({
    success: false,
    message: "Không đọc được phản hồi từ máy chủ",
    data: null,
  }))

  if (!response.ok || !result.success) {
    throw new ApiError(result.message ?? "Có lỗi xảy ra", response.status, result)
  }

  return result
}
