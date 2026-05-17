export type AdminUser = {
  id: number
  name: string
  email: string
  role: "student" | "instructor"
  courses: number
  joined: string
  status: "active" | "suspended"
  avatar: string
}

export type PendingCourse = {
  id: number
  title: string
  instructor: string
  submitted: string
  category: string
  lessons: number
  hours: number
}

export const adminUsers: AdminUser[] = [
  {
    id: 1,
    name: "Alex Johnson",
    email: "alex@example.com",
    role: "student",
    courses: 5,
    joined: "15/01/2024",
    status: "active",
    avatar: "AJ",
  },
  {
    id: 2,
    name: "Dr. Sarah Chen",
    email: "sarah@example.com",
    role: "instructor",
    courses: 4,
    joined: "01/12/2023",
    status: "active",
    avatar: "SC",
  },
  {
    id: 3,
    name: "Maria Garcia",
    email: "maria@example.com",
    role: "student",
    courses: 3,
    joined: "10/02/2024",
    status: "active",
    avatar: "MG",
  },
  {
    id: 4,
    name: "Michael Roberts",
    email: "michael@example.com",
    role: "instructor",
    courses: 2,
    joined: "20/11/2023",
    status: "active",
    avatar: "MR",
  },
  {
    id: 5,
    name: "James Wilson",
    email: "james@example.com",
    role: "student",
    courses: 2,
    joined: "05/03/2024",
    status: "suspended",
    avatar: "JW",
  },
]

export const pendingCourses: PendingCourse[] = [
  {
    id: 1,
    title: "TypeScript for JavaScript Developers",
    instructor: "Dr. Sarah Chen",
    submitted: "2 ngày trước",
    category: "CNTT & Phần mềm",
    lessons: 45,
    hours: 12,
  },
  {
    id: 2,
    title: "Digital Marketing Fundamentals",
    instructor: "Emily Parker",
    submitted: "3 ngày trước",
    category: "Kinh doanh",
    lessons: 38,
    hours: 8,
  },
  {
    id: 3,
    title: "French for Beginners",
    instructor: "Pierre Dubois",
    submitted: "5 ngày trước",
    category: "Ngôn ngữ",
    lessons: 60,
    hours: 15,
  },
]

export const categoryData = [
  { name: "CNTT & Phần mềm", value: 2500 },
  { name: "Kinh doanh", value: 1800 },
  { name: "Ngôn ngữ", value: 900 },
  { name: "Kỹ năng mềm", value: 650 },
]

export const revenueData = [
  { month: "T1", revenue: 180000, users: 120000 },
  { month: "T2", revenue: 220000, users: 150000 },
  { month: "T3", revenue: 280000, users: 180000 },
  { month: "T4", revenue: 320000, users: 220000 },
  { month: "T5", revenue: 380000, users: 280000 },
  { month: "T6", revenue: 420000, users: 320000 },
]

export const stats = {
  totalUsers: 52430,
  totalInstructors: 520,
  totalCourses: 5200,
  totalRevenue: 2850000,
  pendingApprovals: 3,
}

export const reportCards = [
  { title: "Báo cáo doanh thu tháng", description: "Tổng hợp doanh thu theo khóa học và giảng viên", updated: "Cập nhật 2 giờ trước" },
  { title: "Báo cáo tăng trưởng người dùng", description: "Theo dõi học viên và giảng viên mới theo tuần", updated: "Cập nhật hôm nay" },
  { title: "Báo cáo nội dung cần kiểm duyệt", description: "Danh sách khóa học và phản hồi đang chờ xử lý", updated: "Cập nhật 30 phút trước" },
]

export const moderationReports = [
  { id: 1, title: "Báo cáo nội dung khóa học", target: "Node.js Backend Development", status: "Chờ xử lý" },
  { id: 2, title: "Báo cáo tài khoản", target: "james@example.com", status: "Đang xem xét" },
  { id: 3, title: "Báo cáo đánh giá", target: "Khóa React & Next.js", status: "Đã xử lý" },
]
