"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  GraduationCap,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Star,
  BookOpen,
  Clock,
  Award,
  Download,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
} from "lucide-react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

const revenueData = [
  { month: "T1", revenue: 12500000, students: 45 },
  { month: "T2", revenue: 18200000, students: 62 },
  { month: "T3", revenue: 15800000, students: 51 },
  { month: "T4", revenue: 22400000, students: 78 },
  { month: "T5", revenue: 28900000, students: 95 },
  { month: "T6", revenue: 24600000, students: 82 },
]

const enrollmentData = [
  { day: "T2", value: 12 },
  { day: "T3", value: 19 },
  { day: "T4", value: 15 },
  { day: "T5", value: 25 },
  { day: "T6", value: 22 },
  { day: "T7", value: 30 },
  { day: "CN", value: 18 },
]

const coursePerformance = [
  { name: "React & Next.js", students: 1542, revenue: 45200000, rating: 4.9, completion: 78 },
  { name: "Python Data Science", students: 1235, revenue: 38500000, rating: 4.8, completion: 72 },
  { name: "UI/UX Design", students: 890, revenue: 24800000, rating: 4.7, completion: 85 },
  { name: "Node.js Backend", students: 654, revenue: 18900000, rating: 4.6, completion: 68 },
  { name: "AWS Cloud", students: 423, revenue: 15200000, rating: 4.8, completion: 71 },
]

const categoryData = [
  { name: "IT & Lập trình", value: 65, color: "#6366f1" },
  { name: "Kinh doanh", value: 15, color: "#22c55e" },
  { name: "Ngôn ngữ", value: 12, color: "#f59e0b" },
  { name: "Kỹ năng mềm", value: 8, color: "#ec4899" },
]

const completionData = [
  { range: "0-25%", count: 245 },
  { range: "26-50%", count: 412 },
  { range: "51-75%", count: 678 },
  { range: "76-100%", count: 1205 },
]

const recentEnrollments = [
  { id: 1, student: "Nguyễn Văn A", course: "React & Next.js", date: "Hôm nay", avatar: "https://i.pravatar.cc/40?img=1" },
  { id: 2, student: "Trần Thị B", course: "Python Data Science", date: "Hôm nay", avatar: "https://i.pravatar.cc/40?img=2" },
  { id: 3, student: "Lê Văn C", course: "UI/UX Design", date: "Hôm qua", avatar: "https://i.pravatar.cc/40?img=3" },
  { id: 4, student: "Phạm Thị D", course: "React & Next.js", date: "Hôm qua", avatar: "https://i.pravatar.cc/40?img=4" },
  { id: 5, student: "Hoàng Văn E", course: "Node.js Backend", date: "2 ngày trước", avatar: "https://i.pravatar.cc/40?img=5" },
]

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("6months")

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + "M"
    }
    return value.toLocaleString("vi-VN")
  }

  const totalRevenue = revenueData.reduce((acc, item) => acc + item.revenue, 0)
  const totalStudents = coursePerformance.reduce((acc, item) => acc + item.students, 0)
  const avgRating = (coursePerformance.reduce((acc, item) => acc + item.rating, 0) / coursePerformance.length).toFixed(1)
  const avgCompletion = Math.round(coursePerformance.reduce((acc, item) => acc + item.completion, 0) / coursePerformance.length)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/instructor"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          </div>

          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">LearnHub</span>
          </Link>

          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[140px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">7 ngày qua</SelectItem>
                <SelectItem value="30days">30 ngày qua</SelectItem>
                <SelectItem value="6months">6 tháng qua</SelectItem>
                <SelectItem value="1year">1 năm qua</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Xuất báo cáo
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Phân tích & Thống kê</h1>
          <p className="text-muted-foreground">Theo dõi hiệu suất khóa học và doanh thu của bạn</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tổng doanh thu</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(totalRevenue)}đ</p>
                  <div className="flex items-center gap-1 text-sm text-green-600 mt-1">
                    <TrendingUp className="h-3 w-3" />
                    <span>+12.5%</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tổng học viên</p>
                  <p className="text-2xl font-bold text-foreground">{totalStudents.toLocaleString("vi-VN")}</p>
                  <div className="flex items-center gap-1 text-sm text-green-600 mt-1">
                    <TrendingUp className="h-3 w-3" />
                    <span>+8.3%</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Đánh giá TB</p>
                  <p className="text-2xl font-bold text-foreground">{avgRating}</p>
                  <div className="flex items-center gap-1 text-sm text-green-600 mt-1">
                    <TrendingUp className="h-3 w-3" />
                    <span>+0.2</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tỷ lệ hoàn thành</p>
                  <p className="text-2xl font-bold text-foreground">{avgCompletion}%</p>
                  <div className="flex items-center gap-1 text-sm text-red-600 mt-1">
                    <TrendingDown className="h-3 w-3" />
                    <span>-2.1%</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Charts */}
          <div className="lg:col-span-2 space-y-8">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Doanh thu & Đăng ký
                    </CardTitle>
                    <CardDescription>Theo dõi doanh thu và số lượng đăng ký theo tháng</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis
                        tickFormatter={(value) => formatCurrency(value)}
                        className="text-xs"
                      />
                      <Tooltip
                        formatter={(value: number) => [formatCurrency(value) + "đ", "Doanh thu"]}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#6366f1"
                        strokeWidth={2}
                        fill="url(#colorRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Enrollment Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Xu hướng đăng ký (7 ngày gần nhất)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={enrollmentData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="day" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={{ fill: "#22c55e", strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Course Performance Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Hiệu suất khóa học
                </CardTitle>
                <CardDescription>Top khóa học theo doanh thu và học viên</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Khóa học</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Học viên</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Doanh thu</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Đánh giá</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Hoàn thành</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coursePerformance.map((course, index) => (
                        <tr key={index} className="border-b border-border last:border-0 hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <span className="font-medium text-foreground">{course.name}</span>
                          </td>
                          <td className="text-right py-3 px-4 text-foreground">
                            {course.students.toLocaleString("vi-VN")}
                          </td>
                          <td className="text-right py-3 px-4 text-foreground">
                            {formatCurrency(course.revenue)}đ
                          </td>
                          <td className="text-right py-3 px-4">
                            <div className="flex items-center justify-end gap-1">
                              <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                              <span className="text-foreground">{course.rating}</span>
                            </div>
                          </td>
                          <td className="text-right py-3 px-4">
                            <Badge variant={course.completion >= 75 ? "default" : "secondary"}>
                              {course.completion}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Phân bố danh mục
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [`${value}%`, "Tỷ lệ"]}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4">
                  {categoryData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-foreground">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Completion Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Phân bố tiến độ
                </CardTitle>
                <CardDescription>Tiến độ hoàn thành của học viên</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={completionData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                      <XAxis type="number" className="text-xs" />
                      <YAxis type="category" dataKey="range" className="text-xs" width={60} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Recent Enrollments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Đăng ký gần đây
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentEnrollments.map((enrollment) => (
                    <div key={enrollment.id} className="flex items-center gap-3">
                      <img
                        src={enrollment.avatar}
                        alt={enrollment.student}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">
                          {enrollment.student}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {enrollment.course}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {enrollment.date}
                      </span>
                    </div>
                  ))}
                </div>
                <Link href="/instructor">
                  <Button variant="outline" className="w-full mt-4">
                    Xem tất cả
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
