"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { apiFetch } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Award, BarChart3, BookOpen, DollarSign, GraduationCap, Star, Users } from "lucide-react"

type CourseReport = {
  course_id: number
  title: string
  category: string
  students: number
  revenue: number
  rating: number
  completion_rate: number
  average_quiz_score: number
}

export default function AnalyticsPage() {
  const [courses, setCourses] = useState<CourseReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<CourseReport[]>("/reports/instructor")
      .then((result) => setCourses(result.data))
      .catch((err) => setError(err instanceof Error ? err.message : "Không tải được phân tích giảng viên"))
      .finally(() => setLoading(false))
  }, [])

  const summary = useMemo(() => {
    const revenue = courses.reduce((sum, course) => sum + course.revenue, 0)
    const students = courses.reduce((sum, course) => sum + course.students, 0)
    const rating = courses.length === 0 ? 0 : courses.reduce((sum, course) => sum + course.rating, 0) / courses.length
    const completion = courses.length === 0 ? 0 : courses.reduce((sum, course) => sum + course.completion_rate, 0) / courses.length
    return { revenue, students, rating, completion }
  }, [courses])

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/instructor" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">LearnHub</span>
          </Link>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            Xuất báo cáo
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Phân tích & Thống kê</h1>
          <p className="mt-1 text-muted-foreground">Dữ liệu được tổng hợp từ các khóa học và lượt học thực tế của bạn.</p>
        </div>

        {error && <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}

        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Tổng doanh thu</p><p className="text-2xl font-bold text-foreground">{summary.revenue.toLocaleString("vi-VN")}đ</p></div><DollarSign className="h-6 w-6 text-green-600" /></div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Tổng học viên</p><p className="text-2xl font-bold text-foreground">{summary.students.toLocaleString("vi-VN")}</p></div><Users className="h-6 w-6 text-blue-600" /></div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Đánh giá TB</p><p className="text-2xl font-bold text-foreground">{summary.rating.toFixed(1)}</p></div><Star className="h-6 w-6 text-yellow-600" /></div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Hoàn thành TB</p><p className="text-2xl font-bold text-foreground">{Math.round(summary.completion)}%</p></div><Award className="h-6 w-6 text-purple-600" /></div></CardContent></Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Hiệu suất khóa học</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">Đang tải thống kê...</p>
            ) : courses.length === 0 ? (
              <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">Chưa có dữ liệu thống kê cho khóa học.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Khóa học</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Học viên</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Doanh thu</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Đánh giá</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Hoàn thành</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((course) => (
                      <tr key={course.course_id} className="border-b border-border last:border-0 hover:bg-muted/50">
                        <td className="px-4 py-3"><div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /><span className="font-medium text-foreground">{course.title}</span><Badge variant="outline">{course.category}</Badge></div></td>
                        <td className="px-4 py-3 text-right text-foreground">{course.students.toLocaleString("vi-VN")}</td>
                        <td className="px-4 py-3 text-right text-foreground">{course.revenue.toLocaleString("vi-VN")}đ</td>
                        <td className="px-4 py-3 text-right text-foreground">{course.rating.toFixed(1)}</td>
                        <td className="px-4 py-3 text-right"><Badge variant={course.completion_rate >= 75 ? "default" : "secondary"}>{Math.round(course.completion_rate)}%</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
