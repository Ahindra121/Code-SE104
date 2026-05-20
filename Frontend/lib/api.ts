import { getStoredToken } from "@/lib/auth"

export type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
}

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api"
export const API_BASE_URL = API_URL.replace(/\/api\/?$/, "")

function getErrorMessage(result: any) {
  if (typeof result?.message === "string") return result.message
  if (typeof result?.detail === "string") return result.detail
  if (Array.isArray(result?.detail)) {
    return result.detail
      .map((item: any) => item?.msg)
      .filter(Boolean)
      .join(". ")
  }
  return "Có lỗi xảy ra"
}

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

  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData
  if (!headers.has("Content-Type") && options.body && !isFormData) {
    headers.set("Content-Type", "application/json")
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    })
  } catch (error) {
    throw new ApiError(
      "Không kết nối được máy chủ. Vui lòng kiểm tra backend đang chạy và cấu hình NEXT_PUBLIC_API_URL.",
      0,
      error
    )
  }

  const result = await response.json().catch(() => ({
    success: false,
    message: "Không đọc được phản hồi từ máy chủ",
    data: null,
  }))

  if (!response.ok || !result.success) {
    throw new ApiError(getErrorMessage(result), response.status, result)
  }

  return result
}
