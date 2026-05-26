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
        </div>
      </div>
    </div>
  )
}
