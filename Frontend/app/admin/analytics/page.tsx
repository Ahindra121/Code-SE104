"use client"

import { AdminShell } from "../_components/admin-shell"
import { SimpleBarChart, SimpleLineChart } from "../_components/simple-charts"
import { categoryData, revenueData, stats } from "../_data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Users, DollarSign, BookOpen } from "lucide-react"

export default function AdminAnalyticsPage() {
  return (
    <AdminShell title="Phân tích hệ thống" activeKey="analytics">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground">Theo dõi xu hướng tăng trưởng nền tảng</h2>
        <p className="mt-1 text-muted-foreground">Tập trung vào doanh thu, người dùng và phân bổ nội dung theo danh mục.</p>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Doanh thu</p>
                <p className="mt-2 text-2xl font-bold text-foreground">${(stats.totalRevenue / 1000000).toFixed(1)}M</p>
              </div>
              <DollarSign className="h-6 w-6 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Người dùng</p>
                <p className="mt-2 text-2xl font-bold text-foreground">{(stats.totalUsers / 1000).toFixed(1)}K</p>
              </div>
              <Users className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Khóa học</p>
                <p className="mt-2 text-2xl font-bold text-foreground">{stats.totalCourses.toLocaleString("vi-VN")}</p>
              </div>
              <BookOpen className="h-6 w-6 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tăng trưởng</p>
                <p className="mt-2 text-2xl font-bold text-foreground">+12%</p>
              </div>
              <TrendingUp className="h-6 w-6 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Xu hướng doanh thu và người dùng</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleLineChart data={revenueData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Phân bổ khóa học theo danh mục</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={categoryData} />
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  )
}
