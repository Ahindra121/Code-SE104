"use client"

import { useEffect, useMemo, useState } from "react"
import { AdminShell } from "../_components/admin-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { apiFetch } from "@/lib/api"
import { LearnHubUser, roleLabel } from "@/lib/auth"
import { Search, ChevronDown, MoreVertical, Eye, XCircle, Users, CheckCircle2, Trash2, RefreshCw } from "lucide-react"

const DELETE_RETENTION_DAYS = 30

type ReactivationRequest = {
  id: number
  user_id: number
  reason: string
  status: "pending" | "approved" | "rejected"
  admin_response?: string | null
  reviewed_by_id?: number | null
  reviewed_at?: string | null
  created_at: string
  updated_at: string
  user: LearnHubUser
}

function userInitials(user: LearnHubUser) {
  const name = user.full_name || user.username
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()
}

function statusLabel(user: LearnHubUser) {
  if (user.deleted_at) return "Chờ xóa"
  if (user.admin_locked_at) return "Admin vô hiệu hóa"
  return user.is_active ? "Hoạt động" : "Vô hiệu hóa"
}

function canHardDelete(user: LearnHubUser) {
  if (!user.deleted_at) return false
  const deletedAt = new Date(user.deleted_at).getTime()
  return Date.now() - deletedAt >= DELETE_RETENTION_DAYS * 24 * 60 * 60 * 1000
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<LearnHubUser[]>([])
  const [requests, setRequests] = useState<ReactivationRequest[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [userFilter, setUserFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<LearnHubUser | null>(null)

  async function loadUsers() {
    try {
      setLoading(true)
      setError(null)
      const [usersResult, requestsResult] = await Promise.all([
        apiFetch<LearnHubUser[]>("/users"),
        apiFetch<ReactivationRequest[]>("/users/reactivation-requests"),
      ])
      setUsers(usersResult.data)
      setRequests(requestsResult.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được danh sách người dùng")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const displayName = user.full_name || user.username
      const matchesSearch =
        displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesFilter = userFilter === "all" || user.role === userFilter
      return matchesSearch && matchesFilter
    })
  }, [searchQuery, userFilter, users])

  async function handleStatusChange(user: LearnHubUser, isActive: boolean) {
    const reason = isActive ? null : window.prompt("Nhập lý do vô hiệu hóa tài khoản:", "Vi phạm quy định hệ thống")
    if (!isActive && reason === null) return
    if (!isActive && !reason?.trim()) {
      setError("Vui lòng nhập lý do vô hiệu hóa tài khoản để người dùng biết nguyên nhân.")
      return
    }
    try {
      setError(null)
      setMessage(null)
      await apiFetch<LearnHubUser>(`/users/${user.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: isActive, reason: reason?.trim() }),
      })
      setMessage(isActive ? "Đã kích hoạt lại tài khoản." : "Đã vô hiệu hóa tài khoản. Người dùng cần gửi yêu cầu admin duyệt để mở lại.")
      await loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không cập nhật được trạng thái tài khoản")
    }
  }

  async function handleReviewRequest(request: ReactivationRequest, approved: boolean) {
    const response = window.prompt(approved ? "Ghi chú duyệt yêu cầu mở lại:" : "Lý do từ chối yêu cầu mở lại:", "")
    if (response === null) return
    if (!approved && !response.trim()) {
      setError("Vui lòng nhập lý do từ chối để người dùng biết nguyên nhân.")
      return
    }
    try {
      setError(null)
      setMessage(null)
      await apiFetch<ReactivationRequest>(`/users/reactivation-requests/${request.id}/${approved ? "approve" : "reject"}`, {
        method: "PATCH",
        body: JSON.stringify({ response: response.trim() || null }),
      })
      setMessage(approved ? "Đã duyệt mở lại tài khoản." : "Đã từ chối yêu cầu mở lại.")
      await loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không xử lý được yêu cầu mở lại")
    }
  }

  async function handleSoftDelete(user: LearnHubUser) {
    if (user.is_active && !user.admin_locked_at) {
      setError("Chỉ có thể xóa tài khoản đã được vô hiệu hóa.")
      return
    }
    if (!window.confirm(`Xóa tài khoản ${user.email}? Tài khoản sẽ bị xóa cứng sau 30 ngày.`)) return
    try {
      setError(null)
      setMessage(null)
      await apiFetch<LearnHubUser>(`/users/${user.id}`, { method: "DELETE" })
      setMessage("Đã đưa tài khoản vào danh sách chờ xóa.")
      await loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không xóa được tài khoản")
    }
  }

  async function handleHardDelete(user: LearnHubUser) {
    if (!window.confirm(`Xóa cứng vĩnh viễn tài khoản ${user.email}?`)) return
    try {
      setError(null)
      setMessage(null)
      await apiFetch<null>(`/users/${user.id}/hard`, { method: "DELETE" })
      setMessage("Đã xóa cứng tài khoản.")
      await loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tài khoản chưa đủ điều kiện xóa cứng")
    }
  }

  async function handlePurgeDeletedUsers() {
    try {
      setError(null)
      setMessage(null)
      const result = await apiFetch<{ deleted_count: number }>("/users/purge-deleted", { method: "POST" })
      setMessage(`Đã xóa cứng ${result.data.deleted_count} tài khoản quá 30 ngày.`)
      await loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không dọn được tài khoản quá hạn")
    }
  }

  return (
    <AdminShell title="Quản lý người dùng" activeKey="users">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Theo dõi tài khoản toàn hệ thống</h2>
          <p className="mt-1 text-muted-foreground">Lọc, tra cứu, vô hiệu hóa, duyệt mở lại và xóa tài khoản.</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={handlePurgeDeletedUsers}>
          <RefreshCw className="h-4 w-4" />
          Dọn tài khoản quá 30 ngày
        </Button>
      </div>

      {message && <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">{message}</div>}
      {error && <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}

      {selectedUser && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Hồ sơ người dùng</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">{selectedUser.email}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedUser(null)}>Đóng</Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Họ tên</p>
              <p className="mt-1 font-semibold text-foreground">{selectedUser.full_name || "-"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Username</p>
              <p className="mt-1 font-semibold text-foreground">{selectedUser.username}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Vai trò</p>
              <p className="mt-1 font-semibold text-foreground">{roleLabel(selectedUser.role)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Số điện thoại</p>
              <p className="mt-1 font-semibold text-foreground">{selectedUser.phone || "-"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Trạng thái</p>
              <p className="mt-1 font-semibold text-foreground">{statusLabel(selectedUser)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Ngày tham gia</p>
              <p className="mt-1 font-semibold text-foreground">{selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString("vi-VN") : "-"}</p>
            </div>
            <div className="md:col-span-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Giới thiệu</p>
              <p className="mt-1 text-sm text-foreground">{selectedUser.bio || "Chưa có giới thiệu."}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Yêu cầu mở lại tài khoản</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Chưa có yêu cầu mở lại tài khoản.
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <div key={request.id} className="rounded-lg border border-border p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{request.user.full_name || request.user.username}</p>
                      <p className="text-sm text-muted-foreground">{request.user.email}</p>
                      <p className="mt-2 text-sm text-foreground">{request.reason}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Gửi lúc {new Date(request.created_at).toLocaleString("vi-VN")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleReviewRequest(request, true)}>Duyệt</Button>
                      <Button size="sm" variant="outline" onClick={() => handleReviewRequest(request, false)}>Từ chối</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>Danh sách người dùng</CardTitle>
            <div className="flex gap-2">
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Tìm tên, username hoặc email..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    {userFilter === "all" ? "Tất cả người dùng" : userFilter === "student" ? "Học viên" : userFilter === "instructor" ? "Giảng viên" : "Quản trị viên"}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setUserFilter("all")}>Tất cả người dùng</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setUserFilter("student")}>Học viên</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setUserFilter("instructor")}>Giảng viên</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setUserFilter("admin")}>Quản trị viên</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Đang tải danh sách người dùng...</p>
          ) : filteredUsers.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Không có người dùng phù hợp.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className="rounded-xl border border-border p-5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className={user.role === "instructor" ? "bg-accent/10 text-accent" : user.role === "admin" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}>
                          {userInitials(user)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-foreground">{user.full_name || user.username}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {roleLabel(user.role)} • Tham gia {user.created_at ? new Date(user.created_at).toLocaleDateString("vi-VN") : "-"}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[420px]">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Username</p>
                        <p className="mt-1 font-semibold text-foreground">{user.username}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Trạng thái</p>
                        <p className="mt-1 font-semibold text-foreground">{statusLabel(user)}</p>
                        {user.admin_locked_reason && <p className="mt-1 text-xs text-muted-foreground">{user.admin_locked_reason}</p>}
                        {user.deleted_at && <p className="mt-1 text-xs text-muted-foreground">Xóa mềm {new Date(user.deleted_at).toLocaleDateString("vi-VN")}</p>}
                      </div>
                      <div className="flex items-end justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2">
                              Thao tác
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                              <Eye className="mr-2 h-4 w-4" /> Xem hồ sơ
                            </DropdownMenuItem>
                            {user.is_active ? (
                              <DropdownMenuItem onClick={() => handleStatusChange(user, false)}>
                                <XCircle className="mr-2 h-4 w-4" /> Vô hiệu hóa tài khoản
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleStatusChange(user, true)}>
                                <CheckCircle2 className="mr-2 h-4 w-4" /> Kích hoạt trực tiếp
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleSoftDelete(user)}
                              className="text-destructive"
                              disabled={user.is_active && !user.admin_locked_at}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Xóa tài khoản
                            </DropdownMenuItem>
                            {canHardDelete(user) && (
                              <DropdownMenuItem onClick={() => handleHardDelete(user)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Xóa cứng
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem disabled>
                              <Users className="mr-2 h-4 w-4" /> ID #{user.id}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
