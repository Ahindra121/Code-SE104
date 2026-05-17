"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { apiFetch } from "@/lib/api"
import { getStoredUser } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, CheckCircle2, FileText, PlayCircle } from "lucide-react"

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

type Course = {
  id: number
  title: string
  lessons_count: number
}

type Question = {
  id: number
  lesson_id: number
  content: string
  options: Record<"A" | "B" | "C" | "D", string>
}

type QuizAttempt = {
  id: number
  score: number
  total_questions: number
  correct_count: number
  passed: boolean
}

type ProgressOut = {
  watched_seconds: number
  is_completed: boolean
}

function formatDuration(seconds: number) {
  if (!seconds) return "Chưa cập nhật thời lượng"
  return `${Math.max(1, Math.round(seconds / 60))} phút`
}

export default function LessonPage() {
  const params = useParams<{ id: string; lessonId: string }>()
  const router = useRouter()
  const courseId = Number(params.id)
  const lessonId = Number(params.lessonId)

  const [course, setCourse] = useState<Course | null>(null)
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<number, "A" | "B" | "C" | "D">>({})
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingProgress, setSavingProgress] = useState(false)
  const [submittingQuiz, setSubmittingQuiz] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!getStoredUser()) {
      router.push("/login")
      return
    }

    let alive = true

    async function loadLesson() {
      try {
        setLoading(true)
        setError(null)

        const [courseRes, lessonRes, questionsRes] = await Promise.all([
          apiFetch<Course>(`/courses/${courseId}`),
          apiFetch<Lesson>(`/lessons/${lessonId}`),
          apiFetch<Question[]>(`/questions/lesson/${lessonId}`),
        ])

        if (!alive) return
        setCourse(courseRes.data)
        setLesson(lessonRes.data)
        setQuestions(questionsRes.data)
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

  async function handleCompleteLesson() {
    if (!lesson) return

    try {
      setSavingProgress(true)
      setMessage(null)
      setError(null)

      const watchedSeconds = lesson.duration_seconds > 0 ? lesson.duration_seconds : 1
      const result = await apiFetch<ProgressOut>("/progress", {
        method: "POST",
        body: JSON.stringify({ lesson_id: lesson.id, watched_seconds: watchedSeconds }),
      })

      setMessage(result.data.is_completed ? "Đã ghi nhận hoàn thành bài học." : "Đã cập nhật tiến độ học.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không cập nhật được tiến độ")
    } finally {
      setSavingProgress(false)
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
      setMessage(result.data.passed ? "Bạn đã vượt qua quiz." : "Bạn chưa đạt quiz, hãy ôn lại bài và thử lại.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không nộp được quiz")
    } finally {
      setSubmittingQuiz(false)
    }
  }

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
            <div className="flex aspect-video items-center justify-center bg-muted">
              <div className="text-center">
                <PlayCircle className="mx-auto h-16 w-16 text-primary" />
                <p className="mt-3 font-medium text-foreground">{lesson.video_url ? "Video bài học" : "Nội dung bài học"}</p>
                {lesson.video_url && <p className="mt-1 text-sm text-muted-foreground">{lesson.video_url}</p>}
              </div>
            </div>
            <CardContent className="p-6">
              <h1 className="text-3xl font-bold text-foreground">{lesson.title}</h1>
              <p className="mt-2 text-muted-foreground">{course?.title}</p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground">Thời lượng</p>
                  <p className="mt-1 font-semibold">{formatDuration(lesson.duration_seconds)}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground">Tài liệu</p>
                  <p className="mt-1 font-semibold">{lesson.document_url ? "Có tài liệu" : "Chưa có tài liệu"}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button onClick={handleCompleteLesson} disabled={savingProgress}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {savingProgress ? "Đang lưu..." : "Đánh dấu hoàn thành"}
                </Button>
                {lesson.document_url && (
                  <Button variant="outline" asChild>
                    <a href={lesson.document_url} target="_blank" rel="noreferrer">
                      <FileText className="mr-2 h-4 w-4" />
                      Mở tài liệu
                    </a>
                  </Button>
                )}
              </div>

              {message && <p className="mt-4 text-sm text-green-600">{message}</p>}
              {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
            </CardContent>
          </Card>
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
                            <strong>{option}.</strong> {question.options[option]}
                          </span>
                        </label>
                      ))}
                    </div>
                  ))}

                  <Button className="w-full" onClick={handleSubmitQuiz} disabled={!quizReady || submittingQuiz}>
                    {submittingQuiz ? "Đang nộp..." : "Nộp quiz"}
                  </Button>

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
