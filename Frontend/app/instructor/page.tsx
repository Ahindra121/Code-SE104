"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { apiFetch } from "@/lib/api"
import { getCourseThumbnailUrl } from "@/lib/course-thumbnail"
import { getStoredUser, redirectPathForRole, roleLabel } from "@/lib/auth"
import { LogoutButton } from "@/components/logout-button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart3,
  BookOpen,
  BadgeCheck,
  Edit,
  Eye,
  GraduationCap,
  Home,
  Menu,
  PlusCircle,
  Settings,
  Star,
  TrendingUp,
  Users,
  X,
} from "lucide-react"

type CourseStatus = "draft" | "pending" | "pending_review" | "approved" | "rejected" | "hidden" | "archived"

type Course = {
  id: number
  title: string
  thumbnail_url?: string | null
  status: CourseStatus
  rating: number
  reviews_count: number
  students_count: number
  lessons_count: number
  updated_at: string
}

type InstructorReportItem = {
  course_id: number
  title: string
  students: number
  completion_rate: number
  average_quiz_score: number
}

const sidebarItems = [
  { name: "Bảng điều khiển", icon: Home, href: "/instructor", active: true },
  { name: "Khóa học của tôi", icon: BookOpen,
  BadgeCheck, href: "/instructor/courses", active: false },
  { name: "Xác minh giảng viên", icon: BadgeCheck, href: "/instructor/verification", active: false },
  { name: "Thêm khóa học", icon: PlusCircle, href: "/instructor/course/new", active: false },
  { name: "Phân tích", icon: BarChart3, href: "/instructor/analytics", active: false },
  { name: "Học viên", icon: Users, href: "/instructor/students", active: false },
  { name: "Cài đặt", icon: Settings, href: "/profile", active: false },
]

function statusLabel(status: CourseStatus) {
  const labels: Record<CourseStatus, string> = {
    draft: "Bản nháp",
    pending: "Chờ duyệt",
    pending_review: "Chờ duyệt",
    approved: "Đã duyệt",
    rejected: "Từ chối",
    hidden: "Đã ẩn",
    archived: "Đã lưu trữ",
  }
  return labels[status]
}

export default function InstructorDashboard() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [auth, setAuth] = useState<{ username: string; role: string } | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [report, setReport] = useState<InstructorReportItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const user = getStoredUser()
    if (!user) {
      router.push("/login")
      return
    }

    if (user.role !== "instructor") {
      router.push(redirectPathForRole(user.role))
      return
    }

    setAuth({ username: user.username, role: roleLabel(user.role) })

    async function loadDashboard() {
      try {
        setLoading(true)
        setError(null)
        const [coursesRes, reportRes] = await Promise.all([
          apiFetch<Course[]>("/courses/mine"),
          apiFetch<InstructorReportItem[]>("/reports/instructor"),
        ])
        setCourses(coursesRes.data)
        setReport(reportRes.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không tải được dashboard giảng viên")
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [router])

  const stats = useMemo(() => {
    const totalStudents = courses.reduce((sum, course) => sum + course.students_count, 0)
    const totalReviews = courses.reduce((sum, course) => sum + course.reviews_count, 0)
    const ratedCourses = courses.filter((course) => course.rating > 0)
    const avgRating =
      ratedCourses.length > 0
        ? ratedCourses.reduce((sum, course) => sum + course.rating, 0) / ratedCourses.length
        : 0
    const avgCompletion =
      report.length > 0 ? report.reduce((sum, item) => sum + item.completion_rate, 0) / report.length : 0

    return { totalStudents, totalReviews, avgRating, avgCompletion, totalCourses: courses.length }
  }, [courses, report])

  if (!auth || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Đang tải dashboard giảng viên...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

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
            <LogoutButton
              variant="outline"
              className="mb-3 w-full justify-start border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground"
            />
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
          <div className="flex h-full items-center justify-between px-4 lg:px-8">
            <div className="flex items-center gap-4">
              <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-semibold text-foreground">Bảng điều khiển giảng viên</h1>
            </div>
            <Button className="gap-2" asChild>
              <Link href="/instructor/course/new">
                <PlusCircle className="h-4 w-4" /> Tạo khóa học
              </Link>
            </Button>
          </div>
        </header>

        <main className="p-4 lg:p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">Chào mừng trở lại, {auth.username}!</h2>
            <p className="mt-1 text-muted-foreground">Tổng quan khóa học, học viên, đánh giá và tiến độ hoàn thành.</p>
          </div>

          {error && <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}

          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tổng học viên</p>
                    <p className="mt-1 text-3xl font-bold text-foreground">{stats.totalStudents}</p>
                  </div>
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tổng khóa học</p>
                    <p className="mt-1 text-3xl font-bold text-foreground">{stats.totalCourses}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Đánh giá TB</p>
                    <p className="mt-1 text-3xl font-bold text-foreground">{stats.avgRating.toFixed(1)}</p>
                  </div>
                  <Star className="h-8 w-8 fill-warning text-warning" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Hoàn thành TB</p>
                    <p className="mt-1 text-3xl font-bold text-foreground">{Math.round(stats.avgCompletion)}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Khóa học của tôi</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/instructor/courses">Xem tất cả</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Khóa học</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Trạng thái</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Học viên</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Đánh giá</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.slice(0, 5).map((course) => (
                      <tr key={course.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <img src={getCourseThumbnailUrl(course)} alt={course.title} className="h-12 w-20 rounded-lg object-cover" />
                            <div>
                              <p className="line-clamp-1 font-medium text-foreground">{course.title}</p>
                              <p className="text-sm text-muted-foreground">{course.lessons_count} bài học</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant="secondary">{statusLabel(course.status)}</Badge>
                        </td>
                        <td className="px-4 py-4">{course.students_count}</td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1">
                            <Star className="h-4 w-4 fill-warning text-warning" />
                            {course.rating.toFixed(1)} ({course.reviews_count})
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/course/${course.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/instructor/course/${course.id}`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {courses.length === 0 && (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <p className="text-muted-foreground">Bạn chưa có khóa học nào.</p>
                  <Button className="mt-4" asChild>
                    <Link href="/instructor/course/new">Tạo khóa học đầu tiên</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thống kê theo khóa học</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {report.length === 0 ? (
                <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">Chưa có dữ liệu thống kê.</p>
              ) : (
                report.map((item) => (
                  <div key={item.course_id} className="rounded-lg border border-border p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-foreground">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.students} học viên</p>
                      </div>
                      <div className="grid gap-3 text-sm sm:grid-cols-2">
                        <span>Hoàn thành: {item.completion_rate}%</span>
                        <span>Điểm quiz TB: {item.average_quiz_score}/10</span>
                      </div>
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



