"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  GraduationCap,
  BookOpen,
  Award,
  Settings,
  Bell,
  Menu,
  X,
  Home,
  BarChart3,
  Users,
  Search,
  MessageSquare,
  Heart,
  TrendingUp,
  Plus,
} from "lucide-react"

const sidebarItems = [
  { name: "Bảng điều khiển", icon: Home, href: "/dashboard", active: false },
  { name: "Khóa học", icon: BookOpen, href: "/search", active: false },
  { name: "Tiến độ", icon: BarChart3, href: "/progress", active: false },
  { name: "Chứng chỉ", icon: Award, href: "/certificates", active: false },
  { name: "Cộng đồng", icon: Users, href: "/community", active: true },
  { name: "Cài đặt", icon: Settings, href: "/profile", active: false },
]

const discussions = [
  {
    id: 1,
    title: "Ai đã làm xong project REST API của khóa Web Development?",
    author: "Linh Tran",
    tag: "Lập trình",
    replies: 18,
    likes: 34,
    time: "12 phút trước",
    excerpt: "Mình đang tới phần auth và muốn so sánh cách tổ chức folder backend giữa mọi người.",
  },
  {
    id: 2,
    title: "Nhóm học Business Strategy tối nay còn slot không?",
    author: "Minh Hoang",
    tag: "Nhóm học",
    replies: 9,
    likes: 12,
    time: "35 phút trước",
    excerpt: "Mình muốn tham gia để cùng review case study tuần này trước khi nộp bài.",
  },
  {
    id: 3,
    title: "Chia sẻ bộ flashcard tự tạo cho Spanish A2",
    author: "Thao Nguyen",
    tag: "Tài nguyên",
    replies: 24,
    likes: 51,
    time: "1 giờ trước",
    excerpt: "Mình tổng hợp lại từ vựng và mẫu câu hay gặp, ai cần mình gửi thêm file CSV.",
  },
]

const groups = [
  { name: "Frontend Builders", members: 248, activity: "Rất sôi nổi" },
  { name: "Business Case Lab", members: 134, activity: "Đang tuyển thành viên" },
  { name: "Spanish Speaking Club", members: 91, activity: "Họp thứ 7 hàng tuần" },
]

const topContributors = [
  { name: "Mai Anh", posts: 42, badge: "Mentor" },
  { name: "Quoc Dat", posts: 31, badge: "Top helper" },
  { name: "Bao Nhi", posts: 27, badge: "Resource sharer" },
]

export default function CommunityPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [auth, setAuth] = useState<{ username: string; role: string } | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    const storedAuth = localStorage.getItem("learnhub-demo-auth")

    if (!storedAuth) {
      router.push("/login")
      return
    }

    try {
      const parsed = JSON.parse(storedAuth)

      if (!parsed?.username || !parsed?.role) {
        localStorage.removeItem("learnhub-demo-auth")
        router.push("/login")
        return
      }

      if (parsed.role !== "Học viên") {
        const redirectPath = parsed.role === "Quản trị viên" ? "/admin" : "/instructor"
        router.push(redirectPath)
        return
      }

      setAuth(parsed)
    } catch {
      localStorage.removeItem("learnhub-demo-auth")
      router.push("/login")
    }
  }, [router])

  if (!auth) {
    return null
  }

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
        <header className="sticky top-0 z-30 h-16 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <div className="flex h-full items-center justify-between px-4 lg:px-8">
            <div className="flex items-center gap-4">
              <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-semibold text-foreground">Cộng đồng học viên</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  className="relative p-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" />
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-lg border border-border bg-card p-4 shadow-lg">
                    <h3 className="font-semibold text-foreground">Hoạt động cộng đồng</h3>
                    <div className="mt-3 space-y-3 text-sm text-muted-foreground">
                      <p>Có 5 phản hồi mới trong chủ đề bạn theo dõi.</p>
                      <p>Nhóm Frontend Builders vừa lên lịch buổi review project cuối tuần này.</p>
                    </div>
                  </div>
                )}
              </div>
              <Avatar className="h-9 w-9">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {auth.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8">
          <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Kết nối, hỏi đáp và học cùng nhau</h2>
              <p className="mt-1 text-muted-foreground">
                Theo dõi thảo luận mới, tham gia nhóm học và chia sẻ tài nguyên với cộng đồng.
              </p>
            </div>
            <Button className="gap-2 xl:self-center">
              <Plus className="h-4 w-4" />
              Tạo bài viết mới
            </Button>
          </div>

          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Thảo luận đang mở</p>
                    <p className="mt-1 text-3xl font-bold text-foreground">128</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <MessageSquare className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Nhóm học đang hoạt động</p>
                    <p className="mt-1 text-3xl font-bold text-foreground">24</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Bài viết nổi bật hôm nay</p>
                    <p className="mt-1 text-3xl font-bold text-foreground">7</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                    <TrendingUp className="h-6 w-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-8 xl:grid-cols-[1.5fr_1fr]">
            <div className="space-y-8">
              <Card>
                <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
                  <CardTitle>Thảo luận mới nhất</CardTitle>
                  <div className="relative w-full md:max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input className="pl-9" placeholder="Tìm chủ đề, nhóm học, tài nguyên..." />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {discussions.map((discussion) => (
                    <div key={discussion.id} className="rounded-xl border border-border p-5">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-foreground">{discussion.title}</h3>
                            <Badge variant="secondary">{discussion.tag}</Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            bởi {discussion.author} • {discussion.time}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Xem chi tiết
                        </Button>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">{discussion.excerpt}</p>
                      <div className="mt-4 flex items-center gap-5 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <MessageSquare className="h-4 w-4" />
                          {discussion.replies} phản hồi
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Heart className="h-4 w-4" />
                          {discussion.likes} lượt thích
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Bắt đầu cuộc thảo luận</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input placeholder="Tiêu đề bạn muốn hỏi hoặc chia sẻ" />
                  <Textarea
                    rows={5}
                    placeholder="Mô tả vấn đề, kinh nghiệm hoặc tài nguyên bạn muốn chia sẻ với cộng đồng..."
                  />
                  <div className="flex justify-end">
                    <Button>Đăng bài</Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Nhóm học nổi bật</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {groups.map((group) => (
                    <div key={group.name} className="rounded-lg border border-border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">{group.name}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{group.members} thành viên</p>
                          <p className="mt-2 text-sm text-muted-foreground">{group.activity}</p>
                        </div>
                        <Button size="sm" variant="outline">
                          Tham gia
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Thành viên tích cực</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {topContributors.map((member) => (
                    <div key={member.name} className="flex items-center justify-between rounded-lg border border-border p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{member.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.posts} bài đóng góp</p>
                        </div>
                      </div>
                      <Badge>{member.badge}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
