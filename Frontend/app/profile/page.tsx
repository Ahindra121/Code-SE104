"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import {
  GraduationCap,
  User,
  Mail,
  Phone,
  Camera,
  Lock,
  Eye,
  EyeOff,
  BookOpen,
  Award,
  Clock,
  Target,
  Edit3,
  Save,
  X,
  Bell,
  Shield,
  Trash2,
  ArrowLeft,
  Settings,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Switch } from "@/components/ui/switch"

const userData = {
  id: "USR001",
  fullName: "Nguyễn Tuấn Kiệt",
  username: "tuankiet_24",
  email: "tuankiet@gmail.com",
  phone: "0901234567",
  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop",
  role: "student",
  bio: "Sinh viên năm 3 ngành Khoa học Máy tính tại UIT. Đam mê học hỏi và phát triển bản thân.",
  joinDate: "15/01/2024",
  stats: {
    coursesEnrolled: 12,
    coursesCompleted: 8,
    totalHours: 156,
    certificates: 5,
  },
}

const recentCourses = [
  { id: 1, title: "React & Next.js Masterclass", progress: 75, image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=100&h=60&fit=crop" },
  { id: 2, title: "Python for Data Science", progress: 45, image: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=100&h=60&fit=crop" },
  { id: 3, title: "UI/UX Design Fundamentals", progress: 90, image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=100&h=60&fit=crop" },
]

const achievements = [
  { id: 1, title: "Học viên chăm chỉ", description: "Hoàn thành 5 khóa học", icon: Award, color: "text-yellow-500" },
  { id: 2, title: "Người bắt đầu", description: "Đăng ký khóa học đầu tiên", icon: Target, color: "text-green-500" },
  { id: 3, title: "100 giờ học", description: "Tích lũy 100 giờ học tập", icon: Clock, color: "text-blue-500" },
]

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [formData, setFormData] = useState({
    fullName: userData.fullName,
    phone: userData.phone,
    email: userData.email,
    bio: userData.bio,
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    courseUpdates: true,
    promotions: false,
  })

  const handleSaveProfile = () => {
    // Save profile logic
    setIsEditing(false)
  }

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault()
    // Change password logic
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Quay lại Dashboard</span>
            </Link>
          </div>
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">LearnHub</span>
          </Link>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="mb-8 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20" />
          <CardContent className="relative pt-0">
            <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-16">
              <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-card shadow-lg">
                  <AvatarImage src={userData.avatar} alt={userData.fullName} />
                  <AvatarFallback className="text-3xl">{userData.fullName.charAt(0)}</AvatarFallback>
                </Avatar>
                <button className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors">
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 pb-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">{userData.fullName}</h1>
                    <p className="text-muted-foreground">@{userData.username}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        {userData.role === "student" ? "Học viên" : "Giảng viên"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">Tham gia từ {userData.joinDate}</span>
                    </div>
                  </div>
                  <Button onClick={() => setIsEditing(!isEditing)} variant={isEditing ? "outline" : "default"}>
                    {isEditing ? (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        Hủy
                      </>
                    ) : (
                      <>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Chỉnh sửa
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{userData.stats.coursesEnrolled}</div>
                <div className="text-sm text-muted-foreground">Khóa học đã đăng ký</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{userData.stats.coursesCompleted}</div>
                <div className="text-sm text-muted-foreground">Khóa học hoàn thành</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{userData.stats.totalHours}h</div>
                <div className="text-sm text-muted-foreground">Giờ học tập</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{userData.stats.certificates}</div>
                <div className="text-sm text-muted-foreground">Chứng chỉ</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="profile">Hồ sơ</TabsTrigger>
                <TabsTrigger value="security">Bảo mật</TabsTrigger>
                <TabsTrigger value="notifications">Thông báo</TabsTrigger>
                <TabsTrigger value="account">Tài khoản</TabsTrigger>
              </TabsList>

              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle>Thông tin cá nhân</CardTitle>
                    <CardDescription>Cập nhật thông tin cá nhân của bạn</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-foreground">Họ và tên</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="fullName"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            disabled={!isEditing}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-foreground">Số điện thoại</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            disabled={!isEditing}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-foreground">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          disabled={!isEditing}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio" className="text-foreground">Giới thiệu bản thân</Label>
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        disabled={!isEditing}
                        rows={4}
                        placeholder="Viết vài dòng giới thiệu về bản thân..."
                      />
                    </div>

                    {isEditing && (
                      <div className="flex justify-end">
                        <Button onClick={handleSaveProfile}>
                          <Save className="h-4 w-4 mr-2" />
                          Lưu thay đổi
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security">
                <Card>
                  <CardHeader>
                    <CardTitle>Đổi mật khẩu</CardTitle>
                    <CardDescription>Cập nhật mật khẩu để bảo vệ tài khoản của bạn</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleChangePassword} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword" className="text-foreground">Mật khẩu hiện tại</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="currentPassword"
                            type={showCurrentPassword ? "text" : "password"}
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                            className="pl-10 pr-10"
                            placeholder="Nhập mật khẩu hiện tại"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="newPassword" className="text-foreground">Mật khẩu mới</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="newPassword"
                            type={showNewPassword ? "text" : "password"}
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            className="pl-10 pr-10"
                            placeholder="Nhập mật khẩu mới"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground">Ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-foreground">Xác nhận mật khẩu mới</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            className="pl-10"
                            placeholder="Nhập lại mật khẩu mới"
                          />
                        </div>
                      </div>

                      <Button type="submit">
                        <Shield className="h-4 w-4 mr-2" />
                        Cập nhật mật khẩu
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notifications">
                <Card>
                  <CardHeader>
                    <CardTitle>Cài đặt thông báo</CardTitle>
                    <CardDescription>Quản lý cách bạn nhận thông báo</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-foreground">Thông báo Email</Label>
                        <p className="text-sm text-muted-foreground">Nhận thông báo qua email</p>
                      </div>
                      <Switch
                        checked={notifications.email}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-foreground">Thông báo đẩy</Label>
                        <p className="text-sm text-muted-foreground">Nhận thông báo trên trình duyệt</p>
                      </div>
                      <Switch
                        checked={notifications.push}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-foreground">Cập nhật khóa học</Label>
                        <p className="text-sm text-muted-foreground">Thông báo khi khóa học có nội dung mới</p>
                      </div>
                      <Switch
                        checked={notifications.courseUpdates}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, courseUpdates: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-foreground">Khuyến mãi</Label>
                        <p className="text-sm text-muted-foreground">Nhận thông tin ưu đãi và giảm giá</p>
                      </div>
                      <Switch
                        checked={notifications.promotions}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, promotions: checked })}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="account">
                <Card className="border-destructive/20">
                  <CardHeader>
                    <CardTitle className="text-destructive">Vùng nguy hiểm</CardTitle>
                    <CardDescription>Các hành động không thể hoàn tác</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div>
                        <h4 className="font-medium text-foreground">Vô hiệu hóa tài khoản</h4>
                        <p className="text-sm text-muted-foreground">Tạm thời ngừng sử dụng tài khoản</p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline">Vô hiệu hóa</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Xác nhận vô hiệu hóa tài khoản?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tài khoản của bạn sẽ bị vô hiệu hóa. Bạn có thể kích hoạt lại bất cứ lúc nào bằng cách liên hệ hỗ trợ.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction>Xác nhận</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-destructive/30 rounded-lg bg-destructive/5">
                      <div>
                        <h4 className="font-medium text-foreground">Xóa tài khoản vĩnh viễn</h4>
                        <p className="text-sm text-muted-foreground">Xóa toàn bộ dữ liệu và không thể khôi phục</p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Xóa tài khoản
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Bạn có chắc chắn muốn xóa tài khoản?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Hành động này không thể hoàn tác. Tất cả dữ liệu của bạn bao gồm tiến độ học tập, chứng chỉ sẽ bị xóa vĩnh viễn.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive hover:bg-destructive/90">
                              Xóa vĩnh viễn
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Courses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Khóa học gần đây
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentCourses.map((course) => (
                  <Link key={course.id} href={`/course/${course.id}`} className="flex gap-3 group">
                    <img
                      src={course.image}
                      alt={course.title}
                      className="w-16 h-12 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                        {course.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={course.progress} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground">{course.progress}%</span>
                      </div>
                    </div>
                  </Link>
                ))}
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full mt-2">
                    Xem tất cả khóa học
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Thành tựu
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {achievements.map((achievement) => (
                  <div key={achievement.id} className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full bg-muted flex items-center justify-center ${achievement.color}`}>
                      <achievement.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground">{achievement.title}</h4>
                      <p className="text-xs text-muted-foreground">{achievement.description}</p>
                    </div>
                  </div>
                ))}
                <Link href="/certificates">
                  <Button variant="outline" className="w-full mt-2">
                    Xem tất cả thành tựu
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
