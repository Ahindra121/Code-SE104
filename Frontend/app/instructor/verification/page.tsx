"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { API_URL, apiFetch } from "@/lib/api"
import { getStoredToken, getStoredUser, redirectPathForRole } from "@/lib/auth"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, ExternalLink, Plus, Save } from "lucide-react"

type VerificationStatus = "pending" | "approved" | "rejected"
type QualificationStatus = "pending" | "approved" | "rejected"

type Qualification = {
  id: number
  major: string
  university_name: string
  graduation_year: number
  status: QualificationStatus
  admin_note?: string | null
}

type Verification = {
  id: number
  full_name: string
  cccd_number: string
  status: VerificationStatus
  admin_note?: string | null
  pending_full_name?: string | null
  pending_cccd_number?: string | null
  pending_cccd_front_url?: string | null
  pending_cccd_back_url?: string | null
  has_pending_changes: boolean
  qualifications: Qualification[]
}

type FormState = {
  full_name: string
  cccd_number: string
  major: string
  university_name: string
  graduation_year: string
  cccd_front_file: File | null
  cccd_back_file: File | null
  degree_file: File | null
}

const emptyForm: FormState = {
  full_name: "",
  cccd_number: "",
  major: "",
  university_name: "",
  graduation_year: "",
  cccd_front_file: null,
  cccd_back_file: null,
  degree_file: null,
}

function statusLabel(status: VerificationStatus | QualificationStatus) {
  if (status === "approved") return "Đã duyệt"
  if (status === "rejected") return "Từ chối"
  return "Chờ duyệt"
}

function statusClass(status: VerificationStatus | QualificationStatus) {
  if (status === "approved") return "bg-green-100 text-green-700 hover:bg-green-100"
  if (status === "rejected") return "bg-red-100 text-red-700 hover:bg-red-100"
  return "bg-amber-100 text-amber-700 hover:bg-amber-100"
}

async function openVerificationFile(verificationId: number, kind: string) {
  const token = getStoredToken()
  const response = await fetch(`${API_URL}/instructor-verifications/${verificationId}/files/${kind}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  if (!response.ok) throw new Error("Không mở được file xác minh")
  window.open(URL.createObjectURL(await response.blob()), "_blank", "noopener,noreferrer")
}

async function openQualificationFile(verificationId: number, qualificationId: number) {
  const token = getStoredToken()
  const response = await fetch(`${API_URL}/instructor-verifications/${verificationId}/qualification-files/${qualificationId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  if (!response.ok) throw new Error("Không mở được file bằng cấp")
  window.open(URL.createObjectURL(await response.blob()), "_blank", "noopener,noreferrer")
}

export default function InstructorVerificationPage() {
  const router = useRouter()
  const [verification, setVerification] = useState<Verification | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

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
    loadVerification()
  }, [router])

  async function loadVerification() {
    try {
      setLoading(true)
      setError(null)
      const result = await apiFetch<Verification | null>("/instructor-verifications/me")
      setVerification(result.data)
      setForm((prev) => ({
        ...prev,
        full_name: result.data?.pending_full_name || result.data?.full_name || "",
        cccd_number: result.data?.pending_cccd_number || result.data?.cccd_number || "",
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được hồ sơ xác minh")
    } finally {
      setLoading(false)
    }
  }

  async function submitVerification() {
    try {
      setSaving(true)
      setError(null)
      setMessage(null)
      const isFirstSubmit = !verification
      if (!form.full_name.trim() || !form.cccd_number.trim()) {
        setError("Vui lòng nhập họ tên và số CCCD.")
        return
      }
      if (isFirstSubmit && (!form.cccd_front_file || !form.cccd_back_file || !form.degree_file)) {
        setError("Hồ sơ đầu tiên cần đủ CCCD mặt trước, CCCD mặt sau và bằng cấp.")
        return
      }
      if (form.degree_file && (!form.major.trim() || !form.university_name.trim() || !form.graduation_year.trim())) {
        setError("Khi thêm bằng cấp, cần nhập chuyên ngành, trường và năm tốt nghiệp.")
        return
      }
      if (isFirstSubmit && (!form.major.trim() || !form.university_name.trim() || !form.graduation_year.trim())) {
        setError("Hồ sơ đầu tiên cần ít nhất một bộ bằng cấp.")
        return
      }

      const formData = new FormData()
      formData.append("full_name", form.full_name.trim())
      formData.append("cccd_number", form.cccd_number.trim())
      if (form.major.trim()) formData.append("major", form.major.trim())
      if (form.university_name.trim()) formData.append("university_name", form.university_name.trim())
      if (form.graduation_year.trim()) formData.append("graduation_year", form.graduation_year.trim())
      if (form.cccd_front_file) formData.append("cccd_front_file", form.cccd_front_file)
      if (form.cccd_back_file) formData.append("cccd_back_file", form.cccd_back_file)
      if (form.degree_file) formData.append("degree_file", form.degree_file)

      const result = await apiFetch<Verification>("/instructor-verifications", {
        method: "POST",
        body: formData,
      })
      setVerification(result.data)
      setForm({
        ...emptyForm,
        full_name: result.data.pending_full_name || result.data.full_name,
        cccd_number: result.data.pending_cccd_number || result.data.cccd_number,
      })
      setMessage("Đã gửi thay đổi cho admin duyệt.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không gửi được hồ sơ xác minh")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Đang tải hồ sơ xác minh...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/95">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Button variant="ghost" asChild>
            <Link href="/instructor">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Link>
          </Button>
          <h1 className="text-lg font-semibold">Xác minh giảng viên</h1>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 p-4 lg:p-8">
        {error && <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}
        {message && <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">{message}</div>}

        {verification && (
          <Card>
            <CardHeader>
              <CardTitle>Thông tin hiện tại</CardTitle>
              <CardDescription>Các thay đổi mới chỉ có hiệu lực sau khi admin duyệt.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={statusClass(verification.status)}>{statusLabel(verification.status)}</Badge>
                {verification.has_pending_changes && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Có chỉnh sửa chờ duyệt</Badge>}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Họ tên Đã duyệt</p>
                  <p className="mt-1 font-medium">{verification.full_name}</p>
                  {verification.pending_full_name && <p className="mt-1 text-sm text-amber-700">Chờ duyệt: {verification.pending_full_name}</p>}
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Số CCCD Đã duyệt</p>
                  <p className="mt-1 font-medium">{verification.cccd_number}</p>
                  {verification.pending_cccd_number && <p className="mt-1 text-sm text-amber-700">Chờ duyệt: {verification.pending_cccd_number}</p>}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => openVerificationFile(verification.id, "cccd-front")}>
                  <ExternalLink className="mr-2 h-4 w-4" /> CCCD trước
                </Button>
                <Button variant="outline" size="sm" onClick={() => openVerificationFile(verification.id, "cccd-back")}>
                  <ExternalLink className="mr-2 h-4 w-4" /> CCCD sau
                </Button>
                {verification.pending_cccd_front_url && (
                  <Button variant="outline" size="sm" onClick={() => openVerificationFile(verification.id, "cccd-front-pending")}>
                    <ExternalLink className="mr-2 h-4 w-4" /> CCCD trước chờ duyệt
                  </Button>
                )}
                {verification.pending_cccd_back_url && (
                  <Button variant="outline" size="sm" onClick={() => openVerificationFile(verification.id, "cccd-back-pending")}>
                    <ExternalLink className="mr-2 h-4 w-4" /> CCCD sau chờ duyệt
                  </Button>
                )}
              </div>
              {verification.admin_note && (
                <Textarea readOnly value={verification.admin_note} className="min-h-20 resize-none text-destructive" />
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Bằng cấp</CardTitle>
            <CardDescription>Mỗi bằng cấp gồm chuyên ngành, trường, năm tốt nghiệp và file bằng/chứng chỉ.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!verification || verification.qualifications.length === 0 ? (
              <p className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">Chưa có bằng cấp nào.</p>
            ) : (
              verification.qualifications.map((item) => (
                <div key={item.id} className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{item.major}</p>
                      <Badge className={statusClass(item.status)}>{statusLabel(item.status)}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{item.university_name}  {item.graduation_year}</p>
                    {item.admin_note && <p className="mt-1 text-sm text-destructive">Lý do: {item.admin_note}</p>}
                  </div>
                  {verification && (
                    <Button variant="outline" size="sm" onClick={() => openQualificationFile(verification.id, item.id)}>
                      <ExternalLink className="mr-2 h-4 w-4" /> Xem bằng cấp
                    </Button>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{verification ? "Gửi chỉnh sửa / thêm bằng cấp" : "Gửi hồ sơ xác minh"}</CardTitle>
            <CardDescription>Mọi thông tin gửi tại đây sẽ chuyển sang chờ admin duyệt.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Họ tên</Label>
              <Input value={form.full_name} onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Số CCCD</Label>
              <Input value={form.cccd_number} onChange={(e) => setForm((prev) => ({ ...prev, cccd_number: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>CCCD mặt trước {verification ? "(nếu muốn đổi)" : ""}</Label>
              <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setForm((prev) => ({ ...prev, cccd_front_file: e.target.files?.[0] ?? null }))} />
            </div>
            <div className="space-y-2">
              <Label>CCCD mặt sau {verification ? "(nếu muốn đổi)" : ""}</Label>
              <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setForm((prev) => ({ ...prev, cccd_back_file: e.target.files?.[0] ?? null }))} />
            </div>
            <div className="space-y-2">
              <Label>Chuyên ngành bằng cấp mới</Label>
              <Input value={form.major} onChange={(e) => setForm((prev) => ({ ...prev, major: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Trường đại học / đơn vị cấp</Label>
              <Input value={form.university_name} onChange={(e) => setForm((prev) => ({ ...prev, university_name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Năm tốt nghiệp</Label>
              <Input type="number" value={form.graduation_year} onChange={(e) => setForm((prev) => ({ ...prev, graduation_year: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>File bằng/chứng chỉ mới</Label>
              <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setForm((prev) => ({ ...prev, degree_file: e.target.files?.[0] ?? null }))} />
            </div>
            <div className="md:col-span-2">
              <Button onClick={submitVerification} disabled={saving} className="gap-2">
                {verification ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {saving ? "Đang gửi..." : "Gửi admin duyệt"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
