"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { apiFetch } from "@/lib/api"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { BarChart3, BookOpen,
  BadgeCheck, GraduationCap, Home, Mail, Menu, PlusCircle, Search, Settings, Users, X } from "lucide-react"

type StudentRow = {
  id: number
  name: string
  email: string
  course: string
  enrolled_at: string
  progress: number
  status: "active" | "completed" | "cancelled"
}

const sidebarItems = [
  { name: "Bảng điều khiển", icon: Home, href: "/instructor", active: false },
  { name: "Khóa học của tôi", icon: BookOpen,
  BadgeCheck, href: "/instructor/courses", active: false },
  { name: "Xác minh giảng viên", icon: BadgeCheck, href: "/instructor/verification", active: false },
  { name: "Thêm khóa học", icon: PlusCircle, href: "/instructor/course/new", active: false },
  { name: "Phân tích", icon: BarChart3, href: "/instructor/analytics", active: false },
  { name: "Học viên", icon: Users, href: "/instructor/students", active: true },
  { name: "Cài đặt", icon: Settings, href: "/profile", active: false },
]

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()
}

function studentStatus(student: StudentRow) {
  if (student.status === "completed" || student.progress >= 80) return "Tiến độ tốt"
  if (student.progress > 0 && student.progress < 40) return "Cần theo dõi"
  if (student.progress === 0) return "Mới tham gia"
  return "Đang học"
}

export default function InstructorStudentsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [students, setStudents] = useState<StudentRow[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<StudentRow[]>("/reports/instructor/students")
      .then((result) => setStudents(result.data))
      .catch((err) => setError(err instanceof Error ? err.message : "Không tải được danh sách học viên"))
      .finally(() => setLoading(false))
  }, [])

  const filteredStudents = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return students
    return students.filter((student) =>
      [student.name, student.email, student.course].some((value) => value.toLowerCase().includes(keyword))
    )
  }, [search, students])

  const activeStudents = students.filter((student) => student.status === "active").length
  const followUpStudents = students.filter((student) => studentStatus(student) === "Cần theo dõi").length
  const averageProgress = students.length === 0 ? 0 : Math.round(students.reduce((sum, student) => sum + student.progress, 0) / students.length)

  return (
    <div className="min-h-screen bg-background">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed left-0 top-0 z-50 h-full w-64 bg-sidebar text-sidebar-foreground transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
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
              <Link key={item.name} href={item.href} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${item.active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"}`}>
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 h-16 border-b border-border bg-card/95 backdrop-blur">
          <div className="flex h-full items-center justify-between px-4 lg:px-8">
            <div className="flex items-center gap-4">
              <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-semibold text-foreground">Học viên</h1>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">Theo dõi học viên từ dữ liệu hệ thống</h2>
            <p className="mt-1 text-muted-foreground">Danh sách này lấy từ lượt ghi danh thật của các khóa học do bạn phụ trách.</p>
          </div>

          {error && <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}

          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Tổng học viên</p><p className="mt-2 text-3xl font-bold text-foreground">{students.length}</p></CardContent></Card>
            <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Đang học</p><p className="mt-2 text-3xl font-bold text-foreground">{activeStudents}</p></CardContent></Card>
            <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Tiến độ trung bình</p><p className="mt-2 text-3xl font-bold text-foreground">{averageProgress}%</p><p className="mt-1 text-xs text-muted-foreground">{followUpStudents} học viên cần theo dõi</p></CardContent></Card>
          </div>

          <Card>
            <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
              <CardTitle>Danh sách học viên</CardTitle>
              <div className="relative w-full md:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" placeholder="Tìm tên, email hoặc khóa học..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">Đang tải học viên...</p>
              ) : filteredStudents.length === 0 ? (
                <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">Chưa có học viên phù hợp.</p>
              ) : (
                <div className="space-y-4">
                  {filteredStudents.map((student) => (
                    <div key={student.id} className="rounded-lg border border-border p-5">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12"><AvatarFallback className="bg-primary/10 text-primary">{initials(student.name)}</AvatarFallback></Avatar>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-foreground">{student.name}</p>
                              <Badge variant="secondary">{studentStatus(student)}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{student.email}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{student.course} · Ghi danh {new Date(student.enrolled_at).toLocaleDateString("vi-VN")}</p>
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[420px]">
                          <div><p className="text-xs uppercase text-muted-foreground">Tiến độ</p><p className="mt-1 font-semibold text-foreground">{student.progress}%</p></div>
                          <div><p className="text-xs uppercase text-muted-foreground">Trạng thái</p><p className="mt-1 font-semibold text-foreground">{student.status === "completed" ? "Hoàn thành" : "Đang học"}</p></div>
                          <div className="flex items-end"><Button variant="outline" className="w-full gap-2"><Mail className="h-4 w-4" /> Liên hệ</Button></div>
                        </div>
                      </div>
                    </div>
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

