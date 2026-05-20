"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { API_BASE_URL, apiFetch } from "@/lib/api"
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

type CourseStatus = "draft" | "pending" | "approved" | "rejected" | "hidden" | "archived"
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
  status: "draft" | "pending"
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

const categories = ["IT", "Business", "Language", "Soft Skills"]
const VIDEO_ACCEPT = ".mp4,.webm,.mov"
const DOCUMENT_ACCEPT = ".pdf,.doc,.docx,.ppt,.pptx"
const MAX_VIDEO_SIZE = 100 * 1024 * 1024
const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024
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

function toForm(course: Course): CourseForm {
  return {
    title: course.title,
    category: course.category,
    description: course.description ?? "",
    price: String(course.price),
    thumbnail_url: course.thumbnail_url ?? "",
    level: course.level,
    status: course.status === "pending" ? "pending" : "draft",
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

function assetUrl(url?: string | null) {
  if (!url) return ""
  if (/^https?:\/\//i.test(url)) return url
  return `${API_BASE_URL}${url}`
}

export default function CourseEditorPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const isNewCourse = params.id === "new"
  const courseId = Number(params.id)

  const [course, setCourse] = useState<Course | null>(null)
  const [courseForm, setCourseForm] = useState<CourseForm>(emptyCourseForm)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [questionsByLesson, setQuestionsByLesson] = useState<Record<number, Question[]>>({})
  const [lessonForm, setLessonForm] = useState<LessonForm>(emptyLessonForm)
  const [lessonVideoFile, setLessonVideoFile] = useState<File | null>(null)
  const [lessonDocumentFile, setLessonDocumentFile] = useState<File | null>(null)
  const [questionForm, setQuestionForm] = useState<QuestionForm>(emptyQuestionForm)
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
  const [savingLesson, setSavingLesson] = useState(false)
  const [savingQuestion, setSavingQuestion] = useState(false)
  const [savingLessonEdit, setSavingLessonEdit] = useState(false)
  const [uploadingLessonAsset, setUploadingLessonAsset] = useState<string | null>(null)
  const [savingQuestionEdit, setSavingQuestionEdit] = useState(false)
  const [savingLessonOrder, setSavingLessonOrder] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const currentCourseId = course?.id ?? (Number.isFinite(courseId) ? courseId : null)

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

    if (isNewCourse) {
      setLoading(false)
      return
    }

    let alive = true

    async function loadCourse() {
      try {
        setLoading(true)
        setError(null)

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
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : "Không tải được khóa học")
      } finally {
        if (alive) setLoading(false)
      }
    }

    loadCourse()
    return () => {
      alive = false
    }
  }, [courseId, isNewCourse, router])

  useEffect(() => {
    if (!isReorderingLessons) {
      setDraftLessons(lessons)
    }
  }, [isReorderingLessons, lessons])

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
        status?: "draft" | "pending"
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
      } else if (!course || course.status === "draft" || course.status === "pending" || course.status === "rejected") {
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
        setMessage("Đã lưu khóa học thành bản nháp. Bạn có thể thêm bài giảng và câu hỏi.")
        router.replace(`/instructor/course/${result.data.id}`)
        return
      }

      const result = await apiFetch<Course>(`/courses/${courseId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      })
      setCourse(result.data)
      setCourseForm(toForm(result.data))
      setMessage("Đã lưu thông tin khóa học.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được khóa học")
    } finally {
      setSavingCourse(false)
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Đang tải trình chỉnh sửa...</p>
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
            <Button size="sm" onClick={handleSaveCourse} disabled={savingCourse}>
              <Save className="mr-2 h-4 w-4" />
              {savingCourse ? "Đang lưu..." : "Lưu khóa học"}
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

        <Tabs defaultValue="info" className="space-y-6">
          <TabsList className="grid w-full max-w-xl grid-cols-3">
            <TabsTrigger value="info">Thông tin</TabsTrigger>
            <TabsTrigger value="lessons" disabled={!currentCourseId}>Bài giảng</TabsTrigger>
            <TabsTrigger value="questions" disabled={!currentCourseId}>Câu hỏi</TabsTrigger>
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
                      <Label>Ảnh đại diện URL</Label>
                      <Input
                        value={courseForm.thumbnail_url}
                        onChange={(e) => setCourseForm((prev) => ({ ...prev, thumbnail_url: e.target.value }))}
                        placeholder="https://..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Trạng thái gửi duyệt</Label>
                      <Select
                        value={isNewCourse ? "draft" : courseForm.status}
                        onValueChange={(value: "draft" | "pending") => setCourseForm((prev) => ({ ...prev, status: value }))}
                        disabled={isNewCourse}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Lưu bản nháp</SelectItem>
                          <SelectItem value="pending">Gửi admin duyệt</SelectItem>
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
                        src={courseForm.thumbnail_url || "/placeholder.jpg"}
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

        </Tabs>
      </main>
    </div>
  )
}
