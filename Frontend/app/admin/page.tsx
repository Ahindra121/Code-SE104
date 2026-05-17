"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AdminShell } from "./_components/admin-shell"
import { apiFetch } from "@/lib/api"
import { getStoredUser, redirectPathForRole } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, CheckCircle2, Clock, Users, Award, BarChart3 } from "lucide-react"

type AdminReport = {
  users: number
  courses: number
  enrollments: number
  certificates: number
}

type CourseStatus = "draft" | "pending" | "approved" | "rejected" | "hidden" | "archived"

type Course = {
  id: number
  title: string
  category: string
  status: CourseStatus
  lessons_count: number
  students_count: number
  updated_at: string
  instructor?: {
    username: string
    full_name?: string | null
  } | null
}

type CourseList = {
  items: Course[]
  total: number
  page: number
  page_size: number
}

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
  return "bg-muted text-muted-foreground hover:bg-muted"
}

export default function AdminDashboard() {
  const router = useRouter()
  const [report, setReport] = useState<AdminReport | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const user = getStoredUser()
    if (!user) {
      router.push("/login")
      return
    }

    if (user.role !== "admin") {
      router.push(redirectPathForRole(user.role))
      return
    }

    async function loadDashboard() {
      try {
        setLoading(true)
        setError(null)

        const [reportRes, coursesRes] = await Promise.all([
          apiFetch<AdminReport>("/reports/admin"),
          apiFetch<CourseList>("/courses?include_all=true&page_size=100"),
        ])

        setReport(reportRes.data)
        setCourses(coursesRes.data.items)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không tải được dashboard admin")
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [router])

  const pendingCourses = useMemo(() => courses.filter((course) => course.status === "pending"), [courses])
  const approvedCourses = useMemo(() => courses.filter((course) => course.status === "approved"), [courses])
  const rejectedCourses = useMemo(() => courses.filter((course) => course.status === "rejected"), [courses])

  return (
    <AdminShell
      title="Bảng điều khiển quản trị"
      activeKey="dashboard"
      topRight={
        pendingCourses.length > 0 ? (
          <Button size="sm" asChild>
            <Link href="/admin/courses">{pendingCourses.length} khóa chờ duyệt</Link>
          </Button>
        ) : null
      }
    >
      {loading ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">Đang tải dữ liệu admin...</div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>
      ) : (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Người dùng</p>
                    <p className="mt-1 text-3xl font-bold text-foreground">{report?.users ?? 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Khóa học</p>
                    <p className="mt-1 text-3xl font-bold text-foreground">{report?.courses ?? 0}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Ghi danh</p>
                    <p className="mt-1 text-3xl font-bold text-foreground">{report?.enrollments ?? 0}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Chứng chỉ</p>
                    <p className="mt-1 text-3xl font-bold text-foreground">{report?.certificates ?? 0}</p>
                  </div>
                  <Award className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Chờ duyệt</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{pendingCourses.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Đã duyệt</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{approvedCourses.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Từ chối</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{rejectedCourses.length}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Khóa học cần xử lý</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/courses">Mở trang duyệt</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {pendingCourses.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />
                  <p className="mt-4 font-medium text-foreground">Không có khóa học chờ duyệt</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingCourses.slice(0, 5).map((course) => (
                    <div key={course.id} className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-foreground">{course.title}</p>
                          <Badge className={statusClass(course.status)}>{statusLabel(course.status)}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {course.instructor?.full_name || course.instructor?.username || "Giảng viên"} • {course.category} • {course.lessons_count} bài học
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {new Date(course.updated_at).toLocaleDateString("vi-VN")}
                        </span>
                        <Button size="sm" asChild>
                          <Link href="/admin/courses">Duyệt</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </AdminShell>
  )
}
