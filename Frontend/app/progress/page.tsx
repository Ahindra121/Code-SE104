"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { apiFetch } from "@/lib/api"
import { getStoredUser, redirectPathForRole, roleLabel } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  Award,
  BarChart3,
  BookOpen,
  Calendar,
  ChevronRight,
  GraduationCap,
  Home,
  Menu,
  Settings,
  Target,
  TrendingUp,
  Users,
  X,
} from "lucide-react"

const sidebarItems = [
  { name: "Bảng điều khiển", icon: Home, href: "/dashboard", active: false },
  { name: "Khóa học", icon: BookOpen, href: "/search", active: false },
  { name: "Tiến độ", icon: BarChart3, href: "/progress", active: true },
  { name: "Chứng chỉ", icon: Award, href: "/certificates", active: false },
  { name: "Cộng đồng", icon: Users, href: "/community", active: false },
  { name: "Cài đặt", icon: Settings, href: "/profile", active: false },
]

type Course = {
  id: number
  title: string
  lessons_count: number
  instructor?: {
    username: string
    full_name?: string | null
  } | null
}

type Enrollment = {
  id: number
  course_id: number
  status: string
  enrolled_at: string
  course: Course | null
}

type StudentReport = {
  enrollments: number
  progress_records: {
    course_id: number
    lesson_id: number
    is_completed: boolean
  }[]
  quiz_attempts: {
    lesson_id: number
    score: number
    passed: boolean
  }[]
  certificates: {
    course_id: number
    certificate_code: string
  }[]
}

export default function ProgressPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [auth, setAuth] = useState<{ username: string; role: string } | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [report, setReport] = useState<StudentReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const user = getStoredUser()
    if (!user) {
      router.push("/login")
      return
    }

    if (user.role !== "student") {
      router.push(redirectPathForRole(user.role))
      return
    }

    setAuth({ username: user.username, role: roleLabel(user.role) })

    async function loadProgress() {
      try {
        setLoading(true)
        setError(null)

        const [enrollmentsRes, reportRes] = await Promise.all([
          apiFetch<Enrollment[]>("/enrollments/mine"),
          apiFetch<StudentReport>("/reports/student"),
        ])

        setEnrollments(enrollmentsRes.data)
        setReport(reportRes.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không tải được tiến độ")
      } finally {
        setLoading(false)
      }
    }

    loadProgress()
  }, [router])

  const courseProgress = useMemo(() => {
    return enrollments.filter((enrollment) => ["active", "completed"].includes(enrollment.status)).map((enrollment) => {
      const course = enrollment.course
      const completed =
        report?.progress_records.filter((item) => item.course_id === enrollment.course_id && item.is_completed)
          .length ?? 0
      const total = course?.lessons_count ?? 0
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0

      return { enrollment, course, completed, total, percent }
    })
  }, [enrollments, report])

  async function handleCancelEnrollment(enrollment: Enrollment) {
    if (!window.confirm("Hủy đăng ký khóa học này? Bạn chỉ có thể hủy khi chưa bắt đầu học.")) return

    try {
      setCancellingId(enrollment.id)
      setError(null)
      const result = await apiFetch<Enrollment>(`/enrollments/${enrollment.id}/cancel`, { method: "PATCH" })
      setEnrollments((prev) => prev.map((item) => (item.id === enrollment.id ? result.data : item)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không hủy được đăng ký khóa học")
    } finally {
      setCancellingId(null)
    }
  }

  if (!auth || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Đang tải tiến độ...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="font-medium text-destructive">{error}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Tải lại
          </Button>
        </div>
      </div>
    )
  }

  const totalCompletedLessons = report?.progress_records.filter((item) => item.is_completed).length ?? 0
  const passedQuizzes = report?.quiz_attempts.filter((item) => item.passed).length ?? 0
  const averageProgress =
    courseProgress.length > 0
      ? Math.round(courseProgress.reduce((sum, item) => sum + item.percent, 0) / courseProgress.length)
      : 0
  const certificateCount = report?.certificates.length ?? 0

  return (
    <div className="min-h-screen bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 h-full w-64 bg-sidebar text-sidebar-foreground transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
                <GraduationCap className="h-5 w-5 text-sidebar-primary-foreground" />
              </div>
              <span className="text-xl font-bold">LearnHub</span>
            </Link>
            <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            {sidebarItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                  item.active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </nav>

          <div className="border-t border-sidebar-border p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src="" />
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
                  {auth.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{auth.username}</p>
                <p className="text-sm text-sidebar-foreground/70">{auth.role}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 h-16 border-b border-border bg-card/95 backdrop-blur">
          <div className="flex h-full items-center gap-4 px-4 lg:px-8">
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-semibold text-foreground">Tiến độ học tập</h1>
          </div>
        </header>

        <main className="p-4 lg:p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">Theo dõi hành trình học của bạn</h2>
            <p className="mt-1 text-muted-foreground">Dữ liệu được lấy từ tiến độ bài học và quiz trong hệ thống.</p>
          </div>

          <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tiến độ trung bình</p>
                    <p className="mt-1 text-3xl font-bold text-foreground">{averageProgress}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Bài đã hoàn thành</p>
                    <p className="mt-1 text-3xl font-bold text-foreground">{totalCompletedLessons}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Quiz đã vượt qua</p>
                    <p className="mt-1 text-3xl font-bold text-foreground">{passedQuizzes}</p>
                  </div>
                  <Target className="h-8 w-8 text-amber-700" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Chứng chỉ</p>
                    <p className="mt-1 text-3xl font-bold text-foreground">{certificateCount}</p>
                  </div>
                  <Award className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tiến độ theo khóa học</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {courseProgress.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <p className="text-muted-foreground">Bạn chưa đăng ký khóa học nào.</p>
                  <Button className="mt-4" asChild>
                    <Link href="/search">Tìm khóa học</Link>
                  </Button>
                </div>
              ) : (
                courseProgress.map(({ enrollment, course, completed, total, percent }) => (
                  <div key={enrollment.id} className="rounded-lg border border-border p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{course?.title || "Khóa học"}</h3>
                        <p className="text-sm text-muted-foreground">
                          {course?.instructor?.full_name || course?.instructor?.username || "Giảng viên"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {completed === 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleCancelEnrollment(enrollment)}
                            disabled={cancellingId === enrollment.id}
                          >
                            {cancellingId === enrollment.id ? "Đang hủy..." : "Hủy đăng ký"}
                          </Button>
                        )}
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/course/${enrollment.course_id}?returnTo=/progress`}>
                            Tiếp tục học <ChevronRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {completed}/{total} bài học
                        </span>
                        <span className="font-medium text-foreground">{percent}%</span>
                      </div>
                      <Progress value={percent} className="h-2.5" />
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Đăng ký ngày {new Date(enrollment.enrolled_at).toLocaleDateString("vi-VN")}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
