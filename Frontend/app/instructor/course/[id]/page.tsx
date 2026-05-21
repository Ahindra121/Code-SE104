"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { API_BASE_URL, apiFetch } from "@/lib/api"
import { getCourseThumbnailUrl } from "@/lib/course-thumbnail"
import { getStoredUser, redirectPathForRole } from "@/lib/auth"
import { LogoutButton } from "@/components/logout-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  FileQuestion,
  FileText,
  GripVertical,
  GraduationCap,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Video,
  X,
} from "lucide-react"

type CourseStatus = "draft" | "pending" | "pending_review" | "approved" | "rejected" | "hidden" | "archived"
type CourseLevel = "basic" | "intermediate" | "advanced"
type AnswerOption = "A" | "B" | "C" | "D"

type Course = {
  id: number
  title: string
  category: string
  description?: string | null
  price: number
  thumbnail_url?: string | null
  level: CourseLevel
  status: CourseStatus
  is_deleted: boolean
  deleted_at?: string | null
  lessons_count: number
}

type Lesson = {
  id: number
  course_id: number
  title: string
  video_url?: string | null
  document_url?: string | null
  document_name?: string | null
  document_type?: string | null
  order_index: number
  duration_seconds: number
  is_visible: boolean
  is_deleted: boolean
  deleted_at?: string | null
}

type Question = {
  id: number
  lesson_id: number
  content: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: AnswerOption
  is_active: boolean
  deleted_at?: string | null
}

type CourseForm = {
  title: string
  category: string
  description: string
  price: string
  thumbnail_url: string
  level: CourseLevel
  status: "draft" | "pending_review"
}

type VerificationStatus = "pending" | "approved" | "rejected"

type InstructorVerification = {
  id: number
  status: VerificationStatus
  major: string
  university_name: string
  graduation_year: number
  admin_note?: string | null
}

type VerificationForm = {
  full_name: string
  cccd_number: string
  major: string
  university_name: string
  graduation_year: string
  cccd_front_file: File | null
  cccd_back_file: File | null
  degree_file: File | null
}

type LessonForm = {
  title: string
  video_url: string
  document_url: string
  is_visible: boolean
}

type QuestionForm = {
  lesson_id: string
  content: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: AnswerOption
}

type FinalQuestionType = "multiple_choice" | "essay"
type FinalSubmissionStatus = "submitted" | "pending_grading" | "graded" | "passed" | "failed"

type FinalTestQuestion = {
  id: number
  final_test_id: number
  question_text: string
  question_type: FinalQuestionType
  options?: Record<string, string> | null
  correct_answer?: string | null
  max_score: number
  order_index: number
}

type FinalTest = {
  id: number
  course_id: number
  title: string
  description?: string | null
  passing_score_percent: number
  is_active: boolean
  questions: FinalTestQuestion[]
}

type FinalTestForm = {
  title: string
  description: string
  passing_score_percent: string
  is_active: boolean
}

type FinalTestQuestionForm = {
  question_text: string
  question_type: FinalQuestionType
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: AnswerOption
  max_score: string
  order_index: string
}

type FinalTestSubmission = {
  id: number
  attempt_number: number
  student_name?: string | null
  student_email?: string | null
  answers: { question_id: number; question_type: FinalQuestionType; answer: string; is_correct?: boolean | null; auto_score?: number | null }[]
  auto_score: number
  manual_score?: number | null
  total_score?: number | null
  max_score: number
  score_percent?: number | null
  status: FinalSubmissionStatus
  instructor_feedback?: string | null
  submitted_at: string
  questions: FinalTestQuestion[]
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

const categories = ["IT", "Business", "Language", "Soft Skills"]
const THUMBNAIL_ACCEPT = ".jpg,.jpeg,.png,.webp"
const VIDEO_ACCEPT = ".mp4,.webm,.mov"
const DOCUMENT_ACCEPT = ".pdf,.doc,.docx,.ppt,.pptx"
const MAX_THUMBNAIL_SIZE = 5 * 1024 * 1024
const MAX_VIDEO_SIZE = 100 * 1024 * 1024
const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024
const THUMBNAIL_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"]
const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov"]
const DOCUMENT_EXTENSIONS = [".pdf", ".doc", ".docx", ".ppt", ".pptx"]
const levels: { value: CourseLevel; label: string }[] = [
  { value: "basic", label: "Cơ bản" },
  { value: "intermediate", label: "Trung bình" },
  { value: "advanced", label: "Nâng cao" },
]

const emptyCourseForm: CourseForm = {
  title: "",
  category: "IT",
  description: "",
  price: "0",
  thumbnail_url: "",
  level: "basic",
  status: "draft",
}

const emptyVerificationForm: VerificationForm = {
  full_name: "",
  cccd_number: "",
  major: "",
  university_name: "",
  graduation_year: "",
  cccd_front_file: null,
  cccd_back_file: null,
  degree_file: null,
}

const emptyLessonForm: LessonForm = {
  title: "",
  video_url: "",
  document_url: "",
  is_visible: true,
}

const emptyQuestionForm: QuestionForm = {
  lesson_id: "",
  content: "",
  option_a: "",
  option_b: "",
  option_c: "",
  option_d: "",
  correct_option: "A",
}

const emptyFinalTestForm: FinalTestForm = {
  title: "Final Test cuối khóa",
  description: "",
  passing_score_percent: "70",
  is_active: true,
}

const emptyFinalQuestionForm: FinalTestQuestionForm = {
  question_text: "",
  question_type: "multiple_choice",
  option_a: "",
  option_b: "",
  option_c: "",
  option_d: "",
  correct_answer: "A",
  max_score: "1",
  order_index: "1",
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

function toForm(course: Course): CourseForm {
  return {
    title: course.title,
    category: course.category,
    description: course.description ?? "",
    price: String(course.price),
    thumbnail_url: course.thumbnail_url ?? "",
    level: course.level,
    status: course.status === "pending" || course.status === "pending_review" ? "pending_review" : "draft",
  }
}

function fileExtension(file: File) {
  return file.name.slice(file.name.lastIndexOf(".")).toLowerCase()
}

function validateUploadFile(file: File, type: "video" | "document") {
  const isVideo = type === "video"
  const allowedExtensions = isVideo ? VIDEO_EXTENSIONS : DOCUMENT_EXTENSIONS
  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_DOCUMENT_SIZE
  const label = isVideo ? "Video" : "Tài liệu"

  if (!allowedExtensions.includes(fileExtension(file))) {
    return `${label} sai định dạng file`
  }
  if (file.size > maxSize) {
    return `${label} vượt quá ${isVideo ? "100MB" : "20MB"}`
  }
  return null
}

function validateThumbnailFile(file: File) {
  if (!THUMBNAIL_EXTENSIONS.includes(fileExtension(file))) {
    return "Ảnh đại diện chỉ hỗ trợ JPG, JPEG, PNG hoặc WEBP"
  }
  if (file.size > MAX_THUMBNAIL_SIZE) {
    return "Ảnh đại diện vượt quá 5MB"
  }
  return null
}

function assetUrl(url?: string | null) {
  if (!url) return ""
  if (/^https?:\/\//i.test(url)) return url
  return `${API_BASE_URL}${url}`
}

export default function CourseEditorPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isNewCourse = params.id === "new"
  const courseId = Number(params.id)

  const [course, setCourse] = useState<Course | null>(null)
  const [courseForm, setCourseForm] = useState<CourseForm>(emptyCourseForm)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [questionsByLesson, setQuestionsByLesson] = useState<Record<number, Question[]>>({})
  const [lessonForm, setLessonForm] = useState<LessonForm>(emptyLessonForm)
  const [lessonVideoFile, setLessonVideoFile] = useState<File | null>(null)
  const [lessonDocumentFile, setLessonDocumentFile] = useState<File | null>(null)
  const [questionForm, setQuestionForm] = useState<QuestionForm>(emptyQuestionForm)
  const [finalTest, setFinalTest] = useState<FinalTest | null>(null)
  const [finalTestForm, setFinalTestForm] = useState<FinalTestForm>(emptyFinalTestForm)
  const [finalQuestionForm, setFinalQuestionForm] = useState<FinalTestQuestionForm>(emptyFinalQuestionForm)
  const [finalSubmissions, setFinalSubmissions] = useState<FinalTestSubmission[]>([])
  const [courseReviews, setCourseReviews] = useState<CourseReview[]>([])
  const [manualScores, setManualScores] = useState<Record<number, string>>({})
  const [feedbacks, setFeedbacks] = useState<Record<number, string>>({})
  const [editingFinalQuestionId, setEditingFinalQuestionId] = useState<number | null>(null)
  const [finalQuestionEditForm, setFinalQuestionEditForm] = useState<FinalTestQuestionForm>(emptyFinalQuestionForm)
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null)
  const [lessonEditForm, setLessonEditForm] = useState<LessonForm>(emptyLessonForm)
  const [lessonEditVideoFile, setLessonEditVideoFile] = useState<File | null>(null)
  const [lessonEditDocumentFile, setLessonEditDocumentFile] = useState<File | null>(null)
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null)
  const [questionEditForm, setQuestionEditForm] = useState<QuestionForm>(emptyQuestionForm)
  const [isReorderingLessons, setIsReorderingLessons] = useState(false)
  const [draftLessons, setDraftLessons] = useState<Lesson[]>([])
  const [draggedLessonId, setDraggedLessonId] = useState<number | null>(null)
  const [loading, setLoading] = useState(!isNewCourse)
  const [savingCourse, setSavingCourse] = useState(false)
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false)
  const [savingLesson, setSavingLesson] = useState(false)
  const [savingQuestion, setSavingQuestion] = useState(false)
  const [savingFinalTest, setSavingFinalTest] = useState(false)
  const [savingFinalQuestion, setSavingFinalQuestion] = useState(false)
  const [savingFinalQuestionEdit, setSavingFinalQuestionEdit] = useState(false)
  const [gradingSubmissionId, setGradingSubmissionId] = useState<number | null>(null)
  const [savingLessonEdit, setSavingLessonEdit] = useState(false)
  const [uploadingLessonAsset, setUploadingLessonAsset] = useState<string | null>(null)
  const [savingQuestionEdit, setSavingQuestionEdit] = useState(false)
  const [savingLessonOrder, setSavingLessonOrder] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [verification, setVerification] = useState<InstructorVerification | null>(null)
  const [verificationForm, setVerificationForm] = useState<VerificationForm>(emptyVerificationForm)
  const [savingVerification, setSavingVerification] = useState(false)

  const currentCourseId = course?.id ?? (Number.isFinite(courseId) ? courseId : null)
  const initialTab = searchParams.get("tab") === "final-test" ? "final-test" : "info"

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

    let alive = true

    async function loadPage() {
      try {
        setLoading(true)
        setError(null)
        const verificationRes = await apiFetch<InstructorVerification | null>("/instructor-verifications/me")
        if (!alive) return
        setVerification(verificationRes.data)

        if (isNewCourse) {
          return
        }

        const [courseRes, lessonsRes] = await Promise.all([
          apiFetch<Course>(`/courses/${courseId}`),
          apiFetch<Lesson[]>(`/lessons/course/${courseId}?include_deleted=true`),
        ])

        if (!alive) return
        setCourse(courseRes.data)
        setCourseForm(toForm(courseRes.data))
        setLessons(lessonsRes.data)
        setDraftLessons(lessonsRes.data)
        setQuestionForm((prev) => ({ ...prev, lesson_id: lessonsRes.data[0]?.id ? String(lessonsRes.data[0].id) : "" }))

        const questionEntries = await Promise.all(
          lessonsRes.data.map(async (lesson) => {
            try {
              const result = await apiFetch<Question[]>(`/questions/lesson/${lesson.id}?include_inactive=true`)
              return [lesson.id, result.data] as const
            } catch {
              return [lesson.id, []] as const
            }
          })
        )

        if (alive) setQuestionsByLesson(Object.fromEntries(questionEntries))

        const [finalTestRes, submissionsRes, courseReviewsRes] = await Promise.allSettled([
          apiFetch<FinalTest | null>(`/instructor/courses/${courseId}/final-test`),
          apiFetch<FinalTestSubmission[]>(`/instructor/courses/${courseId}/final-test/submissions?status=pending_grading`),
          apiFetch<CourseReview[]>(`/instructor/courses/${courseId}/reviews`),
        ])
        if (!alive) return
        if (finalTestRes.status === "fulfilled" && finalTestRes.value.data) {
          const loadedFinalTest = finalTestRes.value.data
          setFinalTest(loadedFinalTest)
          setFinalTestForm({
            title: loadedFinalTest.title,
            description: loadedFinalTest.description ?? "",
            passing_score_percent: String(loadedFinalTest.passing_score_percent),
            is_active: loadedFinalTest.is_active,
          })
          setFinalQuestionForm((prev) => ({
            ...prev,
            order_index: String((loadedFinalTest.questions?.length ?? 0) + 1),
          }))
        }
        if (submissionsRes.status === "fulfilled") {
          setFinalSubmissions(submissionsRes.value.data)
        }
        if (courseReviewsRes.status === "fulfilled") {
          setCourseReviews(courseReviewsRes.value.data)
        }
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : "Không tải được khóa học")
      } finally {
        if (alive) setLoading(false)
      }
    }

    loadPage()
    return () => {
      alive = false
    }
  }, [courseId, isNewCourse, router])

  useEffect(() => {
    if (!isReorderingLessons) {
      setDraftLessons(lessons)
    }
  }, [isReorderingLessons, lessons])

  useEffect(() => {
    if (!thumbnailFile) {
      setThumbnailPreviewUrl(null)
      return
    }
    const objectUrl = URL.createObjectURL(thumbnailFile)
    setThumbnailPreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [thumbnailFile])

  const totalQuestions = useMemo(
    () => Object.values(questionsByLesson).reduce((sum, questions) => sum + questions.length, 0),
    [questionsByLesson]
  )

  async function handleSaveCourse() {
    try {
      setSavingCourse(true)
      setMessage(null)
      setError(null)

      const payload: {
        title: string
        category: string
        description: string | null
        price: number
        thumbnail_url: string | null
        level: CourseLevel
        status?: "draft" | "pending_review"
      } = {
        title: courseForm.title.trim(),
        category: courseForm.category,
        description: courseForm.description.trim() || null,
        price: Number(courseForm.price) || 0,
        thumbnail_url: courseForm.thumbnail_url.trim() || null,
        level: courseForm.level,
      }

      if (isNewCourse) {
        payload.status = "draft"
      } else if (!course || course.status === "draft" || course.status === "pending" || course.status === "pending_review" || course.status === "rejected") {
        payload.status = courseForm.status
      }

      if (!payload.title) {
        setError("Vui lòng nhập tên khóa học")
        return
      }

      if (isNewCourse) {
        const result = await apiFetch<Course>("/courses", {
          method: "POST",
          body: JSON.stringify(payload),
        })
        const savedCourse = thumbnailFile ? await uploadCourseThumbnail(result.data.id, thumbnailFile) : result.data
        setThumbnailFile(null)
        setCourse(savedCourse)
        setCourseForm(toForm(savedCourse))
        setMessage("Đã lưu khóa học thành bản nháp. Bạn có thể thêm bài giảng và câu hỏi.")
        router.replace(`/instructor/course/${savedCourse.id}`)
        return
      }

      const result = await apiFetch<Course>(`/courses/${courseId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      })
      const savedCourse = thumbnailFile ? await uploadCourseThumbnail(result.data.id, thumbnailFile) : result.data
      setThumbnailFile(null)
      setCourse(savedCourse)
      setCourseForm(toForm(savedCourse))
      setMessage("Đã lưu thông tin khóa học.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được khóa học")
    } finally {
      setSavingCourse(false)
    }
  }

  function handleThumbnailFileChange(file: File | null) {
    setError(null)
    if (!file) {
      setThumbnailFile(null)
      return
    }
    const validationError = validateThumbnailFile(file)
    if (validationError) {
      setThumbnailFile(null)
      setError(validationError)
      return
    }
    setThumbnailFile(file)
  }

  async function uploadCourseThumbnail(courseId: number, file: File) {
    const validationError = validateThumbnailFile(file)
    if (validationError) {
      throw new Error(validationError)
    }
    const formData = new FormData()
    formData.append("file", file)
    setUploadingThumbnail(true)
    try {
      const result = await apiFetch<Course>(`/courses/${courseId}/upload-thumbnail`, {
        method: "POST",
        body: formData,
      })
      return result.data
    } finally {
      setUploadingThumbnail(false)
    }
  }

  async function handleSubmitVerification() {
    try {
      setSavingVerification(true)
      setMessage(null)
      setError(null)

      if (
        !verificationForm.full_name.trim() ||
        !verificationForm.cccd_number.trim() ||
        !verificationForm.major.trim() ||
        !verificationForm.university_name.trim() ||
        !verificationForm.graduation_year.trim() ||
        !verificationForm.cccd_front_file ||
        !verificationForm.cccd_back_file ||
        !verificationForm.degree_file
      ) {
        setError("Vui lòng nhập đầy đủ thông tin và 3 file xác minh.")
        return
      }

      const formData = new FormData()
      formData.append("full_name", verificationForm.full_name.trim())
      formData.append("cccd_number", verificationForm.cccd_number.trim())
      formData.append("major", verificationForm.major.trim())
      formData.append("university_name", verificationForm.university_name.trim())
      formData.append("graduation_year", verificationForm.graduation_year.trim())
      formData.append("cccd_front_file", verificationForm.cccd_front_file)
      formData.append("cccd_back_file", verificationForm.cccd_back_file)
      formData.append("degree_file", verificationForm.degree_file)

      const result = await apiFetch<InstructorVerification>("/instructor-verifications", {
        method: "POST",
        body: formData,
      })
      setVerification(result.data)
      setVerificationForm(emptyVerificationForm)
      setMessage("Đã gửi hồ sơ xác minh giảng viên. Bạn có thể tạo khóa học sau khi admin duyệt.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không gửi được hồ sơ xác minh")
    } finally {
      setSavingVerification(false)
    }
  }

  async function uploadLessonAsset(lessonId: number, type: "video" | "document", file: File) {
    const validationError = validateUploadFile(file, type)
    if (validationError) {
      throw new Error(validationError)
    }

    const formData = new FormData()
    formData.append("file", file)
    setUploadingLessonAsset(`${lessonId}:${type}`)

    const result = await apiFetch<Lesson>(`/lessons/${lessonId}/upload-${type}`, {
      method: "POST",
      body: formData,
    })
    return result.data
  }

  async function uploadLessonFiles(lessonId: number, videoFile: File | null, documentFile: File | null) {
    let updatedLesson: Lesson | null = null

    try {
      if (videoFile) {
        updatedLesson = await uploadLessonAsset(lessonId, "video", videoFile)
      }
      if (documentFile) {
        updatedLesson = await uploadLessonAsset(lessonId, "document", documentFile)
      }
      return updatedLesson
    } finally {
      setUploadingLessonAsset(null)
    }
  }

  async function handleAddLesson() {
    if (!currentCourseId) {
      setError("Vui lòng lưu khóa học trước khi thêm bài học")
      return
    }

    try {
      setSavingLesson(true)
      setMessage(null)
      setError(null)

      const payload = {
        course_id: currentCourseId,
        title: lessonForm.title.trim(),
        video_url: null,
        document_url: null,
        duration_seconds: 0,
        order_index: lessons.length + 1,
        is_visible: lessonForm.is_visible,
      }

      if (!payload.title) {
        setError("Vui lòng nhập tên bài học")
        return
      }

      const result = await apiFetch<Lesson>("/lessons", {
        method: "POST",
        body: JSON.stringify(payload),
      })

      let savedLesson = result.data
      setLessons((prev) => [...prev, savedLesson])
      setQuestionsByLesson((prev) => ({ ...prev, [savedLesson.id]: [] }))
      setQuestionForm((prev) => ({ ...prev, lesson_id: prev.lesson_id || String(savedLesson.id) }))

      const uploadedLesson = await uploadLessonFiles(savedLesson.id, lessonVideoFile, lessonDocumentFile)
      if (uploadedLesson) {
        savedLesson = uploadedLesson
        setLessons((prev) => prev.map((lesson) => (lesson.id === savedLesson.id ? savedLesson : lesson)))
      }

      setLessonForm(emptyLessonForm)
      setLessonVideoFile(null)
      setLessonDocumentFile(null)
      setMessage("Đã thêm bài học.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thêm được bài học")
    } finally {
      setSavingLesson(false)
    }
  }

  async function handleDeleteLesson(lessonId: number) {
    if (!window.confirm("Ẩn bài học này?")) return

    try {
      setError(null)
      await apiFetch(`/lessons/${lessonId}`, { method: "DELETE" })
      setLessons((prev) =>
        prev.map((lesson) =>
          lesson.id === lessonId ? { ...lesson, is_deleted: true, is_visible: false, deleted_at: new Date().toISOString() } : lesson
        )
      )
      setMessage("Đã ẩn bài học.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không ẩn được bài học")
    }
  }

  async function handleRestoreLesson(lessonId: number) {
    try {
      setError(null)
      const result = await apiFetch<Lesson>(`/lessons/${lessonId}/restore`, { method: "PATCH" })
      setLessons((prev) => prev.map((lesson) => (lesson.id === lessonId ? result.data : lesson)))
      setMessage("Đã khôi phục bài học.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không khôi phục được bài học")
    }
  }

  function startEditLesson(lesson: Lesson) {
    setEditingLessonId(lesson.id)
    setLessonEditVideoFile(null)
    setLessonEditDocumentFile(null)
    setLessonEditForm({
      title: lesson.title,
      video_url: lesson.video_url ?? "",
      document_url: lesson.document_url ?? "",
      is_visible: lesson.is_visible,
    })
  }

  async function handleUpdateLesson(lessonId: number) {
    try {
      setSavingLessonEdit(true)
      setMessage(null)
      setError(null)

      const payload = {
        title: lessonEditForm.title.trim(),
        video_url: lessonEditForm.video_url.trim() || null,
        document_url: lessonEditForm.document_url.trim() || null,
        duration_seconds: 0,
        is_visible: lessonEditForm.is_visible,
      }

      if (!payload.title) {
        setError("Vui lòng nhập tên bài học")
        return
      }

      const result = await apiFetch<Lesson>(`/lessons/${lessonId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      })

      let savedLesson = result.data
      setLessons((prev) => prev.map((lesson) => (lesson.id === lessonId ? savedLesson : lesson)))

      const uploadedLesson = await uploadLessonFiles(lessonId, lessonEditVideoFile, lessonEditDocumentFile)
      if (uploadedLesson) {
        savedLesson = uploadedLesson
        setLessons((prev) => prev.map((lesson) => (lesson.id === lessonId ? savedLesson : lesson)))
      }

      setEditingLessonId(null)
      setLessonEditForm(emptyLessonForm)
      setLessonEditVideoFile(null)
      setLessonEditDocumentFile(null)
      setMessage("Đã cập nhật bài giảng.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không cập nhật được bài giảng")
    } finally {
      setSavingLessonEdit(false)
    }
  }

  function handleStartReorderLessons() {
    setEditingLessonId(null)
    setDraftLessons([...lessons].sort((a, b) => a.order_index - b.order_index))
    setIsReorderingLessons(true)
  }

  function handleCancelReorderLessons() {
    setDraftLessons(lessons)
    setDraggedLessonId(null)
    setIsReorderingLessons(false)
  }

  function handleDropLesson(targetLessonId: number) {
    if (!draggedLessonId || draggedLessonId === targetLessonId) return
    setDraftLessons((prev) => {
      const fromIndex = prev.findIndex((lesson) => lesson.id === draggedLessonId)
      const toIndex = prev.findIndex((lesson) => lesson.id === targetLessonId)
      if (fromIndex < 0 || toIndex < 0) return prev
      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
    setDraggedLessonId(null)
  }

  async function handleSaveLessonOrder() {
    if (!currentCourseId) return

    try {
      setSavingLessonOrder(true)
      setMessage(null)
      setError(null)
      const result = await apiFetch<Lesson[]>(`/lessons/course/${currentCourseId}/reorder`, {
        method: "PATCH",
        body: JSON.stringify({
          items: draftLessons.map((lesson, index) => ({
            id: lesson.id,
            order_index: index + 1,
          })),
        }),
      })
      setLessons(result.data)
      setDraftLessons(result.data)
      setIsReorderingLessons(false)
      setMessage("Đã lưu thứ tự bài giảng.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được thứ tự bài giảng")
    } finally {
      setSavingLessonOrder(false)
    }
  }

  async function handleAddQuestion() {
    try {
      setSavingQuestion(true)
      setMessage(null)
      setError(null)

      const lessonId = Number(questionForm.lesson_id)
      const payload = {
        lesson_id: lessonId,
        content: questionForm.content.trim(),
        option_a: questionForm.option_a.trim(),
        option_b: questionForm.option_b.trim(),
        option_c: questionForm.option_c.trim(),
        option_d: questionForm.option_d.trim(),
        correct_option: questionForm.correct_option,
      }

      if (!payload.lesson_id || !payload.content || !payload.option_a || !payload.option_b || !payload.option_c || !payload.option_d) {
        setError("Vui lòng nhập đầy đủ câu hỏi và 4 đáp án")
        return
      }

      const result = await apiFetch<Question>("/questions", {
        method: "POST",
        body: JSON.stringify(payload),
      })

      setQuestionsByLesson((prev) => ({
        ...prev,
        [lessonId]: [...(prev[lessonId] ?? []), result.data],
      }))
      setQuestionForm((prev) => ({ ...emptyQuestionForm, lesson_id: prev.lesson_id }))
      setMessage("Đã thêm câu hỏi.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thêm được câu hỏi")
    } finally {
      setSavingQuestion(false)
    }
  }

  async function handleDeleteQuestion(question: Question) {
    if (!window.confirm("Ẩn câu hỏi này?")) return

    try {
      setError(null)
      await apiFetch(`/questions/${question.id}`, { method: "DELETE" })
      setQuestionsByLesson((prev) => ({
        ...prev,
        [question.lesson_id]: (prev[question.lesson_id] ?? []).map((item) =>
          item.id === question.id ? { ...item, is_active: false, deleted_at: new Date().toISOString() } : item
        ),
      }))
      setMessage("Đã ẩn câu hỏi.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không ẩn được câu hỏi")
    }
  }

  async function handleRestoreQuestion(question: Question) {
    try {
      setError(null)
      const result = await apiFetch<Question>(`/questions/${question.id}/restore`, { method: "PATCH" })
      setQuestionsByLesson((prev) => ({
        ...prev,
        [question.lesson_id]: (prev[question.lesson_id] ?? []).map((item) =>
          item.id === question.id ? result.data : item
        ),
      }))
      setMessage("Đã khôi phục câu hỏi.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không khôi phục được câu hỏi")
    }
  }

  function startEditQuestion(question: Question) {
    setEditingQuestionId(question.id)
    setQuestionEditForm({
      lesson_id: String(question.lesson_id),
      content: question.content,
      option_a: question.option_a,
      option_b: question.option_b,
      option_c: question.option_c,
      option_d: question.option_d,
      correct_option: question.correct_option,
    })
  }

  async function handleUpdateQuestion(question: Question) {
    try {
      setSavingQuestionEdit(true)
      setMessage(null)
      setError(null)

      const payload = {
        content: questionEditForm.content.trim(),
        option_a: questionEditForm.option_a.trim(),
        option_b: questionEditForm.option_b.trim(),
        option_c: questionEditForm.option_c.trim(),
        option_d: questionEditForm.option_d.trim(),
        correct_option: questionEditForm.correct_option,
      }

      if (!payload.content || !payload.option_a || !payload.option_b || !payload.option_c || !payload.option_d) {
        setError("Vui lòng nhập đầy đủ câu hỏi và 4 đáp án")
        return
      }

      const result = await apiFetch<Question>(`/questions/${question.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      })

      setQuestionsByLesson((prev) => ({
        ...prev,
        [question.lesson_id]: (prev[question.lesson_id] ?? []).map((item) =>
          item.id === question.id ? result.data : item
        ),
      }))
      setEditingQuestionId(null)
      setQuestionEditForm(emptyQuestionForm)
      setMessage("Đã cập nhật câu hỏi.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không cập nhật được câu hỏi")
    } finally {
      setSavingQuestionEdit(false)
    }
  }

  async function handleSaveFinalTest() {
    if (!currentCourseId) {
      setError("Vui lòng lưu khóa học trước khi tạo Final Test")
      return
    }

    try {
      setSavingFinalTest(true)
      setMessage(null)
      setError(null)
      const payload = {
        title: finalTestForm.title.trim(),
        description: finalTestForm.description.trim() || null,
        passing_score_percent: Number(finalTestForm.passing_score_percent) || 70,
        is_active: finalTestForm.is_active,
      }
      if (!payload.title) {
        setError("Vui lòng nhập tên Final Test")
        return
      }
      const result = await apiFetch<FinalTest>(
        finalTest ? `/instructor/final-tests/${finalTest.id}` : `/instructor/courses/${currentCourseId}/final-test`,
        {
          method: finalTest ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        }
      )
      setFinalTest(result.data)
      setFinalQuestionForm((prev) => ({ ...prev, order_index: String((result.data.questions?.length ?? 0) + 1) }))
      setMessage("Đã lưu Final Test.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được Final Test")
    } finally {
      setSavingFinalTest(false)
    }
  }

  async function handleAddFinalQuestion() {
    if (!finalTest) {
      setError("Vui lòng tạo Final Test trước khi thêm câu hỏi")
      return
    }

    try {
      setSavingFinalQuestion(true)
      setMessage(null)
      setError(null)
      const isMultipleChoice = finalQuestionForm.question_type === "multiple_choice"
      const payload = {
        question_text: finalQuestionForm.question_text.trim(),
        question_type: finalQuestionForm.question_type,
        options: isMultipleChoice
          ? {
              A: finalQuestionForm.option_a.trim(),
              B: finalQuestionForm.option_b.trim(),
              C: finalQuestionForm.option_c.trim(),
              D: finalQuestionForm.option_d.trim(),
            }
          : null,
        correct_answer: isMultipleChoice ? finalQuestionForm.correct_answer : null,
        max_score: Number(finalQuestionForm.max_score) || 1,
        order_index: Number(finalQuestionForm.order_index) || (finalTest.questions.length + 1),
      }
      if (!payload.question_text) {
        setError("Vui lòng nhập nội dung câu hỏi Final Test")
        return
      }
      if (isMultipleChoice && (!payload.options?.A || !payload.options?.B || !payload.options?.C || !payload.options?.D)) {
        setError("Vui lòng nhập đủ 4 đáp án cho câu trắc nghiệm")
        return
      }
      const result = await apiFetch<FinalTestQuestion>(`/instructor/final-tests/${finalTest.id}/questions`, {
        method: "POST",
        body: JSON.stringify(payload),
      })
      setFinalTest((prev) => (prev ? { ...prev, questions: [...prev.questions, result.data] } : prev))
      setFinalQuestionForm({ ...emptyFinalQuestionForm, order_index: String(finalTest.questions.length + 2) })
      setMessage("Đã thêm câu hỏi Final Test.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thêm được câu hỏi Final Test")
    } finally {
      setSavingFinalQuestion(false)
    }
  }

  function finalQuestionToForm(question: FinalTestQuestion): FinalTestQuestionForm {
    return {
      question_text: question.question_text,
      question_type: question.question_type,
      option_a: question.options?.A ?? "",
      option_b: question.options?.B ?? "",
      option_c: question.options?.C ?? "",
      option_d: question.options?.D ?? "",
      correct_answer: (question.correct_answer as AnswerOption) || "A",
      max_score: String(question.max_score),
      order_index: String(question.order_index),
    }
  }

  function startEditFinalQuestion(question: FinalTestQuestion) {
    setEditingFinalQuestionId(question.id)
    setFinalQuestionEditForm(finalQuestionToForm(question))
  }

  function finalQuestionPayload(form: FinalTestQuestionForm) {
    const isMultipleChoice = form.question_type === "multiple_choice"
    return {
      question_text: form.question_text.trim(),
      question_type: form.question_type,
      options: isMultipleChoice
        ? {
            A: form.option_a.trim(),
            B: form.option_b.trim(),
            C: form.option_c.trim(),
            D: form.option_d.trim(),
          }
        : null,
      correct_answer: isMultipleChoice ? form.correct_answer : null,
      max_score: Number(form.max_score) || 1,
      order_index: Number(form.order_index) || 1,
    }
  }

  async function handleUpdateFinalQuestion(question: FinalTestQuestion) {
    try {
      setSavingFinalQuestionEdit(true)
      setMessage(null)
      setError(null)
      const payload = finalQuestionPayload(finalQuestionEditForm)
      if (!payload.question_text) {
        setError("Vui lòng nhập nội dung câu hỏi Final Test")
        return
      }
      if (payload.question_type === "multiple_choice" && (!payload.options?.A || !payload.options?.B || !payload.options?.C || !payload.options?.D)) {
        setError("Vui lòng nhập đủ 4 đáp án cho câu trắc nghiệm")
        return
      }
      const result = await apiFetch<FinalTestQuestion>(`/instructor/final-test-questions/${question.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      })
      setFinalTest((prev) =>
        prev ? { ...prev, questions: prev.questions.map((item) => (item.id === question.id ? result.data : item)) } : prev
      )
      setEditingFinalQuestionId(null)
      setFinalQuestionEditForm(emptyFinalQuestionForm)
      setMessage("Đã cập nhật câu hỏi Final Test.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không cập nhật được câu hỏi Final Test")
    } finally {
      setSavingFinalQuestionEdit(false)
    }
  }

  async function handleDeleteFinalQuestion(question: FinalTestQuestion) {
    if (!window.confirm("Xóa câu hỏi Final Test này?")) return

    try {
      setError(null)
      await apiFetch(`/instructor/final-test-questions/${question.id}`, { method: "DELETE" })
      setFinalTest((prev) => (prev ? { ...prev, questions: prev.questions.filter((item) => item.id !== question.id) } : prev))
      if (editingFinalQuestionId === question.id) {
        setEditingFinalQuestionId(null)
        setFinalQuestionEditForm(emptyFinalQuestionForm)
      }
      setMessage("Đã xóa câu hỏi Final Test.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không xóa được câu hỏi Final Test")
    }
  }

  async function handleGradeSubmission(submission: FinalTestSubmission) {
    try {
      setGradingSubmissionId(submission.id)
      setMessage(null)
      setError(null)
      const result = await apiFetch<FinalTestSubmission>(`/instructor/final-test-submissions/${submission.id}/grade`, {
        method: "PATCH",
        body: JSON.stringify({
          manual_score: Number(manualScores[submission.id]) || 0,
          instructor_feedback: feedbacks[submission.id]?.trim() || null,
        }),
      })
      setFinalSubmissions((prev) => prev.filter((item) => item.id !== submission.id))
      setManualScores((prev) => ({ ...prev, [submission.id]: String(result.data.manual_score ?? "") }))
      setMessage(result.data.status === "passed" ? "Đã chấm bài. Học viên đã hoàn thành khóa học." : "Đã chấm bài.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không chấm được bài")
    } finally {
      setGradingSubmissionId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Đang tải trình chỉnh sửa...</p>
      </div>
    )
  }

  if (isNewCourse && verification?.status !== "approved") {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
            <Button variant="ghost" asChild>
              <Link href="/instructor/courses">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại
              </Link>
            </Button>
            <LogoutButton variant="outline" />
          </div>
        </header>
        <main className="mx-auto max-w-5xl p-4 lg:p-8">
          <Card>
            <CardHeader>
              <CardTitle>Xác minh giảng viên</CardTitle>
              <CardDescription>
                Bạn cần có hồ sơ xác minh được admin duyệt trước khi tạo khóa học. Hồ sơ và các bằng cấp của bạn có thể xem, chỉnh sửa hoặc bổ sung tại trang xác minh.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {error && <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}
              {verification?.status === "pending" && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  Hồ sơ của bạn đang chờ admin duyệt.
                </div>
              )}
              {verification?.status === "rejected" && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                  Lý do từ chối: {verification.admin_note || "Admin chưa nhập lý do."}
                </div>
              )}
              <Button asChild>
                <Link href="/instructor/verification">Mở hồ sơ xác minh</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/instructor/courses" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Quay lại</span>
            </Link>
            <div>
              <h1 className="max-w-[360px] truncate font-semibold text-foreground">
                {isNewCourse ? "Tạo khóa học mới" : course?.title || "Chỉnh sửa khóa học"}
              </h1>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant="secondary">{course ? statusLabel(course.status) : "Bản nháp"}</Badge>
                <span className="text-xs text-muted-foreground">{lessons.length} bài học • {totalQuestions} câu hỏi</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LogoutButton
              variant="outline"
              className="hidden border-border bg-background text-foreground hover:bg-muted hover:text-foreground sm:inline-flex"
            />
            <Button size="sm" onClick={handleSaveCourse} disabled={savingCourse || uploadingThumbnail}>
              <Save className="mr-2 h-4 w-4" />
              {savingCourse || uploadingThumbnail ? "Đang lưu..." : "Lưu khóa học"}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {message && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            {message}
          </div>
        )}
        {error && <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}

        <Tabs defaultValue={initialTab} className="space-y-6">
          <TabsList className="grid w-full max-w-3xl grid-cols-5">
            <TabsTrigger value="info">Thông tin</TabsTrigger>
            <TabsTrigger value="lessons" disabled={!currentCourseId}>Bài giảng</TabsTrigger>
            <TabsTrigger value="questions" disabled={!currentCourseId}>Câu hỏi</TabsTrigger>
            <TabsTrigger value="final-test" disabled={!currentCourseId}>Final Test</TabsTrigger>
            <TabsTrigger value="reviews" disabled={!currentCourseId}>Đánh giá</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin khóa học</CardTitle>
                <CardDescription>Tạo hoặc cập nhật thông tin khóa học theo biểu mẫu quản lý khóa học.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="title">Tên khóa học</Label>
                      <Input
                        id="title"
                        value={courseForm.title}
                        onChange={(e) => setCourseForm((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder="Ví dụ: React & Next.js Masterclass"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Mô tả</Label>
                      <Textarea
                        id="description"
                        value={courseForm.description}
                        onChange={(e) => setCourseForm((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Mô tả mục tiêu, nội dung và đối tượng học viên..."
                        rows={5}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Danh mục</Label>
                        <Select value={courseForm.category} onValueChange={(value) => setCourseForm((prev) => ({ ...prev, category: value }))}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Trình độ</Label>
                        <Select value={courseForm.level} onValueChange={(value: CourseLevel) => setCourseForm((prev) => ({ ...prev, level: value }))}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {levels.map((level) => (
                              <SelectItem key={level.value} value={level.value}>
                                {level.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Học phí</Label>
                        <Input
                          type="number"
                          min={0}
                          value={courseForm.price}
                          onChange={(e) => setCourseForm((prev) => ({ ...prev, price: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Ảnh đại diện khóa học</Label>
                      <Input
                        type="file"
                        accept={THUMBNAIL_ACCEPT}
                        onChange={(e) => handleThumbnailFileChange(e.target.files?.[0] ?? null)}
                      />
                      <p className="text-xs text-muted-foreground">
                        JPG, JPEG, PNG, WEBP; tối đa 5MB. Nếu không upload, hệ thống dùng ảnh mặc định theo lĩnh vực.
                      </p>
                      {courseForm.thumbnail_url && !thumbnailFile && (
                        <p className="text-xs text-muted-foreground">Đang dùng ảnh riêng đã upload.</p>
                      )}
                      {thumbnailFile && <p className="text-xs text-primary">Đã chọn: {thumbnailFile.name}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label>Trạng thái gửi duyệt</Label>
                      <Select
                        value={isNewCourse ? "draft" : courseForm.status}
                        onValueChange={(value: "draft" | "pending_review") => setCourseForm((prev) => ({ ...prev, status: value }))}
                        disabled={isNewCourse}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Lưu bản nháp</SelectItem>
                          <SelectItem value="pending_review">Gửi admin duyệt</SelectItem>
                        </SelectContent>
                      </Select>
                      {isNewCourse && (
                        <p className="text-sm text-muted-foreground">Khóa học mới sẽ được lưu thành bản nháp trước, sau đó mới thêm bài giảng và gửi duyệt.</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="aspect-video overflow-hidden rounded-lg border bg-muted">
                      <img
                        src={thumbnailPreviewUrl || getCourseThumbnailUrl({ thumbnail_url: courseForm.thumbnail_url, category: courseForm.category })}
                        alt={courseForm.title || "Ảnh khóa học"}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      Khóa học ở trạng thái chờ duyệt cần admin phê duyệt trước khi học viên nhìn thấy.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lessons" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Thêm bài giảng</CardTitle>
                <CardDescription>Hỗ trợ video URL, tài liệu URL và trạng thái hiển thị.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tên bài học</Label>
                  <Input value={lessonForm.title} onChange={(e) => setLessonForm((prev) => ({ ...prev, title: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Upload video</Label>
                  <Input
                    type="file"
                    accept={VIDEO_ACCEPT}
                    onChange={(e) => setLessonVideoFile(e.target.files?.[0] ?? null)}
                  />
                  <p className="text-xs text-muted-foreground">MP4, WebM, MOV; tối đa 100MB.</p>
                </div>
                <div className="space-y-2">
                  <Label>Upload tài liệu</Label>
                  <Input
                    type="file"
                    accept={DOCUMENT_ACCEPT}
                    onChange={(e) => setLessonDocumentFile(e.target.files?.[0] ?? null)}
                  />
                  <p className="text-xs text-muted-foreground">PDF, DOC, DOCX, PPT, PPTX; tối đa 20MB.</p>
                </div>
                <div className="lg:col-span-2">
                  <Button onClick={handleAddLesson} disabled={savingLesson || Boolean(uploadingLessonAsset) || !currentCourseId}>
                    <Plus className="mr-2 h-4 w-4" />
                    {savingLesson || uploadingLessonAsset ? "Đang upload..." : "Thêm bài học"}
                  </Button>
                  {!currentCourseId && <p className="mt-2 text-sm text-muted-foreground">Hãy lưu khóa học trước khi thêm bài giảng.</p>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Danh sách bài giảng</CardTitle>
                    <CardDescription>Chỉ lưu thứ tự mới vào hệ thống khi bạn bấm lưu thay đổi.</CardDescription>
                  </div>
                  {lessons.length > 1 && (
                    <div className="flex flex-wrap gap-2">
                      {isReorderingLessons ? (
                        <>
                          <Button size="sm" onClick={handleSaveLessonOrder} disabled={savingLessonOrder}>
                            <Save className="mr-2 h-4 w-4" />
                            {savingLessonOrder ? "Đang lưu..." : "Lưu thay đổi"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelReorderLessons} disabled={savingLessonOrder}>
                            <X className="mr-2 h-4 w-4" />
                            Hủy
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="outline" onClick={handleStartReorderLessons}>
                          <GripVertical className="mr-2 h-4 w-4" />
                          Thay đổi thứ tự
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {lessons.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">Chưa có bài giảng nào.</p>
                ) : (
                  (isReorderingLessons ? draftLessons : lessons).map((lesson, index) => (
                    <div
                      key={lesson.id}
                      draggable={isReorderingLessons}
                      onDragStart={() => setDraggedLessonId(lesson.id)}
                      onDragOver={(event) => {
                        if (isReorderingLessons) event.preventDefault()
                      }}
                      onDrop={() => handleDropLesson(lesson.id)}
                      onDragEnd={() => setDraggedLessonId(null)}
                      className={`rounded-lg border border-border p-4 ${isReorderingLessons ? "cursor-move bg-muted/30" : ""}`}
                    >
                      {editingLessonId === lesson.id && !isReorderingLessons ? (
                        <div className="grid gap-4 lg:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Tên bài học</Label>
                            <Input value={lessonEditForm.title} onChange={(e) => setLessonEditForm((prev) => ({ ...prev, title: e.target.value }))} />
                          </div>
                          <div className="space-y-2">
                            <Label>Upload video mới</Label>
                            <Input
                              type="file"
                              accept={VIDEO_ACCEPT}
                              onChange={(e) => setLessonEditVideoFile(e.target.files?.[0] ?? null)}
                            />
                            {lesson.video_url && <p className="text-xs text-muted-foreground">Đã có video: {lesson.video_url}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label>Upload tài liệu mới</Label>
                            <Input
                              type="file"
                              accept={DOCUMENT_ACCEPT}
                              onChange={(e) => setLessonEditDocumentFile(e.target.files?.[0] ?? null)}
                            />
                            {lesson.document_url && <p className="text-xs text-muted-foreground">Đã có tài liệu: {lesson.document_name || lesson.document_url}</p>}
                          </div>
                          <div className="flex flex-wrap gap-2 lg:col-span-2">
                            <Button size="sm" onClick={() => handleUpdateLesson(lesson.id)} disabled={savingLessonEdit || Boolean(uploadingLessonAsset)}>
                              <Save className="mr-2 h-4 w-4" />
                              {savingLessonEdit || uploadingLessonAsset ? "Đang upload..." : "Lưu bài giảng"}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingLessonId(null)}>
                              <X className="mr-2 h-4 w-4" />
                              Hủy
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        {isReorderingLessons ? <GripVertical className="mt-1 h-5 w-5 text-muted-foreground" /> : lesson.video_url ? <Video className="mt-1 h-5 w-5 text-primary" /> : <FileText className="mt-1 h-5 w-5 text-muted-foreground" />}
                        <div>
                          <p className="font-medium text-foreground">
                            Bài {isReorderingLessons ? index + 1 : lesson.order_index}: {lesson.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {lesson.is_deleted ? "Đã ẩn, có thể khôi phục trong 30 ngày" : lesson.is_visible ? "Đang hiển thị" : "Đã ẩn"}
                          </p>
                          {(lesson.video_url || lesson.document_url) && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {lesson.document_name && <Badge variant="secondary">{lesson.document_name}</Badge>}
                              {lesson.video_url && (
                                <Button size="sm" variant="outline" asChild>
                                  <a href={assetUrl(lesson.video_url)} target="_blank" rel="noreferrer">Xem video</a>
                                </Button>
                              )}
                              {lesson.document_url && (
                                <>
                                  <Button size="sm" variant="outline" asChild>
                                    <a href={assetUrl(lesson.document_url)} target="_blank" rel="noreferrer">Xem tài liệu</a>
                                  </Button>
                                  <Button size="sm" variant="outline" asChild>
                                    <a href={`${API_BASE_URL}/api/lessons/${lesson.id}/download-document`} download={lesson.document_name || true}>Tải tài liệu</a>
                                  </Button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            {isReorderingLessons ? (
                              <Badge variant="outline">Kéo thả để đổi vị trí</Badge>
                            ) : lesson.is_deleted ? (
                              <Button variant="outline" size="sm" onClick={() => handleRestoreLesson(lesson.id)}>
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Khôi phục
                              </Button>
                            ) : (
                              <>
                                <Button variant="outline" size="sm" onClick={() => startEditLesson(lesson)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Sửa
                                </Button>
                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteLesson(lesson.id)}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Ẩn
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Thêm câu hỏi bài tập</CardTitle>
                <CardDescription>Câu hỏi được lưu vào ngân hàng câu hỏi của từng bài học.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Bài học</Label>
                  <Select value={questionForm.lesson_id} onValueChange={(value) => setQuestionForm((prev) => ({ ...prev, lesson_id: value }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn bài học" />
                    </SelectTrigger>
                    <SelectContent>
                      {lessons.map((lesson) => (
                        <SelectItem key={lesson.id} value={String(lesson.id)}>
                          Bài {lesson.order_index}: {lesson.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Nội dung câu hỏi</Label>
                  <Textarea value={questionForm.content} onChange={(e) => setQuestionForm((prev) => ({ ...prev, content: e.target.value }))} rows={3} />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {(["a", "b", "c", "d"] as const).map((key) => {
                    const option = key.toUpperCase() as AnswerOption
                    const field = `option_${key}` as keyof QuestionForm
                    return (
                      <div key={key} className="space-y-2">
                        <Label>Đáp án {option}</Label>
                        <Input
                          value={questionForm[field]}
                          onChange={(e) => setQuestionForm((prev) => ({ ...prev, [field]: e.target.value }))}
                        />
                      </div>
                    )
                  })}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="space-y-2">
                    <Label>Đáp án đúng</Label>
                    <Select value={questionForm.correct_option} onValueChange={(value: AnswerOption) => setQuestionForm((prev) => ({ ...prev, correct_option: value }))}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(["A", "B", "C", "D"] as const).map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddQuestion} disabled={savingQuestion || lessons.length === 0}>
                    <Plus className="mr-2 h-4 w-4" />
                    {savingQuestion ? "Đang thêm..." : "Thêm câu hỏi"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ngân hàng câu hỏi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {lessons.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">Cần có bài học trước khi thêm câu hỏi.</p>
                ) : (
                  lessons.map((lesson) => (
                    <div key={lesson.id} className="rounded-lg border border-border p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <FileQuestion className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-foreground">{lesson.title}</h3>
                        <Badge variant="secondary">{questionsByLesson[lesson.id]?.length ?? 0} câu</Badge>
                      </div>

                      <div className="space-y-3">
                        {(questionsByLesson[lesson.id] ?? []).length === 0 ? (
                          <p className="text-sm text-muted-foreground">Chưa có câu hỏi.</p>
                        ) : (
                          questionsByLesson[lesson.id].map((question) => (
                            <div key={question.id} className="rounded-md bg-muted/40 p-3">
                              {editingQuestionId === question.id ? (
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <Label>Nội dung câu hỏi</Label>
                                    <Textarea value={questionEditForm.content} onChange={(e) => setQuestionEditForm((prev) => ({ ...prev, content: e.target.value }))} rows={3} />
                                  </div>
                                  <div className="grid gap-4 md:grid-cols-2">
                                    {(["a", "b", "c", "d"] as const).map((key) => {
                                      const option = key.toUpperCase() as AnswerOption
                                      const field = `option_${key}` as keyof QuestionForm
                                      return (
                                        <div key={key} className="space-y-2">
                                          <Label>Đáp án {option}</Label>
                                          <Input
                                            value={questionEditForm[field]}
                                            onChange={(e) => setQuestionEditForm((prev) => ({ ...prev, [field]: e.target.value }))}
                                          />
                                        </div>
                                      )
                                    })}
                                  </div>
                                  <div className="flex flex-wrap items-end gap-2">
                                    <div className="space-y-2">
                                      <Label>Đáp án đúng</Label>
                                      <Select value={questionEditForm.correct_option} onValueChange={(value: AnswerOption) => setQuestionEditForm((prev) => ({ ...prev, correct_option: value }))}>
                                        <SelectTrigger className="w-40">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {(["A", "B", "C", "D"] as const).map((option) => (
                                            <SelectItem key={option} value={option}>
                                              {option}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <Button size="sm" onClick={() => handleUpdateQuestion(question)} disabled={savingQuestionEdit}>
                                      <Save className="mr-2 h-4 w-4" />
                                      {savingQuestionEdit ? "Đang lưu..." : "Lưu câu hỏi"}
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => setEditingQuestionId(null)}>
                                      <X className="mr-2 h-4 w-4" />
                                      Hủy
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-medium text-foreground">{question.content}</p>
                                  <p className="mt-1 text-sm text-muted-foreground">
                                    Đáp án đúng: {question.correct_option}
                                    {!question.is_active ? " • Đã ẩn, có thể khôi phục trong 30 ngày" : ""}
                                  </p>
                                </div>
                                  <div className="flex items-center gap-2">
                                    {!question.is_active ? (
                                      <Button variant="outline" size="sm" onClick={() => handleRestoreQuestion(question)}>
                                        <RotateCcw className="h-4 w-4" />
                                      </Button>
                                    ) : (
                                      <>
                                        <Button variant="outline" size="sm" onClick={() => startEditQuestion(question)}>
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteQuestion(question)}>
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                              </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Chi tiết đánh giá khóa học</CardTitle>
                <CardDescription>Giảng viên xem được điểm từng tiêu chí của học viên cho khóa học này.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {courseReviews.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">Chưa có đánh giá nào.</p>
                ) : (
                  courseReviews.map((review) => (
                    <div key={review.id} className="rounded-lg border border-border p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-semibold text-foreground">{review.student_name || `Học viên #${review.student_id}`}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString("vi-VN")} • Trung bình {review.average_rating.toFixed(1)} / 5
                          </p>
                        </div>
                        {!review.is_visible && <Badge variant="secondary">Đã bị admin ẩn</Badge>}
                      </div>
                      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="final-test" className="space-y-6">
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Chấm bài Final Test</CardTitle>
                  <CardDescription>
                    {finalSubmissions.length > 0
                      ? `Có ${finalSubmissions.length} bài tự luận đang chờ chấm.`
                      : "Hiện chưa có bài tự luận nào chờ chấm."}
                  </CardDescription>
                </div>
                <Button variant="outline" asChild>
                  <a href="#final-test-grading">Đi đến khu vực chấm bài</a>
                </Button>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Final Test cuối khóa</CardTitle>
                <CardDescription>Học viên chỉ làm được bài này sau khi hoàn thành toàn bộ bài học.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tên bài kiểm tra</Label>
                  <Input value={finalTestForm.title} onChange={(e) => setFinalTestForm((prev) => ({ ...prev, title: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Điểm đạt (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={finalTestForm.passing_score_percent}
                    onChange={(e) => setFinalTestForm((prev) => ({ ...prev, passing_score_percent: e.target.value }))}
                  />
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <Label>Mô tả</Label>
                  <Textarea value={finalTestForm.description} onChange={(e) => setFinalTestForm((prev) => ({ ...prev, description: e.target.value }))} rows={3} />
                </div>
                <div className="lg:col-span-2">
                  <Button onClick={handleSaveFinalTest} disabled={savingFinalTest}>
                    <Save className="mr-2 h-4 w-4" />
                    {savingFinalTest ? "Đang lưu..." : finalTest ? "Cập nhật Final Test" : "Tạo Final Test"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Thêm câu hỏi Final Test</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Loại câu hỏi</Label>
                    <Select value={finalQuestionForm.question_type} onValueChange={(value: FinalQuestionType) => setFinalQuestionForm((prev) => ({ ...prev, question_type: value }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="multiple_choice">Trắc nghiệm</SelectItem>
                        <SelectItem value="essay">Tự luận</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Điểm tối đa</Label>
                    <Input value={finalQuestionForm.max_score} type="number" min="0.1" step="0.1" onChange={(e) => setFinalQuestionForm((prev) => ({ ...prev, max_score: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Thứ tự</Label>
                    <Input value={finalQuestionForm.order_index} type="number" min="1" onChange={(e) => setFinalQuestionForm((prev) => ({ ...prev, order_index: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Nội dung câu hỏi</Label>
                  <Textarea value={finalQuestionForm.question_text} onChange={(e) => setFinalQuestionForm((prev) => ({ ...prev, question_text: e.target.value }))} rows={3} />
                </div>
                {finalQuestionForm.question_type === "multiple_choice" && (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      {(["a", "b", "c", "d"] as const).map((key) => {
                        const option = key.toUpperCase() as AnswerOption
                        const field = `option_${key}` as keyof FinalTestQuestionForm
                        return (
                          <div key={key} className="space-y-2">
                            <Label>Đáp án {option}</Label>
                            <Input value={finalQuestionForm[field]} onChange={(e) => setFinalQuestionForm((prev) => ({ ...prev, [field]: e.target.value }))} />
                          </div>
                        )
                      })}
                    </div>
                    <div className="space-y-2">
                      <Label>Đáp án đúng</Label>
                      <Select value={finalQuestionForm.correct_answer} onValueChange={(value: AnswerOption) => setFinalQuestionForm((prev) => ({ ...prev, correct_answer: value }))}>
                        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(["A", "B", "C", "D"] as const).map((option) => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                <Button onClick={handleAddFinalQuestion} disabled={!finalTest || savingFinalQuestion}>
                  <Plus className="mr-2 h-4 w-4" />
                  {savingFinalQuestion ? "Đang thêm..." : "Thêm câu hỏi Final Test"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Danh sách câu hỏi Final Test</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!finalTest || finalTest.questions.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">Chưa có câu hỏi Final Test.</p>
                ) : (
                  finalTest.questions
                    .slice()
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((question) => (
                      <div key={question.id} className="rounded-lg border border-border p-4">
                        {editingFinalQuestionId === question.id ? (
                          <div className="space-y-4">
                            <div className="grid gap-4 lg:grid-cols-3">
                              <div className="space-y-2">
                                <Label>Loại câu hỏi</Label>
                                <Select
                                  value={finalQuestionEditForm.question_type}
                                  onValueChange={(value: FinalQuestionType) => setFinalQuestionEditForm((prev) => ({ ...prev, question_type: value }))}
                                >
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="multiple_choice">Trắc nghiệm</SelectItem>
                                    <SelectItem value="essay">Tự luận</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Điểm tối đa</Label>
                                <Input
                                  value={finalQuestionEditForm.max_score}
                                  type="number"
                                  min="0.1"
                                  step="0.1"
                                  onChange={(e) => setFinalQuestionEditForm((prev) => ({ ...prev, max_score: e.target.value }))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Thứ tự</Label>
                                <Input
                                  value={finalQuestionEditForm.order_index}
                                  type="number"
                                  min="1"
                                  onChange={(e) => setFinalQuestionEditForm((prev) => ({ ...prev, order_index: e.target.value }))}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Nội dung câu hỏi</Label>
                              <Textarea
                                value={finalQuestionEditForm.question_text}
                                onChange={(e) => setFinalQuestionEditForm((prev) => ({ ...prev, question_text: e.target.value }))}
                                rows={3}
                              />
                            </div>
                            {finalQuestionEditForm.question_type === "multiple_choice" && (
                              <>
                                <div className="grid gap-4 md:grid-cols-2">
                                  {(["a", "b", "c", "d"] as const).map((key) => {
                                    const option = key.toUpperCase() as AnswerOption
                                    const field = `option_${key}` as keyof FinalTestQuestionForm
                                    return (
                                      <div key={key} className="space-y-2">
                                        <Label>Đáp án {option}</Label>
                                        <Input
                                          value={finalQuestionEditForm[field]}
                                          onChange={(e) => setFinalQuestionEditForm((prev) => ({ ...prev, [field]: e.target.value }))}
                                        />
                                      </div>
                                    )
                                  })}
                                </div>
                                <div className="space-y-2">
                                  <Label>Đáp án đúng</Label>
                                  <Select
                                    value={finalQuestionEditForm.correct_answer}
                                    onValueChange={(value: AnswerOption) => setFinalQuestionEditForm((prev) => ({ ...prev, correct_answer: value }))}
                                  >
                                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      {(["A", "B", "C", "D"] as const).map((option) => (
                                        <SelectItem key={option} value={option}>{option}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </>
                            )}
                            <div className="flex flex-wrap gap-2">
                              <Button size="sm" onClick={() => handleUpdateFinalQuestion(question)} disabled={savingFinalQuestionEdit}>
                                <Save className="mr-2 h-4 w-4" />
                                {savingFinalQuestionEdit ? "Đang lưu..." : "Lưu câu hỏi"}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingFinalQuestionId(null)}>
                                <X className="mr-2 h-4 w-4" />
                                Hủy
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="font-medium text-foreground">Câu {question.order_index}: {question.question_text}</p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {question.question_type === "multiple_choice" ? `Trắc nghiệm • Đáp án đúng: ${question.correct_answer}` : "Tự luận"} • {question.max_score} điểm
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{question.question_type === "multiple_choice" ? "Trắc nghiệm" : "Tự luận"}</Badge>
                              <Button variant="outline" size="sm" onClick={() => startEditFinalQuestion(question)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteFinalQuestion(question)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                )}
              </CardContent>
            </Card>

            <Card id="final-test-grading">
              <CardHeader>
                <CardTitle>Bài tự luận chờ chấm</CardTitle>
                <CardDescription>Nhập điểm phần tự luận; hệ thống tự cộng với điểm trắc nghiệm.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {finalSubmissions.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">Không có bài nào đang chờ chấm.</p>
                ) : (
                  finalSubmissions.map((submission) => (
                    <div key={submission.id} className="rounded-lg border border-border p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-semibold text-foreground">{submission.student_name || submission.student_email || `Học viên #${submission.id}`}</p>
                          <p className="text-sm text-muted-foreground">
                            Lần {submission.attempt_number} • Nộp {new Date(submission.submitted_at).toLocaleString("vi-VN")} • Trắc nghiệm {submission.auto_score}/{submission.max_score}
                          </p>
                        </div>
                        <Badge variant="secondary">Chờ chấm</Badge>
                      </div>

                      <div className="mt-4 space-y-3">
                        {submission.answers
                          .filter((answer) => answer.question_type === "essay")
                          .map((answer) => {
                            const question = submission.questions.find((item) => item.id === answer.question_id)
                            return (
                              <div key={answer.question_id} className="rounded-md bg-muted/40 p-3">
                                <p className="font-medium">{question?.question_text || `Câu hỏi #${answer.question_id}`}</p>
                                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{answer.answer}</p>
                              </div>
                            )
                          })}
                      </div>

                      <div className="mt-4 grid gap-4 lg:grid-cols-[180px_1fr_auto]">
                        <div className="space-y-2">
                          <Label>Điểm tự luận</Label>
                          <Input
                            type="number"
                            min="0"
                            value={manualScores[submission.id] ?? ""}
                            onChange={(e) => setManualScores((prev) => ({ ...prev, [submission.id]: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Feedback</Label>
                          <Input
                            value={feedbacks[submission.id] ?? ""}
                            onChange={(e) => setFeedbacks((prev) => ({ ...prev, [submission.id]: e.target.value }))}
                            placeholder="Nhận xét cho học viên"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button onClick={() => handleGradeSubmission(submission)} disabled={gradingSubmissionId === submission.id}>
                            {gradingSubmissionId === submission.id ? "Đang chấm..." : "Chấm bài"}
                          </Button>
                        </div>
                      </div>
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
