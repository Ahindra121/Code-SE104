"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { apiFetch } from "@/lib/api"
import { getStoredUser, redirectPathForRole } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Award,
  Calendar,
  CheckCircle2,
  Download,
  ExternalLink,
  GraduationCap,
  Search,
  Share2,
} from "lucide-react"

type Certificate = {
  id: number
  certificate_code: string
  student_id: number
  course_id: number
  issued_at: string
}

type Course = {
  id: number
  title: string
  category: string
  thumbnail_url?: string | null
  instructor?: {
    username: string
    full_name?: string | null
  } | null
}

type CertificateView = Certificate & {
  course?: Course | null
}

function instructorName(course?: Course | null) {
  return course?.instructor?.full_name || course?.instructor?.username || "Giảng viên"
}

export default function CertificatesPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [certificates, setCertificates] = useState<CertificateView[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copyStatus, setCopyStatus] = useState<string | null>(null)

  useEffect(() => {
    const user = getStoredUser()
    if (!user) {
      router.push("/login")
      return
    }

    if (user.role !== "student") {
      router.push(redirectPathForRole(user.role))
      return
    }

    async function loadCertificates() {
      try {
        setLoading(true)
        setError(null)

        const certRes = await apiFetch<Certificate[]>("/certificates/mine")
        const withCourses = await Promise.all(
          certRes.data.map(async (certificate) => {
            try {
              const courseRes = await apiFetch<Course>(`/courses/${certificate.course_id}`)
              return { ...certificate, course: courseRes.data }
            } catch {
              return { ...certificate, course: null }
            }
          })
        )

        setCertificates(withCourses)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không tải được chứng chỉ")
      } finally {
        setLoading(false)
      }
    }

    loadCertificates()
  }, [router])

  const filteredCertificates = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase()
    if (!keyword) return certificates

    return certificates.filter((cert) => {
      const title = cert.course?.title?.toLowerCase() ?? ""
      const code = cert.certificate_code.toLowerCase()
      return title.includes(keyword) || code.includes(keyword)
    })
  }, [certificates, searchQuery])

  function getCertificateShareUrl(certificate: CertificateView) {
    if (typeof window === "undefined") return ""
    return `${window.location.origin}/certificates?certificate=${certificate.certificate_code}`
  }

  async function handleCopyLink(certificate: CertificateView) {
    const link = getCertificateShareUrl(certificate)
    if (!link) return

    try {
      await navigator.clipboard.writeText(link)
      setCopyStatus("Đã sao chép liên kết chứng chỉ")
    } catch {
      setCopyStatus("Không thể sao chép liên kết")
    }

    window.setTimeout(() => setCopyStatus(null), 2500)
  }

  function handleDownloadPDF(certificate: CertificateView) {
    const printWindow = window.open("", "_blank", "width=900,height=700")
    if (!printWindow) return

    const title = certificate.course?.title || `Khóa học #${certificate.course_id}`
    const issuedAt = new Date(certificate.issued_at).toLocaleDateString("vi-VN")

    const html = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body{font-family:Inter,Arial,sans-serif;padding:40px;line-height:1.5;color:#111;background:#fff;}
            .certificate{max-width:820px;margin:auto;padding:48px;border:2px solid #2563eb;border-radius:24px;text-align:center;}
            .eyebrow{text-transform:uppercase;letter-spacing:.18em;color:#64748b;font-size:12px;}
            .title{font-size:32px;font-weight:800;margin:24px 0 12px;}
            .code{margin-top:28px;color:#475569;}
            .footer{display:flex;justify-content:space-between;margin-top:44px;text-align:left;color:#334155;}
          </style>
        </head>
        <body>
          <div class="certificate">
            <div class="eyebrow">Certificate of Completion</div>
            <div class="title">${title}</div>
            <p>Chứng nhận học viên đã hoàn thành khóa học trên LearnHub.</p>
            <div class="code">Mã chứng chỉ: <strong>${certificate.certificate_code}</strong></div>
            <div class="footer">
              <div><div>Ngày cấp</div><strong>${issuedAt}</strong></div>
              <div><div>Giảng viên</div><strong>${instructorName(certificate.course)}</strong></div>
            </div>
          </div>
        </body>
      </html>`

    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.onload = () => printWindow.print()
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Đang tải chứng chỉ...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="font-medium text-destructive">{error}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Tải lại
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>

          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">LearnHub</span>
          </Link>

          <div className="w-24" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-foreground">Chứng chỉ của tôi</h1>
          <p className="text-muted-foreground">Danh sách chứng chỉ được cấp từ backend LearnHub.</p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Award className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{certificates.length}</div>
                <div className="text-sm text-muted-foreground">Chứng chỉ</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{certificates.length}</div>
                <div className="text-sm text-muted-foreground">Đã xác minh</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {certificates[0] ? new Date(certificates[0].issued_at).toLocaleDateString("vi-VN") : "-"}
                </div>
                <div className="text-sm text-muted-foreground">Gần nhất</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên khóa học hoặc mã chứng chỉ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {copyStatus && <p className="mt-3 text-sm text-green-600">{copyStatus}</p>}
        </div>

        {filteredCertificates.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center">
            <Award className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 font-medium text-foreground">Chưa có chứng chỉ phù hợp</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Hoàn thành đủ bài học và quiz để nhận chứng chỉ khóa học.
            </p>
            <Button className="mt-5" asChild>
              <Link href="/progress">Xem tiến độ</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCertificates.map((cert) => (
              <Card key={cert.id} className="overflow-hidden transition-shadow hover:shadow-lg">
                <div className="relative aspect-video bg-muted">
                  <img
                    src={cert.course?.thumbnail_url || "/placeholder.jpg"}
                    alt={cert.course?.title || cert.certificate_code}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <Badge className="absolute bottom-3 left-3 bg-green-600">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Đã xác minh
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <h3 className="mb-1 line-clamp-2 font-semibold text-foreground">
                    {cert.course?.title || `Khóa học #${cert.course_id}`}
                  </h3>
                  <p className="mb-3 text-sm text-muted-foreground">Giảng viên: {instructorName(cert.course)}</p>

                  <div className="mb-4 space-y-2 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Cấp ngày {new Date(cert.issued_at).toLocaleDateString("vi-VN")}
                    </p>
                    <p className="break-all">Mã: {cert.certificate_code}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href={`/course/${cert.course_id}`}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Khóa học
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownloadPDF(cert)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleCopyLink(cert)}>
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
