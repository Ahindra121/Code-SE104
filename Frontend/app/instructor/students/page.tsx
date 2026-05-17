"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  GraduationCap,
  BookOpen,
  PlusCircle,
  BarChart3,
  Users,
  Settings,
  Menu,
  X,
  Home,
  Search,
  Mail,
  Download,
  UserCheck,
  MessageSquare,
} from "lucide-react"

const students = [
  {
    id: 1,
    name: "Alex Johnson",
    email: "alex@example.com",
    course: "Web Development",
    enrolled: "2 giờ trước",
    progress: 72,
    status: "Đang học",
  },
  {
    id: 2,
    name: "Maria Garcia",
    email: "maria@example.com",
    course: "Advanced React",
    enrolled: "5 giờ trước",
    progress: 48,
    status: "Đang học",
  },
  {
    id: 3,
    name: "James Wilson",
    email: "james@example.com",
    course: "Web Development",
    enrolled: "1 ngày trước",
    progress: 85,
    status: "Tiến độ tốt",
  },
  {
    id: 4,
    name: "Sophie Martinez",
    email: "sophie@example.com",
    course: "Web Development",
    enrolled: "1 ngày trước",
    progress: 31,
    status: "Cần theo dõi",
  },
  {
    id: 5,
    name: "David Kim",
    email: "david@example.com",
    course: "Advanced React",
    enrolled: "2 ngày trước",
    progress: 67,
    status: "Đang học",
  },
  {
    id: 6,
    name: "Emily Thompson",
    email: "emily@example.com",
    course: "TypeScript for JavaScript Developers",
    enrolled: "3 ngày trước",
    progress: 0,
    status: "Mới tham gia",
  },
]

const sidebarItems = [
  { name: "Bảng điều khiển", icon: Home, href: "/instructor", active: false },
  { name: "Khóa học của tôi", icon: BookOpen, href: "/instructor/courses", active: false },
  { name: "Thêm khóa học", icon: PlusCircle, href: "/instructor/course/new", active: false },
  { name: "Phân tích", icon: BarChart3, href: "/instructor/analytics", active: false },
  { name: "Học viên", icon: Users, href: "/instructor/students", active: true },
  { name: "Cài đặt", icon: Settings, href: "/profile", active: false },
]

export default function InstructorStudentsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const activeStudents = students.filter((student) => student.status === "Đang học").length
  const followUpStudents = students.filter((student) => student.status === "Cần theo dõi").length
  const averageProgress = Math.round(
    students.reduce((sum, student) => sum + student.progress, 0) / students.length
  )

  return (
    <div className="min-h-screen bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-sidebar text-sidebar-foreground transition-transform lg:translate-x-0 ${
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
                  SC
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">Dr. Sarah Chen</p>
                <p className="text-sm text-sidebar-foreground/70">Giảng viên</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 h-16 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <div className="flex h-full items-center justify-between px-4 lg:px-8">
            <div className="flex items-center gap-4">
              <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-semibold text-foreground">Học viên</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Xuất dữ liệu
              </Button>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">Theo dõi cộng đồng học viên của bạn</h2>
            <p className="mt-1 text-muted-foreground">
              Theo dõi lượt đăng ký, tiến độ học tập và các học viên cần bạn hỗ trợ trực tiếp.
            </p>
          </div>

          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tổng học viên theo dõi</p>
                    <p className="mt-2 text-3xl font-bold text-foreground">{students.length}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Học viên đang học</p>
                    <p className="mt-2 text-3xl font-bold text-foreground">{activeStudents}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                    <UserCheck className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tiến độ trung bình</p>
                    <p className="mt-2 text-3xl font-bold text-foreground">{averageProgress}%</p>
                    <p className="mt-1 text-xs text-muted-foreground">{followUpStudents} học viên cần theo dõi thêm</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                    <BarChart3 className="h-6 w-6 text-warning" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
              <CardTitle>Danh sách học viên</CardTitle>
              <div className="relative w-full md:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" placeholder="Tìm tên, email hoặc khóa học..." />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="rounded-xl border border-border p-5"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {student.name.split(" ").map((name) => name[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-foreground">{student.name}</p>
                            <Badge
                              variant="secondary"
                              className={
                                student.status === "Cần theo dõi"
                                  ? "bg-warning/10 text-warning-foreground"
                                  : student.status === "Tiến độ tốt"
                                    ? "bg-success/10 text-success"
                                    : "bg-primary/10 text-primary"
                              }
                            >
                              {student.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {student.course} • Enrolled {student.enrolled}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[420px]">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Progress</p>
                          <p className="mt-1 font-semibold text-foreground">{student.progress}%</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Contact</p>
                          <div className="mt-1 flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Mail className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-end">
                          <Button variant="outline" className="w-full">
                            Xem chi tiết
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
