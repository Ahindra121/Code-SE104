"use client"

import { useEffect, useState } from "react"
import { AdminShell } from "../_components/admin-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    platformName: "LearnHub",
    supportEmail: "support@learnhub.vn",
    maxUpload: "500MB",
    maintenanceMode: false,
    autoApproveInstructors: false,
    emailNotifications: true,
    weeklyReports: true,
  })
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem("learnhub-admin-settings")
    if (stored) {
      setSettings((prev) => ({ ...prev, ...JSON.parse(stored) }))
    }
  }, [])

  function handleSaveSettings() {
    localStorage.setItem("learnhub-admin-settings", JSON.stringify(settings))
    setSavedMessage("Đã lưu thay đổi cài đặt quản trị.")
  }

  return (
    <AdminShell title="Cài đặt quản trị" activeKey="settings">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground">Điều chỉnh cấu hình vận hành</h2>
        <p className="mt-1 text-muted-foreground">Quản lý thông tin nền tảng và các tùy chọn thông báo dành cho quản trị viên.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin nền tảng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="platformName">Tên nền tảng</Label>
              <Input
                id="platformName"
                value={settings.platformName}
                onChange={(event) => setSettings((prev) => ({ ...prev, platformName: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supportEmail">Email hỗ trợ</Label>
              <Input
                id="supportEmail"
                type="email"
                value={settings.supportEmail}
                onChange={(event) => setSettings((prev) => ({ ...prev, supportEmail: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxUpload">Dung lượng tải lên tối đa</Label>
              <Input
                id="maxUpload"
                value={settings.maxUpload}
                onChange={(event) => setSettings((prev) => ({ ...prev, maxUpload: event.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tùy chọn hệ thống</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Chế độ bảo trì</p>
                <p className="text-sm text-muted-foreground">Tạm khóa truy cập công khai để bảo trì hệ thống</p>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, maintenanceMode: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Tự động duyệt giảng viên</p>
                <p className="text-sm text-muted-foreground">Bỏ qua bước duyệt thủ công khi giảng viên đăng ký</p>
              </div>
              <Switch
                checked={settings.autoApproveInstructors}
                onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, autoApproveInstructors: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Thông báo email</p>
                <p className="text-sm text-muted-foreground">Nhận email khi có khóa học hoặc báo cáo cần xử lý</p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, emailNotifications: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Báo cáo hàng tuần</p>
                <p className="text-sm text-muted-foreground">Gửi tổng hợp tăng trưởng hệ thống mỗi tuần</p>
              </div>
              <Switch
                checked={settings.weeklyReports}
                onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, weeklyReports: checked }))}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex flex-col items-end gap-3">
        {savedMessage && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{savedMessage}</div>}
        <Button onClick={handleSaveSettings}>Lưu thay đổi</Button>
      </div>
    </AdminShell>
  )
}
