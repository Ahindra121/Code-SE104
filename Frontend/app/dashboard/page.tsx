"use client"
import { apiFetch } from "@/lib/api"
import { getCourseThumbnailUrl } from "@/lib/course-thumbnail"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  GraduationCap,
  BookOpen,
  Award,
  Settings,
  Bell,
  Play,
  Clock,
  ChevronRight,
  TrendingUp,
  Calendar,
  Star,
  Menu,
  X,
  Home,
  BarChart3,
  Users,
} from "lucide-react"
import { clearAuth, getStoredUser, redirectPathForRole, roleLabel, LearnHubUser } from "@/lib/auth"
import { LogoutButton } from "@/components/logout-button"

const notifications = [
  {
    id: 1,
    type: "achievement",
    title: "New Achievement Unlocked!",
    message: "You&apos;ve completed 100 lessons. Keep it up!",
    time: "1 hour ago",
    read: false,
  },
  {
    id: 2,
    type: "course",
    title: "New Content Available",
    message: "Web Development Bootcamp has 5 new lessons",
    time: "3 hours ago",
    read: false,
  },
  {
    id: 3,
    type: "reminder",
    title: "Continue Learning",
    message: "You haven&apos;t studied Spanish in 3 days",
    time: "1 day ago",
    read: true,
  },
]

const sidebarItems = [
  { name: "Bảng điều khiển", icon: Home, href: "/dashboard", active: true },
  { name: "Khóa học", icon: BookOpen, href: "/search", active: false },
  { name: "Tiến độ", icon: BarChart3, href: "/progress", active: false },
  { name: "Chứng chỉ", icon: Award, href: "/certificates", active: false },
  { name: "Cộng đồng", icon: Users, href: "/community", active: false },
  { name: "Cài đặt", icon: Settings, href: "/profile", active: false },
]

type BackendCourse = {
  id: number
  title: string
  category: string
  description?: string | null
  price: number
  thumbnail_url?: string | null
  level: string
  rating: number
  reviews_count: number
  students_count: number
  lessons_count: number
  instructor?: {
    id: number
    username: string
    full_name?: string | null
  } | null
}

type Enrollment = {
  id: number
  student_id: number
  course_id: number
  status: string
  enrolled_at: string
  course: BackendCourse | null
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

export default function StudentDashboard() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [auth, setAuth] = useState<{ username: string; role: string } | null>(null)

  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [recommended, setRecommended] = useState<BackendCourse[]>([])
  const [report, setReport] = useState<StudentReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    const storedUser = getStoredUser()

    if (!storedUser) {
      router.push("/login")
      return
    }

    if (storedUser.role !== "student") {
      router.push(redirectPathForRole(storedUser.role))
      return
    }

    setAuth({ username: storedUser.username, role: roleLabel(storedUser.role) })

    async function loadDashboard() {
      try {
        setLoading(true)
        setError(null)

        const meRes = await apiFetch<LearnHubUser>("/auth/me")

        if (meRes.data.role !== "student") {
          router.push(redirectPathForRole(meRes.data.role))
          return
        }

        setAuth({ username: meRes.data.username, role: roleLabel(meRes.data.role) })

        const [enrollmentsRes, reportRes, coursesRes] = await Promise.all([
          apiFetch<Enrollment[]>("/enrollments/mine"),
          apiFetch<StudentReport>("/reports/student"),
          apiFetch<{ items: BackendCourse[]; total: number; page: number; page_size: number }>("/courses?page_size=3"),
        ])

        setEnrollments(enrollmentsRes.data.filter((enrollment) => enrollment.status === "active"))
        setReport(reportRes.data)
        setRecommended(coursesRes.data.items)
      } catch (err) {
        clearAuth()
        router.push("/login")
        setError(err instanceof Error ? err.message : "Không tải được dữ liệu dashboard")
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [router])

  if (!auth) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Đang tải dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="font-medium text-destructive">{error}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Tải lại
          </Button>
        </div>
      </div>
    )
  }

  const completedLessons = report?.progress_records.filter((item) => item.is_completed).length ?? 0
  const completedCourses = enrollments.filter((enrollment) => {
    const total = enrollment.course?.lessons_count ?? 0
    const completed =
      report?.progress_records.filter((item) => item.course_id === enrollment.course_id && item.is_completed)
        .length ?? 0
    return total > 0 && completed >= total
  }).length

  const stats = {
    totalCourses: enrollments.length,
    completedCourses,
    completedLessons,
    certificates: report?.certificates.length ?? 0,
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-sidebar text-sidebar-foreground transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
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

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {sidebarItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${item.active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-sidebar-border">
            <LogoutButton
              variant="outline"
              className="mb-3 w-full justify-start border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground"
            />
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src="" />
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
                  {auth?.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{auth?.username}</p>
                <p className="text-sm text-sidebar-foreground/70">{auth?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <div className="flex h-full items-center justify-between px-4 lg:px-8">
            <div className="flex items-center gap-4">
              <button
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-semibold text-foreground">Bảng điều khiển</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  className="relative p-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
                </button>

                {/* Notifications Dropdown */}
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-lg border border-border bg-card shadow-lg">
                    <div className="p-4 border-b border-border">
                      <h3 className="font-semibold">Thông báo</h3>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-border last:border-0 ${!notification.read ? "bg-primary/5" : ""
                            }`}
                        >
                          <p className="font-medium text-foreground">{notification.title}</p>
                          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">{notification.time}</p>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 border-t border-border">
                      <Button variant="ghost" className="w-full" size="sm">
                        Xem tất cả thông báo
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <Avatar className="h-9 w-9">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {auth.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-4 lg:p-8">
          {/* Welcome Message */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">Chào mừng trở lại, {auth.username}!</h2>
            <p className="text-muted-foreground mt-1">Tiếp tục hành trình học tập của bạn</p>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Khóa học đã đăng ký</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{stats.totalCourses}</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Đã hoàn thành</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{stats.completedCourses}</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Bài đã hoàn thành</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{stats.completedLessons}</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Chứng chỉ</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{stats.certificates}</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Award className="h-6 w-6 text-warning-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enrolled Courses */}
          <Card className="mb-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Khóa học của tôi</CardTitle>
              <Button variant="ghost" size="sm" className="gap-1">
                Xem tất cả <ChevronRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {enrollments.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-8 text-center">
                    <p className="text-muted-foreground">Bạn chưa đăng ký khóa học nào.</p>
                    <Button className="mt-4" asChild>
                      <Link href="/search">Tìm khóa học</Link>
                    </Button>
                  </div>
                ) : (
                  enrollments.map((enrollment) => {
                    const course = enrollment.course
                    if (!course) return null

                    const completed =
                      report?.progress_records.filter((item) => item.course_id === course.id && item.is_completed)
                        .length ?? 0
                    const total = course.lessons_count || 0
                    const progress = total > 0 ? Math.round((completed / total) * 100) : 0

                    return (
                      <div
                        key={enrollment.id}
                        className="flex flex-col sm:flex-row gap-4 p-4 rounded-lg border border-border bg-background hover:bg-muted/30 transition-colors"
                      >
                        <div className="sm:w-48 aspect-video rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                          <img
                            src={getCourseThumbnailUrl(course)}
                            alt={course.title}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{course.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {course.instructor?.full_name || course.instructor?.username || "Giảng viên"}
                          </p>

                          <div className="mt-3">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-muted-foreground">
                                {completed}/{total} bài học
                              </span>
                              <span className="font-medium text-foreground">{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>Đã đăng ký</span>
                            </div>

                            <Button size="sm" className="gap-2" asChild>
                              <Link href={`/course/${course.id}?returnTo=/dashboard`}>
                                <Play className="h-4 w-4" /> Tiếp tục
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recommended Courses */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Gợi ý cho bạn</CardTitle>
              <Button variant="ghost" size="sm" className="gap-1" asChild>
                <Link href="/search">
                  Xem tất cả <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recommended.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-8 text-center">
                  <p className="text-muted-foreground">Chưa có khóa học gợi ý.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {recommended.map((course) => (
                    <Link href={`/course/${course.id}?returnTo=/dashboard`} key={course.id}>
                      <div className="group rounded-lg border border-border overflow-hidden hover:shadow-md transition-all">
                        <div className="aspect-video overflow-hidden bg-muted">
                          <img
                            src={getCourseThumbnailUrl(course)}
                            alt={course.title}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {course.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {course.instructor?.full_name || course.instructor?.username || "Giảng viên"}
                          </p>
                          <div className="mt-2 flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-1">
                              <Star className="h-4 w-4 shrink-0 fill-warning text-warning" />
                              <span className="text-sm font-medium">{course.rating.toFixed(1)}</span>
                              <span className="truncate text-xs text-muted-foreground">
                                ({course.students_count} học viên)
                              </span>
                            </div>
                            <span className="shrink-0 font-bold text-foreground">
                              {course.price === 0 ? "Miễn phí" : `${course.price.toLocaleString("vi-VN")}đ`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
