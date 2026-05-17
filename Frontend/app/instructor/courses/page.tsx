"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { apiFetch } from "@/lib/api"
import { getStoredUser, redirectPathForRole, roleLabel } from "@/lib/auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  BarChart3,
  BookOpen,
  Edit,
  Eye,
  Filter,
  GraduationCap,
  Home,
  Menu,
  PlusCircle,
  Search,
  Settings,
  Star,
  Trash2,
  Users,
  X,
} from "lucide-react"

type CourseStatus = "draft" | "pending" | "approved" | "rejected" | "hidden" | "archived"

type Course = {
  id: number
  title: string
  category: string
  description?: string | null
  price: number
  thumbnail_url?: string | null
  level: string
  status: CourseStatus
  rating: number
  reviews_count: number
  students_count: number
  lessons_count: number
  updated_at: string
}

const sidebarItems = [
  { name: "Bảng điều khiển", icon: Home, href: "/instructor", active: false },
  { name: "Khóa học của tôi", icon: BookOpen, href: "/instructor/courses", active: true },
  { name: "Thêm khóa học", icon: PlusCircle, href: "/instructor/course/new", active: false },
  { name: "Phân tích", icon: BarChart3, href: "/instructor/analytics", active: false },
  { name: "Học viên", icon: Users, href: "/instructor/students", active: false },
  { name: "Cài đặt", icon: Settings, href: "/profile", active: false },
]

function statusLabel(status: CourseStatus) {
  const labels: Record<CourseStatus, string> = {
    draft: "Bản nháp",
    pending: "Chờ duyệt",
    approved: "Đã duyệt",
    rejected: "Từ chối",
    hidden: "Đã ẩn",
    archived: "Đã lưu trữ",
  }
  return labels[status]
}

function statusClass(status: CourseStatus) {
  if (status === "approved") return "bg-green-100 text-green-700 hover:bg-green-100"
  if (status === "pending") return "bg-amber-100 text-amber-700 hover:bg-amber-100"
  if (status === "rejected") return "bg-red-100 text-red-700 hover:bg-red-100"
  if (status === "hidden" || status === "archived") return "bg-slate-100 text-slate-700 hover:bg-slate-100"
  return "bg-muted text-muted-foreground hover:bg-muted"
}

export default function InstructorCoursesPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [auth, setAuth] = useState<{ username: string; role: string } | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

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

    async function loadCourses() {
      try {
        setLoading(true)
        setError(null)
        const result = await apiFetch<Course[]>("/courses/mine")
        setCourses(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không tải được danh sách khóa học")
      } finally {
        setLoading(false)
      }
    }

    loadCourses()
  }, [router])

  const filteredCourses = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return courses
    return courses.filter(
      (course) =>
        course.title.toLowerCase().includes(keyword) ||
        course.category.toLowerCase().includes(keyword) ||
        statusLabel(course.status).toLowerCase().includes(keyword)
    )
  }, [courses, search])

  async function handleArchive(courseId: number) {
    if (!window.confirm("Ẩn/lưu trữ khóa học này?")) return

    try {
      setDeletingId(courseId)
      await apiFetch(`/courses/${courseId}`, { method: "DELETE" })
      setCourses((prev) =>
        prev.map((course) => (course.id === courseId ? { ...course, status: "archived" } : course))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể ẩn khóa học")
    } finally {
      setDeletingId(null)
    }
  }

  if (!auth || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Đang tải khóa học...</p>
      </div>
    )
  }

  const approvedCourses = courses.filter((course) => course.status === "approved").length
  const draftCourses = courses.filter((course) => course.status === "draft").length
  const pendingCourses = courses.filter((course) => course.status === "pending").length

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
              <h1 className="text-xl font-semibold text-foreground">Khóa học của tôi</h1>
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
            <h2 className="text-2xl font-bold text-foreground">Quản lý khóa học</h2>
            <p className="mt-1 text-muted-foreground">
              Theo yêu cầu báo cáo: tạo, cập nhật và ẩn khóa học; quản lý bài giảng và câu hỏi trong từng khóa.
            </p>
          </div>

          {error && <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}

          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Đã duyệt</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{approvedCourses}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Bản nháp</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{draftCourses}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Chờ duyệt</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{pendingCourses}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
              <CardTitle>Tất cả khóa học</CardTitle>
              <div className="flex flex-col gap-3 md:flex-row">
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-9" placeholder="Tìm khóa học..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Lọc
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredCourses.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-8 text-center">
                    <p className="text-muted-foreground">Chưa có khóa học phù hợp.</p>
                    <Button className="mt-4" asChild>
                      <Link href="/instructor/course/new">Tạo khóa học đầu tiên</Link>
                    </Button>
                  </div>
                ) : (
                  filteredCourses.map((course) => (
                    <div key={course.id} className="rounded-xl border border-border p-5">
                      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                        <div className="flex min-w-0 items-center gap-4">
                          <img
                            src={course.thumbnail_url || "/placeholder.jpg"}
                            alt={course.title}
                            className="h-20 w-32 rounded-lg object-cover"
                          />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-semibold text-foreground">{course.title}</h3>
                              <Badge className={statusClass(course.status)}>{statusLabel(course.status)}</Badge>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Cập nhật {new Date(course.updated_at).toLocaleDateString("vi-VN")} • {course.category} • {course.level}
                            </p>

                            <div className="mt-4 grid gap-3 sm:grid-cols-4">
                              <div>
                                <p className="text-xs uppercase text-muted-foreground">Học viên</p>
                                <p className="mt-1 font-semibold text-foreground">{course.students_count}</p>
                              </div>
                              <div>
                                <p className="text-xs uppercase text-muted-foreground">Bài học</p>
                                <p className="mt-1 font-semibold text-foreground">{course.lessons_count}</p>
                              </div>
                              <div>
                                <p className="text-xs uppercase text-muted-foreground">Đánh giá</p>
                                <p className="mt-1 flex items-center gap-1 font-semibold text-foreground">
                                  <Star className="h-4 w-4 fill-warning text-warning" />
                                  {course.rating.toFixed(1)} ({course.reviews_count})
                                </p>
                              </div>
                              <div>
                                <p className="text-xs uppercase text-muted-foreground">Học phí</p>
                                <p className="mt-1 font-semibold text-foreground">
                                  {course.price === 0 ? "Miễn phí" : `${course.price.toLocaleString("vi-VN")}đ`}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end xl:self-center">
                          <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
                            <Link href={`/course/${course.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
                            <Link href={`/instructor/course/${course.id}`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-destructive hover:text-destructive"
                            onClick={() => handleArchive(course.id)}
                            disabled={deletingId === course.id || course.status === "archived"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
