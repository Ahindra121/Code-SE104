"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { apiFetch } from "@/lib/api"
import { getCourseThumbnailUrl } from "@/lib/course-thumbnail"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Award,
  BookOpen,
  Briefcase,
  ChevronRight,
  Clock,
  Code,
  GraduationCap,
  Languages,
  Menu,
  Play,
  Search,
  Users,
  X,
} from "lucide-react"

type Course = {
  id: number
  title: string
  category: string
  description?: string | null
  price: number
  thumbnail_url?: string | null
  lessons_count: number
  students_count: number
  instructor?: {
    id: number
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

const categoryStyles = [
  { name: "IT", icon: Code, color: "bg-primary/10 text-primary" },
  { name: "Business", icon: Briefcase, color: "bg-accent/10 text-accent" },
  { name: "Language", icon: Languages, color: "bg-success/10 text-success" },
  { name: "Soft Skills", icon: Users, color: "bg-warning/10 text-warning-foreground" },
]

function formatPrice(price: number) {
  return price === 0 ? "Miễn phí" : `${price.toLocaleString("vi-VN")}đ`
}

function instructorName(course: Course) {
  return course.instructor?.full_name || course.instructor?.username || "Giảng viên"
}

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const [totalCourses, setTotalCourses] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true

    async function loadCourses() {
      try {
        setLoading(true)
        setError(null)
        const result = await apiFetch<CourseList>("/courses?page_size=100")
        if (!alive) return
        setCourses(result.data.items)
        setTotalCourses(result.data.total)
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : "Không tải được dữ liệu khóa học")
      } finally {
        if (alive) setLoading(false)
      }
    }

    loadCourses()
    return () => {
      alive = false
    }
  }, [])

  const categories = useMemo(() => {
    return categoryStyles
      .map((category) => {
        const count = courses.filter((course) => course.category === category.name).length
        return { ...category, count }
      })
      .filter((category) => category.count > 0)
  }, [courses])

  const featuredCourses = courses.slice(0, 4)
  const totalStudents = courses.reduce((sum, course) => sum + course.students_count, 0)
  const totalInstructors = new Set(courses.map((course) => course.instructor?.id).filter(Boolean)).size
  const heroCourse = featuredCourses[0]

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">LearnHub</span>
            </Link>

            <div className="hidden flex-1 max-w-xl md:flex">
              <form action="/search" className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input name="q" type="search" placeholder="Tìm khóa học..." className="w-full border-0 bg-secondary pl-10" />
              </form>
            </div>

            <div className="hidden items-center gap-2 md:flex">
              <Link href="/dashboard" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                Bảng điều khiển
              </Link>
              <Link href="/search" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                Khóa học
              </Link>
              <Button variant="ghost" asChild>
                <Link href="/login">Đăng nhập</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Đăng ký</Link>
              </Button>
            </div>

            <button className="p-2 md:hidden" onClick={() => setMobileMenuOpen((open) => !open)}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-border md:hidden">
            <div className="space-y-4 p-4">
              <form action="/search" className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input name="q" type="search" placeholder="Tìm khóa học..." className="w-full border-0 bg-secondary pl-10" />
              </form>
              <div className="flex flex-col gap-2">
                <Link href="/dashboard" className="py-2 text-sm font-medium">Bảng điều khiển</Link>
                <Link href="/search" className="py-2 text-sm font-medium">Khóa học</Link>
                <Button variant="ghost" className="justify-start" asChild>
                  <Link href="/login">Đăng nhập</Link>
                </Button>
                <Button className="w-full" asChild>
                  <Link href="/register">Đăng ký</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
          <div className="max-w-xl">
            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Học mọi lúc, <span className="text-primary">mọi nơi</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Khám phá các khóa học đã được duyệt trên hệ thống LearnHub, theo dõi tiến độ và phát triển bản thân mỗi ngày.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button size="lg" className="gap-2" asChild>
                <Link href="/search">
                  <Play className="h-4 w-4" /> Bắt đầu học
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="gap-2 !bg-white hover:!bg-gray-100" asChild>
                <Link href="/search" className="!text-black">
                  Xem khóa học <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="mt-10 flex items-center gap-8">
              <div>
                <p className="text-3xl font-bold text-foreground">{loading ? "..." : totalStudents.toLocaleString("vi-VN")}</p>
                <p className="text-sm text-muted-foreground">Học viên</p>
              </div>
              <div className="h-10 w-px bg-border" />
              <div>
                <p className="text-3xl font-bold text-foreground">{loading ? "..." : totalCourses.toLocaleString("vi-VN")}</p>
                <p className="text-sm text-muted-foreground">Khóa học</p>
              </div>
              <div className="h-10 w-px bg-border" />
              <div>
                <p className="text-3xl font-bold text-foreground">{loading ? "..." : totalInstructors.toLocaleString("vi-VN")}</p>
                <p className="text-sm text-muted-foreground">Giảng viên</p>
              </div>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute -right-4 -top-4 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -bottom-8 -left-8 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-2xl bg-card p-2 shadow-2xl ring-1 ring-border">
              <img
                src={heroCourse ? getCourseThumbnailUrl(heroCourse) : "/images/course-defaults/it.png"}
                alt={heroCourse?.title || "LearnHub"}
                className="aspect-video w-full rounded-xl object-cover"
              />
              {heroCourse && <div className="p-5">
                <p className="text-sm font-medium text-primary">{heroCourse?.category || "Khóa học"}</p>
                <h2 className="mt-2 text-xl font-semibold text-foreground">{heroCourse.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{instructorName(heroCourse)}</p>
              </div>}
            </div>
          </div>
          </div>
        </div>
      </section>

      <section className="bg-card py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Khám phá danh mục</h2>
            <p className="mt-4 text-lg text-muted-foreground">Tìm khóa học phù hợp cho hành trình học tập của bạn</p>
          </div>
          {categories.length === 0 ? (
            <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              Chưa có danh mục nào từ dữ liệu khóa học.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((category) => (
                <Link href={`/search?category=${encodeURIComponent(category.name)}`} key={category.name}>
                  <Card className="group cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg">
                    <CardContent className="p-6">
                      <div className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl ${category.color}`}>
                        <category.icon className="h-7 w-7" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
                        {category.name}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">{category.count} khóa học</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Khóa học nổi bật</h2>
              <p className="mt-4 text-lg text-muted-foreground">Các khóa học mới nhất đang có trên hệ thống</p>
            </div>
            <Button variant="outline" className="hidden gap-2 sm:flex" asChild>
              <Link href="/search">
                Xem tất cả <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {error && <p className="mb-6 rounded-lg border border-destructive/30 p-4 text-sm text-destructive">{error}</p>}

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} className="overflow-hidden">
                  <div className="aspect-video animate-pulse bg-muted" />
                  <CardContent className="space-y-3 p-4">
                    <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                    <div className="h-5 w-full animate-pulse rounded bg-muted" />
                    <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : featuredCourses.length === 0 ? (
            <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              Chưa có khóa học được duyệt để hiển thị trên trang chủ.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredCourses.map((course) => (
                <Link href={`/course/${course.id}`} key={course.id}>
                  <Card className="group h-full overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg">
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={getCourseThumbnailUrl(course)}
                        alt={course.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity group-hover:opacity-100">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90">
                          <Play className="ml-0.5 h-5 w-5 text-primary" />
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <p className="mb-2 text-xs font-medium text-primary">{course.category}</p>
                      <h3 className="line-clamp-2 font-semibold text-foreground transition-colors group-hover:text-primary">
                        {course.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">{instructorName(course)}</p>
                      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {course.students_count.toLocaleString("vi-VN")} học viên
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" /> {course.lessons_count} bài
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter className="px-4 pb-4 pt-0">
                      <span className="text-lg font-bold text-foreground">{formatPrice(course.price)}</span>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-primary py-20 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Học tập có theo dõi tiến độ</h2>
            <p className="mt-4 text-lg text-primary-foreground/80">Tập trung vào các chức năng đang có thật trong hệ thống.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-foreground/10">
                <BookOpen className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold">Bài học và tài liệu</h3>
              <p className="mt-2 text-primary-foreground/80">Học bằng video, mở hoặc tải tài liệu bài học.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-foreground/10">
                <Clock className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold">Tiến độ cá nhân</h3>
              <p className="mt-2 text-primary-foreground/80">Ghi nhận tiến độ xem video và hoàn thành bài học.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-foreground/10">
                <Award className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold">Chứng chỉ</h3>
              <p className="mt-2 text-primary-foreground/80">Nhận chứng chỉ khi hoàn thành đủ điều kiện của khóa học.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-primary to-primary/80 p-8 text-center md:p-12 lg:p-16">
            <h2 className="text-balance text-3xl font-bold text-primary-foreground sm:text-4xl">Sẵn sàng bắt đầu học?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-foreground/80">
              Tạo tài khoản hoặc xem danh sách khóa học đang có trên hệ thống.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link href="/register">Đăng ký</Link>
              </Button>
              <Button size="lg" variant="secondary" asChild>
                <Link href="/search">Xem khóa học</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-card py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 text-sm text-muted-foreground sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <Link href="/" className="flex items-center gap-2 text-foreground">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">LearnHub</span>
          </Link>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground">Chính sách bảo mật</Link>
            <Link href="/terms" className="hover:text-foreground">Điều khoản dịch vụ</Link>
          </div>
          <p>&copy; {new Date().getFullYear()} LearnHub.</p>
        </div>
      </footer>
    </div>
  )
}
