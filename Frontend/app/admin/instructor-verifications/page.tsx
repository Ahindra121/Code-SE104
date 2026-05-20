"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminShell } from "../_components/admin-shell"
import { API_URL, apiFetch } from "@/lib/api"
import { getStoredToken, getStoredUser, redirectPathForRole } from "@/lib/auth"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Check, ExternalLink, XCircle } from "lucide-react"

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
  user_id: number
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
  user?: { username: string; email: string } | null
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

async function openVerificationFile(id: number, kind: string) {
  const token = getStoredToken()
  const response = await fetch(`${API_URL}/instructor-verifications/${id}/files/${kind}`, {
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

export default function AdminInstructorVerificationsPage() {
  const router = useRouter()
  const [items, setItems] = useState<Verification[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<number | null>(null)
  const [rejectNotes, setRejectNotes] = useState<Record<number, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const user = getStoredUser()
    if (!user) {
      router.push("/login")
      return
    }
    if (user.role !== "admin") {
      router.push(redirectPathForRole(user.role))
      return
    }
    loadItems()
  }, [router])

  async function loadItems() {
    try {
      setLoading(true)
      setError(null)
      const result = await apiFetch<Verification[]>("/admin/instructor-verifications?status=pending")
      setItems(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được hồ sơ xác minh")
    } finally {
      setLoading(false)
    }
  }

  async function approve(id: number) {
    try {
      setActionId(id)
      setError(null)
      await apiFetch<Verification>(`/admin/instructor-verifications/${id}/approve`, { method: "PATCH" })
      setItems((prev) => prev.filter((item) => item.id !== id))
      setMessage("Đã duyệt hồ sơ giảng viên.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không duyệt được hồ sơ")
    } finally {
      setActionId(null)
    }
  }

  async function reject(id: number) {
    const admin_note = (rejectNotes[id] || "").trim()
    if (!admin_note) {
      setError("Vui lòng nhập lý do từ chối.")
      return
    }
    try {
      setActionId(id)
      setError(null)
      await apiFetch<Verification>(`/admin/instructor-verifications/${id}/reject`, {
        method: "PATCH",
        body: JSON.stringify({ admin_note }),
      })
      setItems((prev) => prev.filter((item) => item.id !== id))
      setMessage("Đã từ chối hồ sơ giảng viên.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không từ chối được hồ sơ")
    } finally {
      setActionId(null)
    }
  }

  const pendingCount = useMemo(() => items.length, [items])

  return (
    <AdminShell title="Duyệt xác minh giảng viên" activeKey="verifications">
      {error && <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}
      {message && <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">{message}</div>}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Hồ sơ cần duyệt ({pendingCount})</CardTitle>
          <Button variant="outline" size="sm" onClick={loadItems} disabled={loading}>Tải lại</Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">Đang tải hồ sơ...</p>
          ) : items.length === 0 ? (
            <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">Không có hồ sơ cần duyệt.</p>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="rounded-lg border border-border p-5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-foreground">{item.full_name}</h3>
                        <Badge className={statusClass(item.status)}>{statusLabel(item.status)}</Badge>
                        {item.has_pending_changes && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Có chỉnh sửa</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {item.user?.username || `User #${item.user_id}`}  CCCD {item.cccd_number}
                      </p>
                      {item.pending_full_name && <p className="text-sm text-amber-700">Họ tên chờ duyệt: {item.pending_full_name}</p>}
                      {item.pending_cccd_number && <p className="text-sm text-amber-700">CCCD chờ duyệt: {item.pending_cccd_number}</p>}
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" className="gap-1" onClick={() => openVerificationFile(item.id, "cccd-front")}>
                          <ExternalLink className="h-4 w-4" /> CCCD trước
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1" onClick={() => openVerificationFile(item.id, "cccd-back")}>
                          <ExternalLink className="h-4 w-4" /> CCCD sau
                        </Button>
                        {item.pending_cccd_front_url && (
                          <Button variant="outline" size="sm" className="gap-1" onClick={() => openVerificationFile(item.id, "cccd-front-pending")}>
                            <ExternalLink className="h-4 w-4" /> CCCD trước mới
                          </Button>
                        )}
                        {item.pending_cccd_back_url && (
                          <Button variant="outline" size="sm" className="gap-1" onClick={() => openVerificationFile(item.id, "cccd-back-pending")}>
                            <ExternalLink className="h-4 w-4" /> CCCD sau mới
                          </Button>
                        )}
                      </div>

                      <div className="space-y-2 pt-2">
                        <p className="text-sm font-medium text-foreground">Bằng cấp</p>
                        {item.qualifications.map((qualification) => (
                          <div key={qualification.id} className="rounded-md border border-border p-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium">{qualification.major}</p>
                              <Badge className={statusClass(qualification.status)}>{statusLabel(qualification.status)}</Badge>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">{qualification.university_name}  {qualification.graduation_year}</p>
                            {qualification.admin_note && <p className="mt-1 text-sm text-destructive">Lý do: {qualification.admin_note}</p>}
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 gap-1"
                              onClick={() => openQualificationFile(item.id, qualification.id)}
                            >
                              <ExternalLink className="h-4 w-4" /> Xem bằng cấp
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="w-full space-y-2 xl:w-80">
                      <Input
                        placeholder="Lý do từ chối"
                        value={rejectNotes[item.id] || ""}
                        onChange={(e) => setRejectNotes((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" className="gap-1 bg-green-600 hover:bg-green-700" onClick={() => approve(item.id)} disabled={actionId === item.id}>
                          <Check className="h-4 w-4" /> Duyệt
                        </Button>
                        <Button size="sm" variant="destructive" className="gap-1" onClick={() => reject(item.id)} disabled={actionId === item.id}>
                          <XCircle className="h-4 w-4" /> Từ chối
                        </Button>
                      </div>
                    </div>
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
