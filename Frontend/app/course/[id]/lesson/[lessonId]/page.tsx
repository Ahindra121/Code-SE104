"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { API_BASE_URL, apiFetch } from "@/lib/api"
import { getStoredToken, getStoredUser } from "@/lib/auth"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, CheckCircle2, Download, FileText, PlayCircle } from "lucide-react"

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
}

type Course = {
  id: number
  title: string
  lessons_count: number
}

type Question = {
  id: number
  lesson_id: number
  content: string
  options?: Record<"A" | "B" | "C" | "D", string>
  option_a?: string
  option_b?: string
  option_c?: string
  option_d?: string
}

type QuizAttempt = {
  id: number
  score: number
  total_questions: number
  correct_count: number
  passed: boolean
}

type ProgressOut = {
  progress_percent: number
  watched_seconds: number
  max_watched_seconds: number
  duration_seconds: number
  document_viewed: boolean
  is_completed: boolean
  completed_at?: string | null
}

function assetUrl(url?: string | null) {
  if (!url) return ""
  if (/^https?:\/\//i.test(url)) return url
  return `${API_BASE_URL}${url}`
}

function isPdf(url?: string | null) {
  return Boolean(url?.toLowerCase().split("?")[0].endsWith(".pdf"))
}

export default function LessonPage() {
  const params = useParams<{ id: string; lessonId: string }>()
  const router = useRouter()
  const courseId = Number(params.id)
  const lessonId = Number(params.lessonId)

  const [course, setCourse] = useState<Course | null>(null)
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [viewerRole, setViewerRole] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<number, "A" | "B" | "C" | "D">>({})
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null)
  const [lessonProgress, setLessonProgress] = useState<ProgressOut | null>(null)
  const [loading, setLoading] = useState(true)
  const [submittingQuiz, setSubmittingQuiz] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const maxWatchedRef = useRef(0)
  const restoredVideoRef = useRef(false)
  const correctingSeekRef = useRef(false)
  const seekingRef = useRef(false)
  const lastSentPercentRef = useRef(0)
  const lastSentAtRef = useRef(0)

  useEffect(() => {
    const user = getStoredUser()
    if (!user) {
      router.push("/login")
      return
    }
    setViewerRole(user.role)

    let alive = true

    async function loadLesson() {
      try {
        setLoading(true)
        setError(null)
        restoredVideoRef.current = false
        maxWatchedRef.current = 0

        const [courseRes, lessonRes] = await Promise.all([
          apiFetch<Course>(`/courses/${courseId}`),
          apiFetch<Lesson>(`/lessons/${lessonId}`),
        ])

        if (!alive) return
        setCourse(courseRes.data)
        setLesson(lessonRes.data)

        const [questionsRes, progressRes] = await Promise.allSettled([
          apiFetch<Question[]>(`/questions/lesson/${lessonId}`),
          user.role === "student" ? apiFetch<ProgressOut>(`/lessons/${lessonId}/progress`) : Promise.resolve(null),
        ])

        if (!alive) return
        if (questionsRes.status === "fulfilled") {
          setQuestions(
            questionsRes.value.data.map((question) => ({
              ...question,
              options: question.options ?? {
                A: question.option_a ?? "",
                B: question.option_b ?? "",
                C: question.option_c ?? "",
                D: question.option_d ?? "",
              },
            }))
          )
        } else {
          setQuestions([])
          setError(questionsRes.reason instanceof Error ? questionsRes.reason.message : "Không tải được quiz bài học")
        }

        if (progressRes.status === "fulfilled" && progressRes.value) {
          setLessonProgress(progressRes.value.data)
          maxWatchedRef.current = Math.max(progressRes.value.data.max_watched_seconds ?? 0, progressRes.value.data.watched_seconds ?? 0)
          lastSentPercentRef.current = progressRes.value.data.progress_percent ?? 0
        } else if (progressRes.status === "rejected") {
          setError(progressRes.reason instanceof Error ? progressRes.reason.message : "Không tải được tiến độ bài học")
        }
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : "Không tải được bài học")
      } finally {
        if (alive) setLoading(false)
      }
    }

    if (Number.isFinite(courseId) && Number.isFinite(lessonId)) {
      loadLesson()
    } else {
      setError("Mã bài học không hợp lệ")
      setLoading(false)
    }

    return () => {
      alive = false
    }
  }, [courseId, lessonId, router])

  async function saveVideoProgress(currentTime: number, duration: number, force = false) {
    if (!lesson || viewerRole !== "student" || !duration) return
    const safeCurrentTime =
      currentTime > maxWatchedRef.current + 1 && maxWatchedRef.current > 0
        ? maxWatchedRef.current
        : currentTime
    const maxWatchedSeconds = Math.min(duration, Math.max(maxWatchedRef.current, safeCurrentTime))
    const progressPercent = Math.min(100, Math.round((maxWatchedSeconds / duration) * 100))
    const now = Date.now()
    const percentStepReached = progressPercent >= lastSentPercentRef.current + 10
    const timeStepReached = now - lastSentAtRef.current >= 15000

    if (!force && !percentStepReached && !timeStepReached) return
    if (!force && progressPercent <= (lessonProgress?.progress_percent ?? 0)) return

    try {
      const result = await apiFetch<ProgressOut>(`/lessons/${lesson.id}/progress`, {
        method: "POST",
        body: JSON.stringify({
          watched_seconds: Math.floor(safeCurrentTime),
          max_watched_seconds: Math.floor(maxWatchedSeconds),
          duration_seconds: Math.floor(duration),
          progress_percent: progressPercent,
        }),
      })
      setLessonProgress(result.data)
      maxWatchedRef.current = result.data.max_watched_seconds ?? maxWatchedSeconds
      lastSentPercentRef.current = result.data.progress_percent ?? progressPercent
      lastSentAtRef.current = now
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không ghi nhận được tiến độ học tập")
    }
  }

  function handleVideoLoaded(event: React.SyntheticEvent<HTMLVideoElement>) {
    const video = event.currentTarget
    videoRef.current = video
    maxWatchedRef.current = Math.max(maxWatchedRef.current, lessonProgress?.max_watched_seconds ?? 0, lessonProgress?.watched_seconds ?? 0)
    if (!restoredVideoRef.current && lessonProgress?.watched_seconds && lessonProgress.watched_seconds < video.duration) {
      restoredVideoRef.current = true
      video.currentTime = lessonProgress.watched_seconds
    }
  }

  function handleVideoTimeUpdate(event: React.SyntheticEvent<HTMLVideoElement>) {
    const video = event.currentTarget
    if (video.seeking || seekingRef.current || correctingSeekRef.current) {
      return
    }

    if (video.currentTime > maxWatchedRef.current + 1 && maxWatchedRef.current > 0) {
      video.currentTime = maxWatchedRef.current
      return
    }

    if (!correctingSeekRef.current) {
      maxWatchedRef.current = Math.max(maxWatchedRef.current, video.currentTime)
    }
    void saveVideoProgress(video.currentTime, video.duration)
  }

  function handleVideoSeeking(event: React.SyntheticEvent<HTMLVideoElement>) {
    const video = event.currentTarget
    seekingRef.current = true
    const allowedTime = maxWatchedRef.current
    if (video.currentTime > allowedTime) {
      correctingSeekRef.current = true
      video.currentTime = maxWatchedRef.current
    }
  }

  function handleVideoSeeked() {
    seekingRef.current = false
    correctingSeekRef.current = false
  }

  function handleVideoPause(event: React.SyntheticEvent<HTMLVideoElement>) {
    const video = event.currentTarget
    void saveVideoProgress(video.currentTime, video.duration, true)
  }

  function handleVideoEnded(event: React.SyntheticEvent<HTMLVideoElement>) {
    const video = event.currentTarget
    maxWatchedRef.current = video.duration
    void saveVideoProgress(video.duration, video.duration, true)
  }

  function handleViewContent() {
    if (!lesson?.document_url) return
    window.open(assetUrl(lesson.document_url), "_blank", "noopener,noreferrer")
  }

  async function handleDownloadDocument() {
    if (!lesson?.document_url) return

    try {
      setError(null)
      const token = getStoredToken()
      const response = await fetch(`${API_BASE_URL}/api/lessons/${lesson.id}/download-document`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!response.ok) throw new Error("Không tải được tài liệu")

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = lesson.document_name || "lesson-document"
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được tài liệu")
    }
  }

  async function handleSubmitQuiz() {
    if (questions.length === 0) return

    try {
      setSubmittingQuiz(true)
      setMessage(null)
      setError(null)

      const result = await apiFetch<QuizAttempt>("/quizzes/submit", {
        method: "POST",
        body: JSON.stringify({
          lesson_id: lessonId,
          answers: questions
            .filter((question) => answers[question.id])
            .map((question) => ({
              question_id: question.id,
              selected_option: answers[question.id],
            })),
        }),
      })

      setAttempt(result.data)
      if (canStudy) {
        const progressResult = await apiFetch<ProgressOut>(`/lessons/${lessonId}/progress`)
        setLessonProgress(progressResult.data)
      }
      setMessage(
        result.data.passed
          ? "Bạn đã đạt quiz. Nếu bài có video, hệ thống sẽ hoàn thành khi bạn xem đủ 90% video."
          : "Bạn chưa đạt quiz. Bài có quiz cần đúng từ 80% trở lên."
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không nộp được quiz")
    } finally {
      setSubmittingQuiz(false)
    }
  }

  async function handleMarkDocumentComplete() {
    if (!lesson || viewerRole !== "student") return

    try {
      setMessage(null)
      setError(null)
      const result = await apiFetch<ProgressOut>(`/lessons/${lesson.id}/complete`, { method: "POST" })
      setLessonProgress(result.data)
      setMessage(
        result.data.is_completed
          ? "Đã ghi nhận hoàn thành bài học."
          : "Đã ghi nhận xem tài liệu. Nếu bài có quiz, bạn cần đạt từ 80% trở lên để hoàn thành."
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể đánh dấu hoàn thành")
    }
  }

  useEffect(() => {
    function handleBeforeUnload() {
      const video = videoRef.current
      if (video && Number.isFinite(video.duration)) {
        void saveVideoProgress(video.currentTime, video.duration, true)
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  })

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Đang tải bài học...</p>
      </div>
    )
  }

  if (error && !lesson) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="text-center">
          <p className="font-medium text-destructive">{error}</p>
          <Button className="mt-4" asChild>
            <Link href={`/course/${courseId}`}>Quay lại khóa học</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!lesson) return null

  const answeredCount = Object.keys(answers).length
  const quizReady = questions.length > 0 && answeredCount === questions.length
  const canStudy = viewerRole === "student"
  const hasLearningContent = Boolean(lesson.video_url || lesson.document_url)
  const videoSrc = assetUrl(lesson.video_url)
  const documentSrc = assetUrl(lesson.document_url)
  const canPreviewDocument = isPdf(lesson.document_url)
  const progressPercent = Math.round(lessonProgress?.progress_percent ?? 0)
  const isCompleted = Boolean(lessonProgress?.is_completed)
  const statusLabel = isCompleted ? "Hoàn thành" : progressPercent > 0 ? "Đang học" : "Chưa bắt đầu"

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Button variant="ghost" asChild>
            <Link href={`/course/${courseId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại khóa học
            </Link>
          </Button>
          <span className="text-sm text-muted-foreground">Bài {lesson.order_index}</span>
        </div>
      </header>

      <main className="container mx-auto grid gap-8 px-4 py-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card>
            {videoSrc ? (
              <video
                controls
                ref={videoRef}
                className="aspect-video w-full rounded-t-lg bg-black"
                onLoadedMetadata={handleVideoLoaded}
                onTimeUpdate={handleVideoTimeUpdate}
                onSeeking={handleVideoSeeking}
                onSeeked={handleVideoSeeked}
                onPause={handleVideoPause}
                onEnded={handleVideoEnded}
              >
                <source src={videoSrc} type="video/mp4" />
              </video>
            ) : (
              <div className="flex aspect-video items-center justify-center bg-muted">
                <div className="text-center">
                  <PlayCircle className="mx-auto h-16 w-16 text-primary" />
                  <p className="mt-3 font-medium text-foreground">Nội dung bài học</p>
                </div>
              </div>
            )}
            <CardContent className="p-6">
              <h1 className="text-3xl font-bold text-foreground">{lesson.title}</h1>
              <p className="mt-2 text-muted-foreground">{course?.title}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Badge variant={isCompleted ? "default" : "secondary"} className={isCompleted ? "bg-green-600" : ""}>
                  {isCompleted && <CheckCircle2 className="mr-1 h-3.5 w-3.5" />}
                  {statusLabel}
                </Badge>
                <span className="text-sm text-muted-foreground">Tiến độ: {progressPercent}%</span>
              </div>

              <div className="mt-5 grid gap-3">
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground">Tài liệu</p>
                  <p className="mt-1 font-semibold">{lesson.document_url ? "Có tài liệu" : "Chưa có tài liệu"}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                {lesson.document_url && (
                  canStudy ? (
                    <Button variant="outline" onClick={handleViewContent}>
                      <FileText className="mr-2 h-4 w-4" />
                      Xem tài liệu
                    </Button>
                  ) : (
                    <Button variant="outline" asChild>
                      <a href={documentSrc} target="_blank" rel="noreferrer">
                        <FileText className="mr-2 h-4 w-4" />
                        Xem tài liệu
                      </a>
                    </Button>
                  )
                )}
                {documentSrc && (
                  <Button variant="outline" onClick={handleDownloadDocument}>
                    <Download className="mr-2 h-4 w-4" />
                    Tải tài liệu
                  </Button>
                )}
                {!videoSrc && documentSrc && canStudy && !isCompleted && (
                  <Button onClick={handleMarkDocumentComplete}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Đánh dấu đã hoàn thành
                  </Button>
                )}
                {!hasLearningContent && (
                  <p className="text-sm text-muted-foreground">
                    Bài học này không có video hoặc tài liệu; hệ thống sẽ hoàn thành bài khi quiz đạt từ 80%.
                  </p>
                )}
              </div>

              {message && <p className="mt-4 text-sm text-green-600">{message}</p>}
              {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
            </CardContent>
          </Card>

          {documentSrc && (
            <Card>
              <CardHeader>
                <CardTitle>Tài liệu bài học</CardTitle>
              </CardHeader>
              <CardContent>
                {canPreviewDocument ? (
                  <iframe src={documentSrc} className="h-[700px] w-full rounded-lg border" title="Tài liệu bài học" />
                ) : (
                  <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                    Tài liệu này không hỗ trợ xem trực tiếp. Vui lòng dùng nút tải tài liệu để tải về máy.
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quiz bài học</CardTitle>
            </CardHeader>
            <CardContent>
              {questions.length === 0 ? (
                <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Bài học này chưa có quiz.
                </p>
              ) : (
                <div className="space-y-5">
                  <div>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-muted-foreground">Đã trả lời</span>
                      <span className="font-medium">
                        {answeredCount}/{questions.length}
                      </span>
                    </div>
                    <Progress value={(answeredCount / questions.length) * 100} className="h-2" />
                  </div>

                  {questions.map((question, index) => (
                    <div key={question.id} className="space-y-3 rounded-lg border border-border p-4">
                      <p className="font-medium">
                        Câu {index + 1}: {question.content}
                      </p>
                      {(["A", "B", "C", "D"] as const).map((option) => (
                        <label
                          key={option}
                          className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 hover:bg-muted"
                        >
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            value={option}
                            checked={answers[question.id] === option}
                            onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: option }))}
                            className="mt-1"
                          />
                          <span>
                            <strong>{option}.</strong> {question.options?.[option]}
                          </span>
                        </label>
                      ))}
                    </div>
                  ))}

                  {canStudy && <Button className="w-full" onClick={handleSubmitQuiz} disabled={!quizReady || submittingQuiz}>
                    {submittingQuiz ? "Đang nộp..." : "Nộp quiz"}
                  </Button>}

                  {attempt && (
                    <div className="rounded-lg bg-muted/50 p-4 text-sm">
                      <p className="font-semibold text-foreground">Kết quả: {attempt.score}/10</p>
                      <p className="text-muted-foreground">
                        Đúng {attempt.correct_count}/{attempt.total_questions} câu.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  )
}
