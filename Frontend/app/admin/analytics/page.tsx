"use client"

import { useEffect, useState } from "react"
import { AdminShell } from "../_components/admin-shell"
import { SimpleBarChart, SimpleLineChart } from "../_components/simple-charts"
import { apiFetch } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, DollarSign, TrendingUp, Users } from "lucide-react"

type AdminReport = {
  users: number
  instructors: number
  courses: number
  enrollments: number
  certificates: number
  revenue: number
  pending_courses: number
  pending_deletions: number
  pending_reactivations: number
  category_data: { name: string; value: number }[]
  revenue_data: { month: string; revenue: number; users: number }[]
}

const emptyReport: AdminReport = {
  users: 0,
  instructors: 0,
  courses: 0,
  enrollments: 0,
  certificates: 0,
  revenue: 0,
  pending_courses: 0,
  pending_deletions: 0,
  pending_reactivations: 0,
  category_data: [],
  revenue_data: [{ month: "Hiện tại", revenue: 0, users: 0 }],
}

export default function AdminAnalyticsPage() {
  const [report, setReport] = useState<AdminReport>(emptyReport)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<AdminReport>("/reports/admin")
      .then((result) => setReport(result.data))
      .catch((err) => setError(err instanceof Error ? err.message : "Không tải được phân tích hệ thống"))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AdminShell title="Phân tích hệ thống" activeKey="analytics">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground">Theo dõi dữ liệu vận hành thực tế</h2>
        <p className="mt-1 text-muted-foreground">Các chỉ số được tổng hợp trực tiếp từ người dùng, khóa học và lượt ghi danh trong hệ thống.</p>
      </div>

      {error && <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Doanh thu</p><p className="mt-2 text-2xl font-bold text-foreground">{report.revenue.toLocaleString("vi-VN")}đ</p></div><DollarSign className="h-6 w-6 text-green-600" /></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Người dùng</p><p className="mt-2 text-2xl font-bold text-foreground">{report.users.toLocaleString("vi-VN")}</p></div><Users className="h-6 w-6 text-primary" /></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Khóa học</p><p className="mt-2 text-2xl font-bold text-foreground">{report.courses.toLocaleString("vi-VN")}</p></div><BookOpen className="h-6 w-6 text-amber-600" /></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Cần xử lý</p><p className="mt-2 text-2xl font-bold text-foreground">{report.pending_courses + report.pending_deletions + report.pending_reactivations}</p></div><TrendingUp className="h-6 w-6 text-accent" /></div></CardContent></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Doanh thu và người dùng</CardTitle></CardHeader>
          <CardContent>{loading ? <p className="text-sm text-muted-foreground">Đang tải...</p> : <SimpleLineChart data={report.revenue_data} />}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Khóa học theo danh mục</CardTitle></CardHeader>
          <CardContent>{report.category_data.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có dữ liệu danh mục.</p> : <SimpleBarChart data={report.category_data} />}</CardContent>
        </Card>
      </div>
    </AdminShell>
  )
}
