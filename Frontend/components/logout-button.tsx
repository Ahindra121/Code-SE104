"use client"

import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { clearAuth } from "@/lib/auth"

type LogoutButtonProps = {
  variant?: "default" | "outline" | "ghost"
  className?: string
}

export function LogoutButton({ variant = "ghost", className }: LogoutButtonProps) {
  const router = useRouter()

  function handleLogout() {
    clearAuth()
    router.push("/login")
  }

  return (
    <Button type="button" variant={variant} className={className} onClick={handleLogout}>
      <LogOut className="h-4 w-4" />
      Đăng xuất
    </Button>
  )
}
