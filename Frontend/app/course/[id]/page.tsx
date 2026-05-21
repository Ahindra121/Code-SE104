"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { apiFetch } from "@/lib/api"
import { getCourseThumbnailUrl } from "@/lib/course-thumbnail"
import { clearAuth, getStoredToken, getStoredUser, LearnHubUser, redirectPathForRole } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Award,
  BookOpen,
  ChevronLeft,
  CheckCircle2,
  ClipboardCheck,
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
  completed_lesson_ids: number[]
}

type FinalTestEligibility = {
  eligible: boolean
  reason: string
}

type FinalTestSubmission = {
  id: number
  attempt_number: number
  score_percent?: number | null
  status: "submitted" | "pending_grading" | "graded" | "passed" | "failed"
  submitted_at: string
  graded_at?: string | null
  instructor_feedback?: string | null
}

type Review = {
  id: number
  student_id: number
  course_id: number
  rating: number
  content_quality?: number
  video_quality?: number
  instructor_clarity?: number
  material_usefulness?: number
  assessment_quality?: number
  practical_value?: number
  overall_satisfaction?: number
  average_rating: number
  is_visible?: boolean
  comment?: string | null
  created_at: string
  student_name?: string | null
}

type ReviewEligibility = {
  eligible: boolean
  reason: string
  already_reviewed: boolean
}

type ReviewSummary = {
  course_id: number
  average_rating: number
  review_count: number
  criteria_average: Record<string, number>
}

type InstructorReviewSummary = {
  instructor_id: number
  average_rating: number
  review_count: number
  course_count_with_reviews: number
}

type ReviewForm = {
  content_quality: number
  video_quality: number
  instructor_clarity: number
  material_usefulness: number
  assessment_quality: number
  practical_value: number
  overall_satisfaction: number
  comment: string
}

const reviewCriteria: { key: keyof Omit<ReviewForm, "comment">; label: string }[] = [
  { key: "content_quality", label: "Nội dung khóa học rõ ràng" },
  { key: "video_quality", label: "Chất lượng bài giảng/video" },
  { key: "instructor_clarity", label: "Mức độ dễ hiểu của giảng viên" },
  { key: "material_usefulness", label: "Tài liệu học tập hữu ích" },
  { key: "assessment_quality", label: "Bài tập/kiểm tra phù hợp" },
  { key: "practical_value", label: "Tính ứng dụng thực tế" },
  { key: "overall_satisfaction", label: "Mức độ hài lòng tổng thể" },
]

const initialReviewForm: ReviewForm = {
  content_quality: 0,
  video_quality: 0,
  instructor_clarity: 0,
  material_usefulness: 0,
  assessment_quality: 0,
  practical_value: 0,
  overall_satisfaction: 0,
  comment: "",
}

function formatPrice(price: number) {
  return price === 0 ? "Miễn phí" : `${price.toLocaleString("vi-VN")}đ`
}

function instructorName(course: Course) {
  return course.instructor?.full_name || course.instructor?.username || "Giảng viên"
}

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const courseId = Number(params.id)

  const [course, setCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null)
  const [reviewEligibility, setReviewEligibility] = useState<ReviewEligibility | null>(null)
  const [myReview, setMyReview] = useState<Review | null>(null)
  const [instructorReviewSummary, setInstructorReviewSummary] = useState<InstructorReviewSummary | null>(null)
  const [reviewForm, setReviewForm] = useState<ReviewForm>(initialReviewForm)
  const [progress, setProgress] = useState<CourseProgress | null>(null)
  const [finalTestEligibility, setFinalTestEligibility] = useState<FinalTestEligibility | null>(null)
  const [finalTestSubmissions, setFinalTestSubmissions] = useState<FinalTestSubmission[]>([])
  const [viewer, setViewer] = useState<LearnHubUser | null>(null)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [certificateLoading, setCertificateLoading] = useState(false)
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const firstLesson = useMemo(() => lessons[0], [lessons])

  useEffect(() => {
    let alive = true

    async function loadCourse() {
      try {
        setLoading(true)
        setError(null)

        const [courseRes, reviewsRes, summaryRes] = await Promise.all([
          apiFetch<Course>(`/courses/${courseId}`),
          apiFetch<Review[]>(`/courses/${courseId}/reviews`),
          apiFetch<ReviewSummary>(`/courses/${courseId}/reviews/summary`),
        ])

        if (!alive) return
        setCourse(courseRes.data)
        setReviews(reviewsRes.data)
        setReviewSummary(summaryRes.data)
        if (courseRes.data.instructor?.id) {
          try {
            const instructorSummaryRes = await apiFetch<InstructorReviewSummary>(`/instructors/${courseRes.data.instructor.id}/reviews/summary`)
            if (alive) setInstructorReviewSummary(instructorSummaryRes.data)
          } catch {
            if (alive) setInstructorReviewSummary(null)
          }
        }

        if (!getStoredToken() || !getStoredUser()) return

        let user: LearnHubUser
        try {
          const meRes = await apiFetch<LearnHubUser>("/auth/me")
          user = meRes.data
        } catch {
          clearAuth()
          return
        }

        setViewer(user)

        if (user.role !== "student") {
          const lessonsRes = await apiFetch<Lesson[]>(`/lessons/course/${courseId}`)
          if (!alive) return
          setLessons(lessonsRes.data)
          return
        }

        const enrollmentsRes = await apiFetch<Enrollment[]>("/enrollments/mine")
        if (!alive) return

        const enrolled = enrollmentsRes.data.some(
          (item) => item.course_id === courseId && item.status === "active"
        )
        setIsEnrolled(enrolled)

        if (enrolled) {
          const [lessonsRes, progressRes, eligibilityRes, submissionsRes, reviewEligibilityRes] = await Promise.all([
            apiFetch<Lesson[]>(`/lessons/course/${courseId}`),
            apiFetch<CourseProgress>(`/progress/course/${courseId}`),
            apiFetch<FinalTestEligibility>(`/courses/${courseId}/final-test/eligibility`),
            apiFetch<FinalTestSubmission[]>(`/courses/${courseId}/final-test/submissions/me`),
            apiFetch<ReviewEligibility>(`/courses/${courseId}/reviews/eligibility`),
          ])
          if (!alive) return
          setLessons(lessonsRes.data)
          setProgress(progressRes.data)
          setFinalTestEligibility(eligibilityRes.data)
          setFinalTestSubmissions(submissionsRes.data)
          setReviewEligibility(reviewEligibilityRes.data)
          if (reviewEligibilityRes.data.already_reviewed) {
            const myReviewRes = await apiFetch<Review>(`/courses/${courseId}/reviews/me`)
            if (!alive) return
            setMyReview(myReviewRes.data)
            setReviewForm({
              content_quality: myReviewRes.data.content_quality ?? 0,
              video_quality: myReviewRes.data.video_quality ?? 0,
              instructor_clarity: myReviewRes.data.instructor_clarity ?? 0,
              material_usefulness: myReviewRes.data.material_usefulness ?? 0,
              assessment_quality: myReviewRes.data.assessment_quality ?? 0,
              practical_value: myReviewRes.data.practical_value ?? 0,
              overall_satisfaction: myReviewRes.data.overall_satisfaction ?? 0,
              comment: myReviewRes.data.comment ?? "",
            })
          }
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

  function safeReturnPath() {
    const value = searchParams.get("returnTo")
    if (value?.startsWith("/") && !value.startsWith("//")) return value
    return viewer ? redirectPathForRole(viewer.role) : "/search"
  }

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
      const eligibilityRes = await apiFetch<FinalTestEligibility>(`/courses/${courseId}/final-test/eligibility`)
      setFinalTestEligibility(eligibilityRes.data)
      const reviewEligibilityRes = await apiFetch<ReviewEligibility>(`/courses/${courseId}/reviews/eligibility`)
      setReviewEligibility(reviewEligibilityRes.data)
      if (reviewEligibilityRes.data.already_reviewed) {
        const myReviewRes = await apiFetch<Review>(`/courses/${courseId}/reviews/me`)
        setMyReview(myReviewRes.data)
      }
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

  async function reloadReviews() {
    const [reviewsRes, summaryRes] = await Promise.all([
      apiFetch<Review[]>(`/courses/${courseId}/reviews`),
      apiFetch<ReviewSummary>(`/courses/${courseId}/reviews/summary`),
    ])
    setReviews(reviewsRes.data)
    setReviewSummary(summaryRes.data)
    if (course?.instructor?.id) {
      const instructorSummaryRes = await apiFetch<InstructorReviewSummary>(`/instructors/${course.instructor.id}/reviews/summary`)
      setInstructorReviewSummary(instructorSummaryRes.data)
    }
  }

  async function handleSubmitReview() {
    const missing = reviewCriteria.some((criteria) => reviewForm[criteria.key] < 1 || reviewForm[criteria.key] > 5)
    if (missing) {
      setError("Vui lòng chọn đủ 7 tiêu chí từ 1 đến 5 sao")
      return
    }

    try {
      setReviewSubmitting(true)
      setSuccessMessage(null)
      setError(null)
      const result = await apiFetch<Review>(myReview ? `/courses/${courseId}/reviews/me` : `/courses/${courseId}/reviews`, {
        method: myReview ? "PATCH" : "POST",
        body: JSON.stringify({
          content_quality: reviewForm.content_quality,
          video_quality: reviewForm.video_quality,
          instructor_clarity: reviewForm.instructor_clarity,
          material_usefulness: reviewForm.material_usefulness,
          assessment_quality: reviewForm.assessment_quality,
          practical_value: reviewForm.practical_value,
          overall_satisfaction: reviewForm.overall_satisfaction,
          comment: reviewForm.comment.trim() || null,
        }),
      })
      setMyReview(result.data)
      setReviewForm({
        content_quality: result.data.content_quality ?? 0,
        video_quality: result.data.video_quality ?? 0,
        instructor_clarity: result.data.instructor_clarity ?? 0,
        material_usefulness: result.data.material_usefulness ?? 0,
        assessment_quality: result.data.assessment_quality ?? 0,
        practical_value: result.data.practical_value ?? 0,
        overall_satisfaction: result.data.overall_satisfaction ?? 0,
        comment: result.data.comment ?? "",
      })
      setReviewEligibility({ eligible: false, reason: "You have already reviewed this course", already_reviewed: true })
      await reloadReviews()
      setSuccessMessage(myReview ? "Đã cập nhật đánh giá khóa học." : "Đã gửi đánh giá khóa học. Cảm ơn bạn!")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không gửi được đánh giá")
    } finally {
      setReviewSubmitting(false)
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
  const canViewLessons = isEnrolled || viewer?.role === "admin" || viewer?.role === "instructor"
  const homeHref = viewer ? redirectPathForRole(viewer.role) : "/"
  const finalTestOpen = Boolean(finalTestEligibility?.eligible)
  const finalTestPassed = finalTestSubmissions.some((submission) => submission.status === "passed")

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href={safeReturnPath()}>
                <ChevronLeft className="h-5 w-5" />
              </Link>
            </Button>
            <Link href={homeHref} className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="hidden text-xl font-bold text-foreground sm:block">LearnHub</span>
            </Link>
          </div>

          {canViewLessons ? (
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
                <strong>{(reviewSummary?.average_rating ?? course.rating).toFixed(1)}</strong>
                <span className="text-sidebar-foreground/70">({reviewSummary?.review_count ?? course.reviews_count} đánh giá)</span>
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
                {instructorReviewSummary && instructorReviewSummary.review_count > 0 && (
                  <span className="ml-2 text-sm text-sidebar-foreground/70">
                    {instructorReviewSummary.average_rating.toFixed(1)} ★ / 5 từ {instructorReviewSummary.review_count} đánh giá
                  </span>
                )}
              </span>
            </div>
          </div>

          <Card className="overflow-hidden">
            <div className="aspect-video bg-muted">
              <img
                src={getCourseThumbnailUrl(course)}
                alt={course.title}
                className="h-full w-full object-cover"
              />
            </div>
            <CardContent className="p-6">
              {canViewLessons ? (
                <>
                  {isEnrolled && <div className="mb-4">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tiến độ của bạn</span>
                      <span className="font-medium">{percent}%</span>
                    </div>
                    <Progress value={percent} className="h-2" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      {completedLessons}/{totalLessons} bài học đã hoàn thành
                    </p>
                  </div>}
                  <Button className="w-full" size="lg" asChild disabled={!firstLesson}>
                    <Link href={firstLesson ? `/course/${course.id}/lesson/${firstLesson.id}` : `/course/${course.id}`}>
                      <Play className="mr-2 h-4 w-4" /> Vào học
                    </Link>
                  </Button>
                  {isEnrolled && percent >= 100 && (
                    <>
                      <Button className="mt-3 w-full" variant="outline" asChild={finalTestOpen} disabled={!finalTestOpen}>
                        {finalTestOpen ? (
                          <Link href={`/course/${course.id}/final-test`}>
                            <ClipboardCheck className="mr-2 h-4 w-4" />
                            Làm Final Test
                          </Link>
                        ) : (
                          <span>
                            <ClipboardCheck className="mr-2 h-4 w-4" />
                            Hoàn thành tất cả bài học để mở Final Test
                          </span>
                        )}
                      </Button>
                      {finalTestPassed && (
                        <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                          Khóa học đã hoàn thành
                        </div>
                      )}
                    </>
                  )}
                  {isEnrolled && percent >= 100 && (
                    <Button
                      className="mt-3 w-full"
                      variant="outline"
                      onClick={handleIssueCertificate}
                      disabled={certificateLoading || !finalTestPassed}
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
                {!canViewLessons ? (
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
                  <>
                  {lessons.map((lesson) => {
                    const isCompleted = progress?.completed_lesson_ids?.includes(lesson.id)
                    return (
                    <Link
                      key={lesson.id}
                      href={`/course/${course.id}/lesson/${lesson.id}`}
                      className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted"
                    >
                      <div className="flex items-center gap-3">
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <Play className="h-5 w-5 text-primary" />
                        )}
                        <div>
                          <p className="font-medium text-foreground">{lesson.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Bài {lesson.order_index}{isCompleted ? " • Đã hoàn thành" : ""}
                          </p>
                        </div>
                      </div>
                    </Link>
                    )
                  })}
                  {isEnrolled && (
                    <div className="mt-4 rounded-lg border border-border p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                          <ClipboardCheck className={finalTestOpen ? "mt-1 h-5 w-5 text-primary" : "mt-1 h-5 w-5 text-muted-foreground"} />
                          <div>
                            <p className="font-medium text-foreground">Final Test cuối khóa</p>
                            <p className="text-sm text-muted-foreground">
                              {finalTestOpen ? "Bạn đã đủ điều kiện làm bài." : "Hoàn thành tất cả bài học để mở Final Test."}
                            </p>
                          </div>
                        </div>
                        <Button asChild={finalTestOpen} disabled={!finalTestOpen}>
                          {finalTestOpen ? <Link href={`/course/${course.id}/final-test`}>Làm Final Test</Link> : <span>Chưa mở</span>}
                        </Button>
                      </div>
                      {finalTestSubmissions.length > 0 && (
                        <div className="mt-4 space-y-2 text-sm">
                          {finalTestSubmissions.slice(0, 3).map((submission) => (
                            <div key={submission.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/50 p-3">
                              <span>Lần {submission.attempt_number} • {new Date(submission.submitted_at).toLocaleDateString("vi-VN")}</span>
                              <span className="font-medium">
                                {submission.status === "pending_grading" ? "Chờ chấm" : submission.status === "passed" ? "Đạt" : submission.status === "failed" ? "Không đạt" : submission.status}
                                {submission.score_percent != null ? ` • ${submission.score_percent}%` : ""}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  </>
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
                <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
                  <div className="rounded-lg border border-border p-5">
                    <div className="flex items-center gap-2">
                      <Star className="h-6 w-6 fill-warning text-warning" />
                      <span className="text-3xl font-bold">{(reviewSummary?.average_rating ?? 0).toFixed(1)}</span>
                      <span className="text-muted-foreground">/ 5</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {reviewSummary?.review_count ? `${reviewSummary.review_count} đánh giá` : "Chưa có đánh giá"}
                    </p>
                  </div>
                  <div className="hidden">
                    {reviewCriteria.map((criteria) => (
                      <div key={criteria.key} className="flex items-center justify-between gap-4 text-sm">
                        <span className="text-muted-foreground">{criteria.label}</span>
                        <span className="font-medium">{(reviewSummary?.criteria_average?.[criteria.key] ?? 0).toFixed(1)} ★</span>
                      </div>
                    ))}
                  </div>
                </div>

                {viewer?.role === "student" && isEnrolled && (
                  <div className="rounded-lg border border-border p-5">
                    {reviewEligibility?.eligible || myReview ? (
                      <div className="space-y-4">
                        <h3 className="font-semibold text-foreground">Đánh giá khóa học</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                          {reviewCriteria.map((criteria) => (
                            <div key={criteria.key} className="space-y-2">
                              <p className="text-sm font-medium">{criteria.label}</p>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((value) => (
                                  <button
                                    key={value}
                                    type="button"
                                    className="rounded p-1 text-warning"
                                    onClick={() => setReviewForm((prev) => ({ ...prev, [criteria.key]: value }))}
                                    aria-label={`${criteria.label}: ${value} sao`}
                                  >
                                    <Star className={`h-5 w-5 ${reviewForm[criteria.key] >= value ? "fill-warning" : ""}`} />
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                        <Textarea
                          value={reviewForm.comment}
                          onChange={(event) => setReviewForm((prev) => ({ ...prev, comment: event.target.value }))}
                          placeholder="Nhận xét thêm về khóa học..."
                          rows={4}
                        />
                        <Button onClick={handleSubmitReview} disabled={reviewSubmitting}>
                          {reviewSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
                        </Button>
                      </div>
                    ) : reviewEligibility?.already_reviewed ? (
                      <p className="text-sm text-green-600">Bạn đã đánh giá khóa học này.</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Hoàn thành khóa học để mở đánh giá.</p>
                    )}
                  </div>
                )}

                {reviews.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                    Chưa có đánh giá cho khóa học này.
                  </p>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="border-b border-border pb-5 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{review.student_name || `Học viên #${review.student_id}`}</p>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-warning text-warning" />
                          <span>{review.average_rating.toFixed(1)}</span>
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
