"use client"

import { AdminShell } from "../_components/admin-shell"
import { moderationReports, reportCards } from "../_data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileText, ShieldAlert } from "lucide-react"

export default function AdminReportsPage() {
  return (
    <AdminShell
      title="Báo cáo hệ thống"
      activeKey="reports"
      topRight={
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Xuất tổng hợp
        </Button>
      }
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground">Tổng hợp báo cáo vận hành và kiểm duyệt</h2>
        <p className="mt-1 text-muted-foreground">Truy cập nhanh các báo cáo quan trọng và danh sách mục cần xử lý.</p>
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-3">
        {reportCards.map((report) => (
          <Card key={report.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5 text-primary" />
                {report.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{report.description}</p>
              <p className="mt-3 text-xs text-muted-foreground">{report.updated}</p>
              <Button variant="outline" className="mt-4 w-full">
                Xem báo cáo
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-warning" />
            Danh sách báo cáo cần xử lý
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {moderationReports.map((report) => (
              <div key={report.id} className="flex flex-col gap-3 rounded-xl border border-border p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium text-foreground">{report.title}</p>
                  <p className="text-sm text-muted-foreground">{report.target}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{report.status}</span>
                  <Button variant="outline" size="sm">
                    Mở chi tiết
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </AdminShell>
  )
}
