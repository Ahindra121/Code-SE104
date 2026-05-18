"use client"

import { useEffect, useState } from "react"
import { AdminShell } from "../_components/admin-shell"
import { apiFetch } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, FileText, ShieldAlert, UserRound } from "lucide-react"

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
}

type DeletionRequest = {
  id: number
  reason: string
  student_count: number
  created_at: string
  course: { id: number; title: string; category: string }
  instructor?: { username: string; full_name?: string | null } | null
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
}

export default function AdminReportsPage() {
  const [report, setReport] = useState<AdminReport>(emptyReport)
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionId, setActionId] = useState<number | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function loadData() {
    try {
      setLoading(true)
      setError(null)
      const [reportResult, deletionResult] = await Promise.all([
        apiFetch<AdminReport>("/reports/admin"),
        apiFetch<DeletionRequest[]>("/courses/deletion-requests/pending"),
      ])
      setReport(reportResult.data)
      setDeletionRequests(deletionResult.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được báo cáo hệ thống")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function reviewDeletion(id: number, action: "approve" | "reject") {
    const response = window.prompt(action === "approve" ? "Ghi chú cho giảng viên/học viên:" : "Nhập lý do từ chối yêu cầu:", "")
    if (action === "reject" && !response?.trim()) return
    try {
      setActionId(id)
      setMessage(null)
      await apiFetch(`/courses/deletion-requests/${id}/${action}`, {
        method: "PATCH",
        body: JSON.stringify({ response: response?.trim() || null }),
      })
      setDeletionRequests((prev) => prev.filter((item) => item.id !== id))
      setMessage(action === "approve" ? "Đã duyệt yêu cầu lưu trữ/xóa khóa học." : "Đã từ chối yêu cầu lưu trữ/xóa khóa học.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không xử lý được yêu cầu")
    } finally {
      setActionId(null)
    }
  }

  const reportCards = [
    { title: "Doanh thu", value: `${report.revenue.toLocaleString("vi-VN")}đ`, description: "Tổng doanh thu ước tính từ các lượt ghi danh", icon: FileText },
    { title: "Người dùng", value: report.users.toLocaleString("vi-VN"), description: `${report.instructors.toLocaleString("vi-VN")} giảng viên trong hệ thống`, icon: UserRound },
    { title: "Nội dung cần duyệt", value: (report.pending_courses + report.pending_deletions).toString(), description: `${report.pending_courses} khóa học, ${report.pending_deletions} yêu cầu xóa/lưu trữ`, icon: BookOpen },
  ]

  return (
    <AdminShell title="Báo cáo hệ thống" activeKey="reports">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground">Tổng hợp vận hành từ dữ liệu thật</h2>
        <p className="mt-1 text-muted-foreground">Theo dõi các chỉ số chính và những yêu cầu cần admin xử lý.</p>
      </div>

      {error && <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}
      {message && <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">{message}</div>}

      <div className="mb-8 grid gap-4 lg:grid-cols-3">
        {reportCards.map((item) => (
          <Card key={item.title}>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><item.icon className="h-5 w-5 text-primary" />{item.title}</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-foreground">{item.value}</p><p className="mt-2 text-sm text-muted-foreground">{item.description}</p></CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-amber-600" />Yêu cầu xóa/lưu trữ khóa học chờ duyệt</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">Đang tải báo cáo...</p>
          ) : deletionRequests.length === 0 ? (
            <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">Không có yêu cầu nào cần xử lý.</p>
          ) : (
            <div className="space-y-4">
              {deletionRequests.map((request) => (
                <div key={request.id} className="flex flex-col gap-3 rounded-lg border border-border p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium text-foreground">{request.course.title}</p>
                    <p className="text-sm text-muted-foreground">{request.instructor?.full_name || request.instructor?.username || "Giảng viên"} · {request.student_count} học viên đang bị ảnh hưởng</p>
                    <p className="mt-2 text-sm text-foreground">Lý do: {request.reason}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" disabled={actionId === request.id} onClick={() => reviewDeletion(request.id, "reject")}>Từ chối</Button>
                    <Button size="sm" disabled={actionId === request.id} onClick={() => reviewDeletion(request.id, "approve")}>Duyệt</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AdminShell>
  )
}
