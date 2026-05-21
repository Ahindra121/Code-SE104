"use client"

import { useEffect, useState } from "react"
import { AdminShell } from "../_components/admin-shell"
import { apiFetch } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type SystemSetting = {
  key: string
  value: string
  value_type: string
  description?: string | null
}

type SettingsForm = Record<string, string>

const uploadFields = [
  ["max_video_size_mb", "Dung lượng video tối đa (MB)"],
  ["max_document_size_mb", "Dung lượng tài liệu tối đa (MB)"],
  ["max_thumbnail_size_mb", "Dung lượng ảnh khóa học tối đa (MB)"],
  ["max_verification_file_size_mb", "Dung lượng file xác minh tối đa (MB)"],
] as const

const extensionFields = [
  ["allowed_video_extensions", "Định dạng video cho phép"],
  ["allowed_document_extensions", "Định dạng tài liệu cho phép"],
  ["allowed_thumbnail_extensions", "Định dạng ảnh cho phép"],
  ["allowed_verification_extensions", "Định dạng file xác minh cho phép"],
] as const

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingsForm>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    async function loadSettings() {
      try {
        setLoading(true)
        setError(null)
        const result = await apiFetch<SystemSetting[]>("/admin/settings")
        if (!alive) return
        setSettings(Object.fromEntries(result.data.map((item) => [item.key, item.value])))
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : "Không tải được cài đặt hệ thống")
      } finally {
        if (alive) setLoading(false)
      }
    }
    loadSettings()
    return () => {
      alive = false
    }
  }, [])

  async function handleSaveSettings() {
    try {
      setSaving(true)
      setMessage(null)
      setError(null)
      const result = await apiFetch<SystemSetting[]>("/admin/settings", {
        method: "PATCH",
        body: JSON.stringify(settings),
      })
      setSettings(Object.fromEntries(result.data.map((item) => [item.key, item.value])))
      setMessage("Đã lưu thay đổi cài đặt hệ thống.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được cài đặt hệ thống")
    } finally {
      setSaving(false)
    }
  }

  function updateField(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <AdminShell title="Cài đặt hệ thống" activeKey="settings">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground">Cấu hình hệ thống</h2>
        <p className="mt-1 text-muted-foreground">Quản lý giới hạn upload và định dạng file được phép.</p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Đang tải cài đặt...</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Upload</CardTitle>
              <CardDescription>Các giới hạn dung lượng được backend kiểm tra khi người dùng tải file lên.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {uploadFields.map(([key, label]) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key}>{label}</Label>
                  <Input
                    id={key}
                    type="number"
                    min="1"
                    value={settings[key] ?? ""}
                    onChange={(event) => updateField(key, event.target.value)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Định dạng</CardTitle>
              <CardDescription>Nhập danh sách đuôi file, phân tách bằng dấu phẩy.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {extensionFields.map(([key, label]) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key}>{label}</Label>
                  <Input
                    id={key}
                    value={settings[key] ?? ""}
                    onChange={(event) => updateField(key, event.target.value)}
                    placeholder="mp4,webm,mov"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="mt-6 flex flex-col items-end gap-3">
        {message && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>}
        {error && <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}
        <Button onClick={handleSaveSettings} disabled={saving || loading}>{saving ? "Đang lưu..." : "Lưu thay đổi"}</Button>
      </div>
    </AdminShell>
  )
}
