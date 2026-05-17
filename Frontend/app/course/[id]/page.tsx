"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { apiFetch } from "@/lib/api"
import { clearAuth, getStoredToken, getStoredUser, LearnHubUser } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Award,
  BookOpen,
  ChevronLeft,
  CheckCircle2,
  Clock,
  GraduationCap,
  Play,
  Star,
  Users,
} from "lucide-react"

type Course = {
  id: number
  title: string
  category: string
  description?: string | null
  price: number
  thumbnail_url?: string | null
  level: string
  status: string
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

type Lesson = {
  id: number
  course_id: number
  title: string
  video_url?: string | null
  document_url?: string | null
  order_index: number
  duration_seconds: number
  is_visible: boolean
}

type Enrollment = {
  id: number
  course_id: number
  status: string
}

type CourseProgress = {
  course_id: number
  completed_lessons: number
  total_lessons: number
  percent: number
}

type Review = {
  id: number
  student_id: number
  course_id: number
  rating: number
  comment?: string | null
  created_at: string
}

function formatPrice(price: number) {
  return price === 0 ? "Miễn phí" : `${price.toLocaleString("vi-VN")}đ`
}

function formatDuration(seconds: number) {
  if (!seconds) return "Chưa cập nhật"
  const minutes = Math.max(1, Math.round(seconds / 60))
  return `${minutes} phút`
}

function instructorName(course: Course) {
  return course.instructor?.full_name || course.instructor?.username || "Giảng viên"
}

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const courseId = Number(params.id)

  const [course, setCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [progress, setProgress] = useState<CourseProgress | null>(null)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [certificateLoading, setCertificateLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const firstLesson = useMemo(() => lessons[0], [lessons])

  useEffect(() => {
    let alive = true

    async function loadCourse() {
      try {
        setLoading(true)
        setError(null)

        const [courseRes, reviewsRes] = await Promise.all([
          apiFetch<Course>(`/courses/${courseId}`),
          apiFetch<Review[]>(`/reviews/course/${courseId}`),
        ])

        if (!alive) return
        setCourse(courseRes.data)
        setReviews(reviewsRes.data)

        if (!getStoredToken() || !getStoredUser()) return

        let user: LearnHubUser
        try {
          const meRes = await apiFetch<LearnHubUser>("/auth/me")
          user = meRes.data
        } catch {
          clearAuth()
          return
        }

        if (user.role !== "student") return

        const enrollmentsRes = await apiFetch<Enrollment[]>("/enrollments/mine")
        if (!alive) return

        const enrolled = enrollmentsRes.data.some(
          (item) => item.course_id === courseId && item.status === "active"
        )
        setIsEnrolled(enrolled)

        if (enrolled) {
          const [lessonsRes, progressRes] = await Promise.all([
            apiFetch<Lesson[]>(`/lessons/course/${courseId}`),
            apiFetch<CourseProgress>(`/progress/course/${courseId}`),
          ])
          if (!alive) return
          setLessons(lessonsRes.data)
          setProgress(progressRes.data)
        }
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : "Không tải được khóa học")
      } finally {
        if (alive) setLoading(false)
      }
    }

    if (Number.isFinite(courseId)) {
      loadCourse()
    } else {
      setError("Mã khóa học không hợp lệ")
      setLoading(false)
    }

    return () => {
      alive = false
    }
  }, [courseId])

  async function handleEnroll() {
    if (!getStoredToken() || !getStoredUser()) {
      router.push("/login")
      return
    }

    try {
      setActionLoading(true)
      setError(null)

      const meRes = await apiFetch<LearnHubUser>("/auth/me")

      if (meRes.data.role !== "student") {
        setError("Chỉ tài khoản học viên mới có thể đăng ký khóa học")
        return
      }

      await apiFetch<Enrollment>("/enrollments", {
        method: "POST",
        body: JSON.stringify({ course_id: courseId }),
      })

      const [lessonsRes, progressRes] = await Promise.all([
        apiFetch<Lesson[]>(`/lessons/course/${courseId}`),
        apiFetch<CourseProgress>(`/progress/course/${courseId}`),
      ])

      setLessons(lessonsRes.data)
      setProgress(progressRes.data)
      setIsEnrolled(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không đăng ký được khóa học")
    } finally {
      setActionLoading(false)
    }
  }

  async function handleIssueCertificate() {
    try {
      setCertificateLoading(true)
      setSuccessMessage(null)
      setError(null)

      await apiFetch(`/certificates/course/${courseId}`, { method: "POST" })
      setSuccessMessage("Chứng chỉ đã được cấp. Bạn có thể xem trong trang Chứng chỉ.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chưa đủ điều kiện nhận chứng chỉ")
    } finally {
      setCertificateLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Đang tải khóa học...</p>
      </div>
    )
  }

  if (error && !course) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="text-center">
          <p className="font-medium text-destructive">{error}</p>
          <Button className="mt-4" asChild>
            <Link href="/search">Quay lại tìm kiếm</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!course) return null

  const percent = progress?.percent ?? 0
  const completedLessons = progress?.completed_lessons ?? 0
  const totalLessons = progress?.total_lessons ?? course.lessons_count

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard">
                <ChevronLeft className="h-5 w-5" />
              </Link>
            </Button>
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="hidden text-xl font-bold text-foreground sm:block">LearnHub</span>
            </Link>
          </div>

          {isEnrolled ? (
            <Button asChild disabled={!firstLesson}>
              <Link href={firstLesson ? `/course/${course.id}/lesson/${firstLesson.id}` : `/course/${course.id}`}>
                <Play className="mr-2 h-4 w-4" /> Tiếp tục học
              </Link>
            </Button>
          ) : (
            <Button onClick={handleEnroll} disabled={actionLoading}>
              <Play className="mr-2 h-4 w-4" />
              {actionLoading ? "Đang đăng ký..." : "Đăng ký khóa học"}
            </Button>
          )}
        </div>
      </header>

      <section className="bg-sidebar py-12 text-sidebar-foreground">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-4 text-sm text-sidebar-foreground/70">
              <Link href="/search" className="hover:text-sidebar-foreground">
                {course.category}
              </Link>
              <span className="mx-2">/</span>
              <span>{course.level}</span>
            </div>
            <h1 className="text-3xl font-bold lg:text-4xl">{course.title}</h1>
            <p className="mt-4 text-lg text-sidebar-foreground/80">
              {course.description || "Khóa học đang được cập nhật mô tả chi tiết."}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-warning text-warning" />
                <strong>{course.rating.toFixed(1)}</strong>
                <span className="text-sidebar-foreground/70">({course.reviews_count} đánh giá)</span>
              </span>
              <span className="flex items-center gap-1 text-sidebar-foreground/70">
                <Users className="h-4 w-4" /> {course.students_count} học viên
              </span>
              <span className="flex items-center gap-1 text-sidebar-foreground/70">
                <BookOpen className="h-4 w-4" /> {course.lessons_count} bài học
              </span>
            </div>

            <div className="mt-5 flex items-center gap-2">
              <Avatar className="h-9 w-9">
                <AvatarImage src="" />
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                  {instructorName(course).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span>
                Bởi <span className="font-medium">{instructorName(course)}</span>
              </span>
            </div>
          </div>

          <Card className="overflow-hidden">
            <div className="aspect-video bg-muted">
              <img
                src={course.thumbnail_url || "/placeholder.jpg"}
                alt={course.title}
                className="h-full w-full object-cover"
              />
            </div>
            <CardContent className="p-6">
              {isEnrolled ? (
                <>
                  <div className="mb-4">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tiến độ của bạn</span>
                      <span className="font-medium">{percent}%</span>
                    </div>
                    <Progress value={percent} className="h-2" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      {completedLessons}/{totalLessons} bài học đã hoàn thành
                    </p>
                  </div>
                  <Button className="w-full" size="lg" asChild disabled={!firstLesson}>
                    <Link href={firstLesson ? `/course/${course.id}/lesson/${firstLesson.id}` : `/course/${course.id}`}>
                      <Play className="mr-2 h-4 w-4" /> Vào học
                    </Link>
                  </Button>
                  {percent >= 100 && (
                    <Button
                      className="mt-3 w-full"
                      variant="outline"
                      onClick={handleIssueCertificate}
                      disabled={certificateLoading}
                    >
                      {certificateLoading ? "Đang cấp chứng chỉ..." : "Nhận chứng chỉ"}
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <div className="mb-4 text-3xl font-bold">{formatPrice(course.price)}</div>
                  <Button className="w-full" size="lg" onClick={handleEnroll} disabled={actionLoading}>
                    {actionLoading ? "Đang đăng ký..." : "Đăng ký khóa học"}
                  </Button>
                </>
              )}

              {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
              {successMessage && <p className="mt-4 text-sm text-green-600">{successMessage}</p>}

              <div className="mt-6 space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span>Học theo tiến độ cá nhân</span>
                </div>
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-muted-foreground" />
                  <span>Có chứng chỉ khi đủ điều kiện</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-12">
        <Tabs defaultValue="curriculum" className="w-full">
          <TabsList className="mb-8 grid w-full grid-cols-3">
            <TabsTrigger value="curriculum">Bài học</TabsTrigger>
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="reviews">Đánh giá</TabsTrigger>
          </TabsList>

          <TabsContent value="curriculum">
            <Card>
              <CardHeader>
                <CardTitle>Nội dung khóa học</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {!isEnrolled ? (
                  <div className="rounded-lg border border-dashed p-8 text-center">
                    <p className="text-muted-foreground">Đăng ký khóa học để xem danh sách bài học.</p>
                    <Button className="mt-4" onClick={handleEnroll} disabled={actionLoading}>
                      Đăng ký ngay
                    </Button>
                  </div>
                ) : lessons.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                    Khóa học chưa có bài học.
                  </p>
                ) : (
                  lessons.map((lesson) => (
                    <Link
                      key={lesson.id}
                      href={`/course/${course.id}/lesson/${lesson.id}`}
                      className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted"
                    >
                      <div className="flex items-center gap-3">
                        <Play className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium text-foreground">{lesson.title}</p>
                          <p className="text-sm text-muted-foreground">Bài {lesson.order_index}</p>
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">{formatDuration(lesson.duration_seconds)}</span>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Bạn sẽ nhận được gì?</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {[
                  "Học với dữ liệu khóa học thật từ hệ thống",
                  "Theo dõi tiến độ học tập theo từng bài",
                  "Làm quiz và ghi nhận kết quả",
                  "Nhận chứng chỉ khi hoàn thành đủ điều kiện",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                    <span>{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>Đánh giá học viên</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {reviews.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                    Chưa có đánh giá cho khóa học này.
                  </p>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="border-b border-border pb-5 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">Học viên #{review.student_id}</p>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-warning text-warning" />
                          <span>{review.rating}</span>
                        </div>
                      </div>
                      {review.comment && <p className="mt-2 text-muted-foreground">{review.comment}</p>}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
