"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogoutButton } from "@/components/logout-button"
import {
  GraduationCap,
  Users,
  Settings,
  Menu,
  X,
  Home,
  FileText,
  Shield,
  BarChart3,
  BookOpen,
  BadgeCheck,
  User,
} from "lucide-react"

type AdminSectionKey = "dashboard" | "users" | "verifications" | "courses" | "reports" | "analytics" | "settings"

const sidebarItems = [
  { key: "dashboard", name: "Bảng điều khiển", icon: Home, href: "/admin" },
  { key: "users", name: "Người dùng", icon: Users, href: "/admin/users" },
  { key: "verifications", name: "Xác minh GV", icon: BadgeCheck, href: "/admin/instructor-verifications" },
  { key: "courses", name: "Khóa học", icon: BookOpen, href: "/admin/courses" },
  { key: "reports", name: "Báo cáo", icon: FileText, href: "/admin/reports" },
  { key: "analytics", name: "Phân tích", icon: BarChart3, href: "/admin/analytics" },
  { key: "profile", name: "Hồ sơ cá nhân", icon: User, href: "/profile" },
  { key: "settings", name: "Cài đặt", icon: Settings, href: "/admin/settings" },
] as const

export function AdminShell({
  title,
  activeKey,
  topRight,
  children,
}: {
  title: string
  activeKey: AdminSectionKey
  topRight?: ReactNode
  children: ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-sidebar text-sidebar-foreground transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
                <GraduationCap className="h-5 w-5 text-sidebar-primary-foreground" />
              </div>
              <span className="text-xl font-bold">LearnHub</span>
            </Link>
            <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="border-b border-sidebar-border px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-sidebar-primary" />
              <span className="font-medium">Quản trị hệ thống</span>
            </div>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            {sidebarItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                  item.key === activeKey
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </nav>

          <div className="border-t border-sidebar-border p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src="" />
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
                  AD
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">Admin User</p>
                <p className="text-sm text-sidebar-foreground/70">Quản trị viên</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 h-16 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <div className="flex h-full items-center justify-between px-4 lg:px-8">
            <div className="flex items-center gap-4">
              <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-semibold text-foreground">{title}</h1>
            </div>
            <div className="flex items-center gap-4">
              {topRight}
              <LogoutButton variant="outline" />
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
