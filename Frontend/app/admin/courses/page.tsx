"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AdminShell } from "../_components/admin-shell"
import { API_URL, apiFetch } from "@/lib/api"
import { getCourseThumbnailUrl } from "@/lib/course-thumbnail"
import { getStoredToken, getStoredUser, redirectPathForRole } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Eye, Star, XCircle, BookOpen, Clock, UserRound } from "lucide-react"

type CourseStatus = "draft" | "pending" | "pending_review" | "approved" | "rejected" | "hidden" | "archived"

type Course = {
  id: number
  title: string
  category: string
  description?: string | null
  price: number
  thumbnail_url?: string | null
  level: string
  status: CourseStatus
  instructor_id: number
  rejection_reason?: string | null
  created_at: string
  updated_at: string
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

type CourseList = {
  items: Course[]
  total: number
  page: number
  page_size: number
}

type CourseReviewInfo = {
  major?: string | null
  degree_url?: string | null
  instructor_verification?: {
    id: number
    major?: string | null
    degree_url?: string | null
    qualifications?: { id: number; major: string; university_name: string; graduation_year: number }[]
  } | null
}

type CourseReview = {
  id: number
  student_id: number
  student_name?: string | null
  average_rating: number
  content_quality: number
  video_quality: number
  instructor_clarity: number
  material_usefulness: number
  assessment_quality: number
  practical_value: number
  overall_satisfaction: number
  comment?: string | null
  is_visible: boolean
  created_at: string
}

const reviewCriteriaLabels: { key: keyof Pick<CourseReview, "content_quality" | "video_quality" | "instructor_clarity" | "material_usefulness" | "assessment_quality" | "practical_value" | "overall_satisfaction">; label: string }[] = [
  { key: "content_quality", label: "Nội dung" },
  { key: "video_quality", label: "Video" },
  { key: "instructor_clarity", label: "Giảng viên" },
  { key: "material_usefulness", label: "Tài liệu" },
  { key: "assessment_quality", label: "Bài kiểm tra" },
  { key: "practical_value", label: "Ứng dụng" },
  { key: "overall_satisfaction", label: "Hài lòng" },
]

function instructorName(course: Course) {
  return course.instructor?.full_name || course.instructor?.username || `Instructor #${course.instructor_id}`
}

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

function statusClass(status: CourseStatus) {
  if (status === "approved") return "bg-green-100 text-green-700 hover:bg-green-100"
  if (status === "pending") return "bg-amber-100 text-amber-700 hover:bg-amber-100"
  if (status === "rejected") return "bg-red-100 text-red-700 hover:bg-red-100"
  return "bg-muted text-muted-foreground hover:bg-muted"
}

async function openQualificationFile(verificationId: number, qualificationId: number) {
  const token = getStoredToken()
  const response = await fetch(`${API_URL}/instructor-verifications/${verificationId}/qualification-files/${qualificationId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  if (!response.ok) throw new Error("Không mở được file bằng cấp")
  const blob = await response.blob()
  window.open(URL.createObjectURL(blob), "_blank", "noopener,noreferrer")
}

export default function AdminCoursesPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<number | null>(null)
  const [reviewInfos, setReviewInfos] = useState<Record<number, CourseReviewInfo>>({})
  const [expandedReviewCourseId, setExpandedReviewCourseId] = useState<number | null>(null)
  const [courseReviews, setCourseReviews] = useState<Record<number, CourseReview[]>>({})
  const [loadingReviewCourseId, setLoadingReviewCourseId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

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

    loadCourses()
  }, [router])

  async function loadCourses() {
    try {
      setLoading(true)
      setError(null)
      const result = await apiFetch<Course[]>("/admin/courses")
      setCourses(result.data)
      const pending = result.data.filter((course) => course.status === "pending" || course.status === "pending_review")
      const infoEntries = await Promise.all(
        pending.map(async (course) => {
          try {
            const info = await apiFetch<CourseReviewInfo>(`/admin/courses/${course.id}/review-info`)
            return [course.id, info.data] as const
          } catch {
            return [course.id, null] as const
          }
        })
      )
      setReviewInfos(Object.fromEntries(infoEntries.filter((entry): entry is readonly [number, CourseReviewInfo] => Boolean(entry[1]))))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được danh sách khóa học")
    } finally {
      setLoading(false)
    }
  }

  async function moderateCourse(courseId: number, status: "approved" | "rejected") {
    try {
      setActionId(courseId)
      setError(null)
      setMessage(null)

      let rejection_reason: string | null = null
      if (status === "rejected") {
        rejection_reason = window.prompt("Nhập lý do từ chối khóa học:", "Nội dung khóa học chưa đáp ứng yêu cầu.")?.trim() || null
        if (!rejection_reason) return
      }

      const result = await apiFetch<Course>(`/admin/courses/${courseId}/${status === "approved" ? "approve" : "reject"}`, {
        method: "PATCH",
        body: status === "rejected" ? JSON.stringify({ admin_note: rejection_reason }) : undefined,
      })

      setCourses((prev) => prev.map((course) => (course.id === courseId ? result.data : course)))
      setMessage(status === "approved" ? "Đã duyệt khóa học." : "Đã từ chối khóa học.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không cập nhật được trạng thái khóa học")
    } finally {
      setActionId(null)
    }
  }

  async function loadCourseReviews(courseId: number) {
    if (expandedReviewCourseId === courseId) {
      setExpandedReviewCourseId(null)
      return
    }
    try {
      setExpandedReviewCourseId(courseId)
      setLoadingReviewCourseId(courseId)
      setError(null)
      const result = await apiFetch<CourseReview[]>(`/admin/courses/${courseId}/reviews`)
      setCourseReviews((prev) => ({ ...prev, [courseId]: result.data }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được đánh giá khóa học")
    } finally {
      setLoadingReviewCourseId(null)
    }
  }

  async function toggleReviewVisibility(courseId: number, review: CourseReview) {
    try {
      setError(null)
      const result = await apiFetch<CourseReview>(`/admin/reviews/${review.id}/visibility`, {
        method: "PATCH",
        body: JSON.stringify({ is_visible: !review.is_visible }),
      })
      setCourseReviews((prev) => ({
        ...prev,
        [courseId]: (prev[courseId] ?? []).map((item) => (item.id === review.id ? result.data : item)),
      }))
      setMessage(result.data.is_visible ? "Đã hiện đánh giá. Rating sẽ tính lại theo đánh giá này." : "Đã ẩn đánh giá. Rating sẽ không tính đánh giá này.")
      await loadCourses()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không cập nhật được trạng thái đánh giá")
    }
  }

  const pendingCourses = useMemo(() => courses.filter((course) => course.status === "pending" || course.status === "pending_review"), [courses])
  const approvedCourses = useMemo(() => courses.filter((course) => course.status === "approved"), [courses])
  const rejectedCourses = useMemo(() => courses.filter((course) => course.status === "rejected"), [courses])

  return (
    <AdminShell title="Quản lý khóa học" activeKey="courses">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground">Kiểm duyệt và theo dõi chất lượng nội dung</h2>
        <p className="mt-1 text-muted-foreground">
          Các khóa học ở trạng thái chờ duyệt sẽ được admin phê duyệt trước khi hiển thị cho học viên.
        </p>
      </div>

      {error && <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}
      {message && <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">{message}</div>}

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Tổng khóa học</p>
            <p className="mt-2 text-3xl font-bold text-foreground">{courses.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Đang chờ duyệt</p>
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

      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Danh sách khóa học chờ duyệt</CardTitle>
          <Button variant="outline" size="sm" onClick={loadCourses} disabled={loading}>
            Tải lại
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">Đang tải khóa học...</p>
          ) : pendingCourses.length === 0 ? (
            <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">Không có khóa học nào đang chờ duyệt.</p>
          ) : (
            <div className="space-y-4">
              {pendingCourses.map((course) => (
                <div key={course.id} className="rounded-xl border border-border p-5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex min-w-0 gap-4">
                      <img
                        src={getCourseThumbnailUrl(course)}
                        alt={course.title}
                        className="hidden h-24 w-36 rounded-lg object-cover sm:block"
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <BookOpen className="h-4 w-4 text-primary" />
                          <h3 className="font-semibold text-foreground">{course.title}</h3>
                          <Badge className={statusClass(course.status)}>{statusLabel(course.status)}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{course.description || "Chưa có mô tả"}</p>
                        <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <UserRound className="h-4 w-4" />
                            {instructorName(course)}
                          </span>
                          <span>{course.category}</span>
                          <span>{course.lessons_count} bài học</span>
                          <span>{course.price === 0 ? "Miễn phí" : `${course.price.toLocaleString("vi-VN")}đ`}</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Gửi {new Date(course.updated_at).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                          <span className="rounded-md bg-muted px-2 py-1 text-muted-foreground">
                            Chuyên ngành GV: {reviewInfos[course.id]?.major || "Chưa có"}
                          </span>
                          {reviewInfos[course.id]?.instructor_verification?.qualifications?.[0] && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                openQualificationFile(
                                  reviewInfos[course.id]!.instructor_verification!.id,
                                  reviewInfos[course.id]!.instructor_verification!.qualifications![0].id
                                )
                              }
                            >
                              Xem bằng cấp
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" className="gap-1" asChild>
                        <Link href={`/course/${course.id}?returnTo=/admin/courses`}>
                          <Eye className="h-4 w-4" /> Xem trước
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        className="gap-1 bg-green-600 hover:bg-green-700"
                        onClick={() => moderateCourse(course.id, "approved")}
                        disabled={actionId === course.id}
                      >
                        <Check className="h-4 w-4" /> Duyệt
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="gap-1"
                        onClick={() => moderateCourse(course.id, "rejected")}
                        disabled={actionId === course.id}
                      >
                        <XCircle className="h-4 w-4" /> Từ chối
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tất cả khóa học trong hệ thống</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {courses.map((course) => (
              <div key={course.id} className="rounded-lg border border-border p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">{course.title}</p>
                      <Badge className={statusClass(course.status)}>{statusLabel(course.status)}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {instructorName(course)} • {course.category} • {course.lessons_count} bài học • {course.rating.toFixed(1)} ★ ({course.reviews_count})
                    </p>
                    {course.rejection_reason && <p className="mt-1 text-sm text-destructive">Lý do từ chối: {course.rejection_reason}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => loadCourseReviews(course.id)}>
                      <Star className="mr-2 h-4 w-4" />
                      Đánh giá
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/course/${course.id}?returnTo=/admin/courses`}>Xem</Link>
                    </Button>
                  </div>
                </div>
                {expandedReviewCourseId === course.id && (
                  <div className="mt-4 space-y-3 rounded-lg bg-muted/30 p-4">
                    {loadingReviewCourseId === course.id ? (
                      <p className="text-sm text-muted-foreground">Đang tải đánh giá...</p>
                    ) : (courseReviews[course.id] ?? []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">Khóa học chưa có đánh giá.</p>
                    ) : (
                      (courseReviews[course.id] ?? []).map((review) => (
                        <div key={review.id} className="rounded-lg border border-border bg-background p-4">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="font-semibold">{review.student_name || `Học viên #${review.student_id}`}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(review.created_at).toLocaleDateString("vi-VN")} • Trung bình {review.average_rating.toFixed(1)} / 5
                              </p>
                            </div>
                            <Button variant={review.is_visible ? "outline" : "default"} size="sm" onClick={() => toggleReviewVisibility(course.id, review)}>
                              {review.is_visible ? "Ẩn đánh giá" : "Hiện đánh giá"}
                            </Button>
                          </div>
                          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                            {reviewCriteriaLabels.map((criteria) => (
                              <div key={criteria.key} className="rounded-md bg-muted/40 px-3 py-2">
                                {criteria.label}: <span className="font-medium">{review[criteria.key]} ★</span>
                              </div>
                            ))}
                          </div>
                          {review.comment && <p className="mt-3 text-sm text-muted-foreground">{review.comment}</p>}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </AdminShell>
  )
}
