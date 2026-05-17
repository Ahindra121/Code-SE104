"use client"

import { useMemo, useState } from "react"
import { AdminShell } from "../_components/admin-shell"
import { adminUsers } from "../_data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, ChevronDown, MoreVertical, Eye, XCircle, Users } from "lucide-react"

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [userFilter, setUserFilter] = useState("all")

  const filteredUsers = useMemo(() => {
    return adminUsers.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesFilter = userFilter === "all" || user.role === userFilter
      return matchesSearch && matchesFilter
    })
  }, [searchQuery, userFilter])

  return (
    <AdminShell title="Quản lý người dùng" activeKey="users">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground">Theo dõi tài khoản toàn hệ thống</h2>
        <p className="mt-1 text-muted-foreground">Lọc, tra cứu và xử lý nhanh các tài khoản học viên và giảng viên.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>Danh sách người dùng</CardTitle>
            <div className="flex gap-2">
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm tên hoặc email..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    {userFilter === "all" ? "Tất cả người dùng" : userFilter === "student" ? "Học viên" : "Giảng viên"}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setUserFilter("all")}>Tất cả người dùng</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setUserFilter("student")}>Học viên</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setUserFilter("instructor")}>Giảng viên</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="rounded-xl border border-border p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className={user.role === "instructor" ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"}>
                        {user.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-foreground">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {user.role === "instructor" ? "Giảng viên" : "Học viên"} • Tham gia {user.joined}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[360px]">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Khóa học</p>
                      <p className="mt-1 font-semibold text-foreground">{user.courses}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Trạng thái</p>
                      <p className="mt-1 font-semibold text-foreground">{user.status === "active" ? "Hoạt động" : "Tạm dừng"}</p>
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
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" /> Xem hồ sơ
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Users className="mr-2 h-4 w-4" /> Quản lý tài khoản
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <XCircle className="mr-2 h-4 w-4" /> Tạm dừng
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </AdminShell>
  )
}
