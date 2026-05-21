"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { apiFetch } from "@/lib/api"
import { getStoredUser } from "@/lib/auth"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, CheckCircle2, ClipboardCheck } from "lucide-react"

type QuestionType = "multiple_choice" | "essay"
type SubmissionStatus = "submitted" | "pending_grading" | "graded" | "passed" | "failed"

type FinalTestQuestion = {
  id: number
  question_text: string
  question_type: QuestionType
  options?: Record<string, string> | null
  max_score: number
  order_index: number
}

type FinalTest = {
  id: number
  course_id: number
  title: string
  description?: string | null
  passing_score_percent: number
  questions: FinalTestQuestion[]
}

type Submission = {
  id: number
  attempt_number: number
  score_percent?: number | null
  status: SubmissionStatus
  instructor_feedback?: string | null
  submitted_at: string
  graded_at?: string | null
}

function statusLabel(status: SubmissionStatus) {
  if (status === "pending_grading") return "Chờ chấm"
  if (status === "passed") return "Đạt"
  if (status === "failed") return "Không đạt"
  if (status === "graded") return "Đã chấm"
  return "Đã nộp"
}

export default function FinalTestPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const courseId = Number(params.id)

  const [test, setTest] = useState<FinalTest | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const user = getStoredUser()
    if (!user) {
      router.push("/login")
      return
    }
    if (user.role !== "student") {
      router.push(`/course/${courseId}`)
      return
    }

    let alive = true
    async function loadFinalTest() {
      try {
        setLoading(true)
        setError(null)
        const [testRes, submissionsRes] = await Promise.all([
          apiFetch<FinalTest>(`/courses/${courseId}/final-test`),
          apiFetch<Submission[]>(`/courses/${courseId}/final-test/submissions/me`),
        ])
        if (!alive) return
        setTest(testRes.data)
        setSubmissions(submissionsRes.data)
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : "Không tải được Final Test")
      } finally {
        if (alive) setLoading(false)
      }
    }

    if (Number.isFinite(courseId)) void loadFinalTest()
    return () => {
      alive = false
    }
  }, [courseId, router])

  const answeredCount = useMemo(() => {
    if (!test) return 0
    return test.questions.filter((question) => answers[question.id]?.trim()).length
  }, [answers, test])
  const allAnswered = Boolean(test?.questions.length && answeredCount === test.questions.length)
  const hasPassed = submissions.some((submission) => submission.status === "passed")

  async function handleSubmit() {
    if (!test || !allAnswered) return
    try {
      setSubmitting(true)
      setMessage(null)
      setError(null)
      const result = await apiFetch<Submission>(`/courses/${courseId}/final-test/submit`, {
        method: "POST",
        body: JSON.stringify({
          answers: test.questions.map((question) => ({
            question_id: question.id,
            answer: answers[question.id],
          })),
        }),
      })
      setSubmissions((prev) => [result.data, ...prev])
      setAnswers({})
      setMessage(
        result.data.status === "pending_grading"
          ? "Bài làm đã được gửi. Vui lòng chờ giảng viên chấm."
          : `Bạn đạt ${result.data.score_percent ?? 0}%. ${result.data.status === "passed" ? "Khóa học đã hoàn thành." : "Bạn có thể làm lại."}`
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không nộp được Final Test")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Đang tải Final Test...</p>
      </div>
    )
  }

  if (error && !test) {
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

  if (!test) return null

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
          <Badge variant={hasPassed ? "default" : "secondary"} className={hasPassed ? "bg-green-600" : ""}>
            {hasPassed ? "Khóa học đã hoàn thành" : `Cần đạt ${test.passing_score_percent}%`}
          </Badge>
        </div>
      </header>

      <main className="container mx-auto grid gap-6 px-4 py-8 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-primary" />
                {test.title}
              </CardTitle>
              {test.description && <p className="text-sm text-muted-foreground">{test.description}</p>}
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-muted-foreground">Đã trả lời</span>
                  <span className="font-medium">
                    {answeredCount}/{test.questions.length}
                  </span>
                </div>
                <Progress value={(answeredCount / Math.max(test.questions.length, 1)) * 100} className="h-2" />
              </div>

              {test.questions.map((question, index) => (
                <div key={question.id} className="rounded-lg border border-border p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <p className="font-medium">
                      Câu {index + 1}: {question.question_text}
                    </p>
                    <Badge variant="outline">{question.max_score} điểm</Badge>
                  </div>
                  {question.question_type === "multiple_choice" ? (
                    <div className="space-y-2">
                      {Object.entries(question.options ?? {}).map(([key, value]) => (
                        <label key={key} className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 hover:bg-muted">
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            value={key}
                            checked={answers[question.id] === key}
                            onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: key }))}
                            className="mt-1"
                          />
                          <span>
                            <strong>{key}.</strong> {value}
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <Textarea
                      value={answers[question.id] ?? ""}
                      onChange={(event) => setAnswers((prev) => ({ ...prev, [question.id]: event.target.value }))}
                      rows={6}
                      placeholder="Nhập câu trả lời tự luận..."
                    />
                  )}
                </div>
              ))}

              {message && <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</p>}
              {error && <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}

              <Button className="w-full" size="lg" onClick={handleSubmit} disabled={!allAnswered || submitting}>
                {submitting ? "Đang nộp..." : "Nộp Final Test"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <aside>
          <Card>
            <CardHeader>
              <CardTitle>Lịch sử làm bài</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {submissions.length === 0 ? (
                <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Chưa có lần làm nào.</p>
              ) : (
                submissions.map((submission) => (
                  <div key={submission.id} className="rounded-lg border border-border p-4 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium">Lần {submission.attempt_number}</span>
                      <Badge variant={submission.status === "passed" ? "default" : "secondary"} className={submission.status === "passed" ? "bg-green-600" : ""}>
                        {submission.status === "passed" && <CheckCircle2 className="mr-1 h-3.5 w-3.5" />}
                        {statusLabel(submission.status)}
                      </Badge>
                    </div>
                    <p className="mt-2 text-muted-foreground">Nộp: {new Date(submission.submitted_at).toLocaleString("vi-VN")}</p>
                    <p className="mt-1 text-muted-foreground">Điểm: {submission.score_percent != null ? `${submission.score_percent}%` : "Chờ chấm"}</p>
                    {submission.instructor_feedback && <p className="mt-2 rounded-md bg-muted/50 p-2">{submission.instructor_feedback}</p>}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  )
}
