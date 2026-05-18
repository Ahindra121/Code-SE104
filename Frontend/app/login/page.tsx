"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { GraduationCap, Eye, EyeOff, Mail, Lock, ArrowLeft } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { LearnHubUser, redirectPathForRole, saveAuth } from "@/lib/auth"

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [reactivationMessage, setReactivationMessage] = useState<string | null>(null)
  const [reactivationReason, setReactivationReason] = useState("")
  const [showReactivationOptions, setShowReactivationOptions] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false,
  })
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({})

  const validateForm = () => {
    const newErrors: { username?: string; password?: string } = {}

    if (!formData.username) {
      newErrors.username = "Vui lòng nhập tên tài khoản hoặc email"
    }

    if (!formData.password) {
      newErrors.password = "Vui lòng nhập mật khẩu"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    setReactivationMessage(null)

    try {
      const result = await apiFetch<{
        access_token: string
        token_type: string
        user: LearnHubUser
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      })

      saveAuth(result.data.access_token, result.data.user)
      router.push(redirectPathForRole(result.data.user.role))
    } catch (error) {
      const message = error instanceof Error ? error.message : "Tên tài khoản hoặc mật khẩu không đúng"
      if (
        message.includes("disabled") ||
        message.includes("locked") ||
        message.includes("scheduled for deletion") ||
        message.includes("approval") ||
        message.includes("reactivated") ||
        message.includes("vô hiệu hóa") ||
        message.includes("chờ xóa") ||
        message.includes("duyệt") ||
        message.includes("mở lại")
      ) {
        setShowReactivationOptions(true)
      }
      setErrors({ username: message, password: message })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReactivateAccount = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    setReactivationMessage(null)

    try {
      const result = await apiFetch<{
        access_token: string
        token_type: string
        user: LearnHubUser
      }>("/auth/reactivate", {
        method: "POST",
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      })

      saveAuth(result.data.access_token, result.data.user)
      setReactivationMessage("Đã mở lại tài khoản thành công.")
      setShowReactivationOptions(false)
      router.push(redirectPathForRole(result.data.user.role))
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không mở lại được tài khoản"
      if (message.includes("approval") || message.includes("admin") || message.includes("duyệt")) {
        setShowReactivationOptions(true)
      }
      setErrors({ username: message, password: message })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitReactivationRequest = async () => {
    if (!validateForm()) return
    if (reactivationReason.trim().length < 10) {
      const message = "Vui lòng nhập lý do ít nhất 10 ký tự"
      setErrors({ username: message, password: message })
      return
    }

    setIsLoading(true)
    setReactivationMessage(null)

    try {
      await apiFetch("/auth/reactivation-requests", {
        method: "POST",
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          reason: reactivationReason.trim(),
        }),
      })
      setReactivationMessage("Đã gửi yêu cầu mở lại tài khoản. Vui lòng chờ admin duyệt.")
      setShowReactivationOptions(false)
      setReactivationReason("")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không gửi được yêu cầu mở lại tài khoản"
      setErrors({ username: message, password: message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại trang chủ
          </Link>

          <Card className="border-0 shadow-xl">
            <CardHeader className="space-y-1 pb-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-foreground">LearnHub</span>
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">Đăng nhập</CardTitle>
              <CardDescription className="text-muted-foreground">
                Nhập thông tin tài khoản để tiếp tục học tập
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-foreground">Tên tài khoản hoặc Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Nhập tên tài khoản hoặc email"
                      className={`pl-10 ${errors.username ? "border-destructive" : ""}`}
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                    />
                  </div>
                  {errors.username && (
                    <p className="text-sm text-destructive">{errors.username}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-foreground">Mật khẩu</Label>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-primary hover:underline"
                    >
                      Quên mật khẩu?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Nhập mật khẩu"
                      className={`pl-10 pr-10 ${errors.password ? "border-destructive" : ""}`}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={formData.rememberMe}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, rememberMe: checked as boolean })
                    }
                  />
                  <Label
                    htmlFor="remember"
                    className="text-sm text-muted-foreground cursor-pointer"
                  >
                    Ghi nhớ đăng nhập
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
                </Button>

                {reactivationMessage && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                    {reactivationMessage}
                  </div>
                )}

                {showReactivationOptions && (
                  <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">Tài khoản này chưa thể đăng nhập</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Nếu bạn tự vô hiệu hóa hoặc xóa tài khoản, có thể mở lại ngay. Nếu admin vô hiệu hóa, hãy gửi lý do để admin duyệt.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      size="lg"
                      disabled={isLoading}
                      onClick={handleReactivateAccount}
                    >
                      Mở lại tài khoản
                    </Button>

                    <div className="space-y-2">
                      <Label htmlFor="reactivationReason" className="text-foreground">Lý do mở lại nếu tài khoản bị admin vô hiệu hóa</Label>
                      <Textarea
                        id="reactivationReason"
                        rows={3}
                        value={reactivationReason}
                        onChange={(e) => setReactivationReason(e.target.value)}
                        placeholder="Nhập lý do để admin xem xét mở lại tài khoản..."
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        className="w-full"
                        disabled={isLoading}
                        onClick={handleSubmitReactivationRequest}
                      >
                        Gửi yêu cầu admin duyệt
                      </Button>
                    </div>
                  </div>
                )}

                <div className="rounded-2xl border border-border bg-muted/50 p-4 text-sm text-muted-foreground mt-4">
                  <p className="font-medium text-foreground mb-2">Tài khoản demo</p>
                  <ul className="space-y-1">
                    <li>admin123 / Demo@123 (Quản trị viên)</li>
                    <li>instructor123 / Demo@123 (Giảng viên)</li>
                    <li>student123 / Demo@123 (Học viên)</li>
                  </ul>
                </div>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-card px-4 text-muted-foreground">
                      Hoặc đăng nhập với
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" type="button" className="w-full">
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Google
                  </Button>
                  <Button variant="outline" type="button" className="w-full">
                    <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    Facebook
                  </Button>
                </div>

                <p className="text-center text-sm text-muted-foreground mt-6">
                  Chưa có tài khoản?{" "}
                  <Link href="/register" className="text-primary hover:underline font-medium">
                    Đăng ký ngay
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Side - Image/Illustration */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 items-center justify-center p-12">
        <div className="max-w-lg text-center">
          <div className="mb-8">
            <div className="w-64 h-64 mx-auto bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
              <GraduationCap className="h-32 w-32 text-primary" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Chào mừng trở lại!
          </h2>
          <p className="text-lg text-muted-foreground">
            Tiếp tục hành trình học tập của bạn với hàng nghìn khóa học chất lượng cao từ các giảng viên hàng đầu.
          </p>
        </div>
      </div>
    </div>
  )
}
