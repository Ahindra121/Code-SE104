"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  GraduationCap,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  ArrowLeft,
  Check,
  X,
} from "lucide-react"
import { ApiError, apiFetch } from "@/lib/api"

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    role: "student",
    agreeTerms: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const passwordRequirements = [
    { label: "Ít nhất 8 ký tự", test: (p: string) => p.length >= 8 },
    { label: "Ít nhất 1 chữ hoa", test: (p: string) => /[A-Z]/.test(p) },
    { label: "Ít nhất 1 chữ thường", test: (p: string) => /[a-z]/.test(p) },
    { label: "Ít nhất 1 chữ số", test: (p: string) => /[0-9]/.test(p) },
  ]

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.fullName) {
      newErrors.fullName = "Vui lòng nhập họ và tên"
    } else if (/[0-9!@#$%^&*(),.?":{}|<>]/.test(formData.fullName)) {
      newErrors.fullName = "Họ và tên không được chứa số hoặc ký tự đặc biệt"
    }

    if (!formData.phone) {
      newErrors.phone = "Vui lòng nhập số điện thoại"
    } else if (!/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = "Số điện thoại phải có 10 chữ số"
    }

    if (!formData.email) {
      newErrors.email = "Vui lòng nhập email"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.username.trim()) {
      newErrors.username = "Vui lòng nhập tên tài khoản"
    } else if (formData.username.trim().length < 6) {
      newErrors.username = "Tên tài khoản phải có ít nhất 6 ký tự"
    }

    if (!formData.password) {
      newErrors.password = "Vui lòng nhập mật khẩu"
    } else if (!passwordRequirements.every((req) => req.test(formData.password))) {
      newErrors.password = "Mật khẩu chưa đáp ứng đủ yêu cầu"
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu"
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp"
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = "Bạn phải đồng ý với điều khoản sử dụng"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateStep2()) return

    setIsLoading(true)

    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          full_name: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          username: formData.username.trim(),
          password: formData.password,
          role: formData.role,
        }),
      })
      router.push("/login?registered=true")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể đăng ký tài khoản"
      if (error instanceof ApiError && error.status === 409 && message.toLowerCase().includes("email")) {
        setStep(1)
        setErrors({ email: message })
      } else {
        setErrors({ username: message })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Image/Illustration */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-accent/10 via-primary/5 to-primary/10 items-center justify-center p-12">
        <div className="max-w-lg text-center">
          <div className="mb-8">
            <div className="w-64 h-64 mx-auto bg-gradient-to-br from-accent/20 to-primary/20 rounded-full flex items-center justify-center">
              <GraduationCap className="h-32 w-32 text-accent" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Bắt đầu hành trình học tập
          </h2>
        </div>
      </div>

      {/* Right Side - Form */}
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
              <CardTitle className="text-2xl font-bold text-foreground">Đăng ký tài khoản</CardTitle>
              <CardDescription className="text-muted-foreground">
                Bước {step}/2: {step === 1 ? "Thông tin cá nhân" : "Tài khoản đăng nhập"}
              </CardDescription>

              {/* Progress indicator */}
              <div className="flex gap-2 pt-2">
                <div className={`h-1 flex-1 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
                <div className={`h-1 flex-1 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {step === 1 && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-foreground">Họ và tên</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="fullName"
                          type="text"
                          placeholder="Nguyễn Văn A"
                          className={`pl-10 ${errors.fullName ? "border-destructive" : ""}`}
                          value={formData.fullName}
                          onChange={(e) =>
                            setFormData({ ...formData, fullName: e.target.value })
                          }
                        />
                      </div>
                      {errors.fullName && (
                        <p className="text-sm text-destructive">{errors.fullName}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-foreground">Số điện thoại</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="0901234567"
                          className={`pl-10 ${errors.phone ? "border-destructive" : ""}`}
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                        />
                      </div>
                      {errors.phone && (
                        <p className="text-sm text-destructive">{errors.phone}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-foreground">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="example@email.com"
                          className={`pl-10 ${errors.email ? "border-destructive" : ""}`}
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                        />
                      </div>
                      {errors.email && (
                        <p className="text-sm text-destructive">{errors.email}</p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Label className="text-foreground">Vai trò</Label>
                      <RadioGroup
                        value={formData.role}
                        onValueChange={(value) =>
                          setFormData({ ...formData, role: value })
                        }
                        className="grid grid-cols-2 gap-4"
                      >
                        <div>
                          <RadioGroupItem
                            value="student"
                            id="student"
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor="student"
                            className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                          >
                            <User className="mb-2 h-6 w-6" />
                            <span className="text-sm font-medium">Học viên</span>
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem
                            value="instructor"
                            id="instructor"
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor="instructor"
                            className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                          >
                            <GraduationCap className="mb-2 h-6 w-6" />
                            <span className="text-sm font-medium">Giảng viên</span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <Button
                      type="button"
                      className="w-full"
                      size="lg"
                      onClick={handleNext}
                    >
                      Tiếp tục
                    </Button>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-foreground">Tên tài khoản</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="username"
                          type="text"
                          placeholder="username123"
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
                      <p className="text-xs text-muted-foreground">
                        Ít nhất 6 ký tự
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-foreground">Mật khẩu</Label>
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

                      {/* Password requirements */}
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        {passwordRequirements.map((req, index) => (
                          <div
                            key={index}
                            className={`flex items-center gap-1.5 text-xs ${
                              req.test(formData.password)
                                ? "text-green-600"
                                : "text-muted-foreground"
                            }`}
                          >
                            {req.test(formData.password) ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <X className="h-3 w-3" />
                            )}
                            {req.label}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-foreground">Xác nhận mật khẩu</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Nhập lại mật khẩu"
                          className={`pl-10 pr-10 ${errors.confirmPassword ? "border-destructive" : ""}`}
                          value={formData.confirmPassword}
                          onChange={(e) =>
                            setFormData({ ...formData, confirmPassword: e.target.value })
                          }
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                      )}
                    </div>

                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="terms"
                        checked={formData.agreeTerms}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, agreeTerms: checked as boolean })
                        }
                        className="mt-1"
                      />
                      <Label
                        htmlFor="terms"
                        className="text-sm text-muted-foreground cursor-pointer leading-relaxed"
                      >
                        Tôi đồng ý với{" "}
                        <Link href="/terms" className="text-primary hover:underline">
                          Điều khoản sử dụng
                        </Link>{" "}
                        và{" "}
                        <Link href="/privacy" className="text-primary hover:underline">
                          Chính sách bảo mật
                        </Link>
                      </Label>
                    </div>
                    {errors.agreeTerms && (
                      <p className="text-sm text-destructive">{errors.agreeTerms}</p>
                    )}

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setStep(1)}
                      >
                        Quay lại
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1"
                        size="lg"
                        disabled={isLoading}
                      >
                        {isLoading ? "Đang đăng ký..." : "Đăng ký"}
                      </Button>
                    </div>
                  </>
                )}

                <p className="text-center text-sm text-muted-foreground mt-6">
                  Đã có tài khoản?{" "}
                  <Link href="/login" className="text-primary hover:underline font-medium">
                    Đăng nhập ngay
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
