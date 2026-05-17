"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Search,
  GraduationCap,
  Code,
  Briefcase,
  Languages,
  Users,
  Star,
  Play,
  ChevronRight,
  Menu,
  X,
  BookOpen,
  Award,
  Clock,
} from "lucide-react"

const categories = [
  { name: "IT & Software", icon: Code, count: "2.500+ khóa học", color: "bg-primary/10 text-primary" },
  { name: "Business", icon: Briefcase, count: "1.800+ khóa học", color: "bg-accent/10 text-accent" },
  { name: "Languages", icon: Languages, count: "900+ khóa học", color: "bg-success/10 text-success" },
  { name: "Soft Skills", icon: Users, count: "650+ khóa học", color: "bg-warning/10 text-warning-foreground" },
]

const featuredCourses = [
  {
    id: 1,
    title: "Complete Web Development Bootcamp",
    instructor: "Dr. Sarah Chen",
    rating: 4.9,
    reviews: 12500,
    price: 89.99,
    originalPrice: 199.99,
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=250&fit=crop",
    category: "IT & Software",
    students: 45000,
    hours: 52,
  },
  {
    id: 2,
    title: "Business Strategy Masterclass",
    instructor: "Michael Roberts",
    rating: 4.8,
    reviews: 8300,
    price: 79.99,
    originalPrice: 149.99,
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop",
    category: "Business",
    students: 32000,
    hours: 38,
  },
  {
    id: 3,
    title: "Spanish for Beginners to Advanced",
    instructor: "Maria Garcia",
    rating: 4.9,
    reviews: 6200,
    price: 49.99,
    originalPrice: 99.99,
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=250&fit=crop",
    category: "Languages",
    students: 28000,
    hours: 45,
  },
  {
    id: 4,
    title: "Leadership & Communication Skills",
    instructor: "James Wilson",
    rating: 4.7,
    reviews: 4100,
    price: 59.99,
    originalPrice: 129.99,
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=250&fit=crop",
    category: "Soft Skills",
    students: 19000,
    hours: 28,
  },
]

const testimonials = [
  {
    name: "Emily Thompson",
    role: "Software Engineer at Google",
    avatar: "ET",
    content: "LearnHub transformed my career. The web development course helped me land my dream job at a top tech company.",
    rating: 5,
  },
  {
    name: "David Kim",
    role: "Marketing Director",
    avatar: "DK",
    content: "The business courses are incredibly practical. I&apos;ve applied what I learned directly to grow our company&apos;s revenue.",
    rating: 5,
  },
  {
    name: "Sophie Martinez",
    role: "Freelance Translator",
    avatar: "SM",
    content: "Learning Spanish through LearnHub opened up new opportunities. The instructors are world-class.",
    rating: 5,
  },
]

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">LearnHub</span>
            </Link>

            {/* Search Bar - Desktop */}
            <div className="hidden flex-1 max-w-xl md:flex">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Tìm khóa học..."
                  className="w-full pl-10 bg-secondary border-0"
                />
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden items-center gap-2 md:flex">
              <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2">
                Bảng điều khiển
              </Link>
              <Link href="/search" className="text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2">
                Khóa học
              </Link>
              <Button variant="ghost" asChild>
                <Link href="/login">Đăng nhập</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Đăng ký</Link>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-border md:hidden">
            <div className="p-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Tìm khóa học..."
                  className="w-full pl-10 bg-secondary border-0"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Link href="/dashboard" className="text-sm font-medium py-2">Bảng điều khiển</Link>
                <Link href="/search" className="text-sm font-medium py-2">Khóa học</Link>
                <Button variant="ghost" className="justify-start" asChild>
                  <Link href="/login">Đăng nhập</Link>
                </Button>
                <Button className="w-full" asChild>
                  <Link href="/register">Đăng ký</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="max-w-xl">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance">
                Học mọi lúc, <span className="text-primary">mọi nơi</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                Mở khóa tiềm năng của bạn với hàng nghìn khóa học trực tuyến. Tham gia cộng đồng học viên
                và phát triển bản thân mỗi ngày.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Button size="lg" className="gap-2" asChild>
                  <Link href="/search">
                    <Play className="h-4 w-4" /> Bắt đầu học
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 !bg-white hover:!bg-gray-100"
                  asChild
                >
                  <Link href="/search" className="!text-black">
                    Xem khóa học <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="mt-10 flex items-center gap-8">
                <div>
                  <p className="text-3xl font-bold text-foreground">50K+</p>
                  <p className="text-sm text-muted-foreground">Active Students</p>
                </div>
                <div className="h-10 w-px bg-border" />
                <div>
                  <p className="text-3xl font-bold text-foreground">5,000+</p>
                  <p className="text-sm text-muted-foreground">Courses</p>
                </div>
                <div className="h-10 w-px bg-border" />
                <div>
                  <p className="text-3xl font-bold text-foreground">500+</p>
                  <p className="text-sm text-muted-foreground">Expert Instructors</p>
                </div>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="absolute -right-4 -top-4 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
              <div className="absolute -bottom-8 -left-8 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
              <div className="relative rounded-2xl bg-card p-2 shadow-2xl ring-1 ring-border">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop"
                  alt="Students learning online"
                  className="rounded-xl w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Khám phá danh mục</h2>
            <p className="mt-4 text-lg text-muted-foreground">Tìm khóa học phù hợp cho hành trình học tập của bạn</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <Link href="/search" key={category.name}>
                <Card className="group cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl ${category.color}`}>
                      <category.icon className="h-7 w-7" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">{category.count}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Khóa học nổi bật</h2>
              <p className="mt-4 text-lg text-muted-foreground">Các khóa học được đánh giá cao dành riêng cho bạn</p>
            </div>
            <Button variant="outline" className="hidden sm:flex gap-2" asChild>
              <Link href="/search">
                Xem tất cả <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredCourses.map((course) => (
              <Link href={`/course/${course.id}`} key={course.id}>
                <Card className="group overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={course.image}
                      alt={course.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="h-12 w-12 rounded-full bg-white/90 flex items-center justify-center">
                        <Play className="h-5 w-5 text-primary ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <p className="text-xs font-medium text-primary mb-2">{course.category}</p>
                    <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">{course.instructor}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-warning text-warning" />
                        <span className="text-sm font-medium">{course.rating}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">({course.reviews.toLocaleString("vi-VN")})</span>
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {(course.students / 1000).toFixed(0)}K
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {course.hours}h
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="px-4 pb-4 pt-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-foreground">${course.price}</span>
                      <span className="text-sm text-muted-foreground line-through">${course.originalPrice}</span>
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center sm:hidden">
            <Button variant="outline" className="gap-2" asChild>
              <Link href="/search">
                Xem tất cả khóa học <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold sm:text-4xl">Tại sao chọn LearnHub?</h2>
            <p className="mt-4 text-lg text-primary-foreground/80">Tham gia cùng hàng nghìn học viên thành công</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-foreground/10">
                <BookOpen className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold">Expert-Led Courses</h3>
              <p className="mt-2 text-primary-foreground/80">Learn from industry professionals with real-world experience</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-foreground/10">
                <Award className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold">Recognized Certificates</h3>
              <p className="mt-2 text-primary-foreground/80">Earn certificates valued by top employers worldwide</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-foreground/10">
                <Clock className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold">Learn at Your Pace</h3>
              <p className="mt-2 text-primary-foreground/80">Access courses anytime, anywhere, on any device</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Học viên nói gì về chúng tôi</h2>
            <p className="mt-4 text-lg text-muted-foreground">Câu chuyện thành công từ học viên trên toàn thế giới</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-background">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="text-foreground leading-relaxed">{testimonial.content}</p>
                  <div className="mt-6 flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {testimonial.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-foreground">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-primary to-primary/80 p-8 md:p-12 lg:p-16 text-center">
            <h2 className="text-3xl font-bold text-primary-foreground sm:text-4xl text-balance">
              Sẵn sàng bắt đầu hành trình học tập?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-foreground/80">
              Tham gia cùng hơn 50,000 học viên và phát triển kỹ năng mới ngay hôm nay.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/register">Bắt đầu miễn phí</Link>
              </Button>
              <Button size="lg" variant="secondary" asChild>
                <Link href="/search">Xem khóa học</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                  <GraduationCap className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-foreground">LearnHub</span>
              </Link>
              <p className="mt-4 text-sm text-muted-foreground">
                Trao quyền cho học viên toàn cầu với giáo dục chất lượng, dễ tiếp cận.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Công ty</h3>
              <ul className="mt-4 space-y-2">
                <li><Link href="/about" className="text-sm text-muted-foreground hover:text-foreground">Về chúng tôi</Link></li>
                <li><Link href="/careers" className="text-sm text-muted-foreground hover:text-foreground">Tuyển dụng</Link></li>
                <li><Link href="/press" className="text-sm text-muted-foreground hover:text-foreground">Báo chí</Link></li>
                <li><Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Tài nguyên</h3>
              <ul className="mt-4 space-y-2">
                <li><Link href="/help" className="text-sm text-muted-foreground hover:text-foreground">Trung tâm trợ giúp</Link></li>
                <li><Link href="/instructor" className="text-sm text-muted-foreground hover:text-foreground">Trở thành giảng viên</Link></li>
                <li><Link href="/affiliates" className="text-sm text-muted-foreground hover:text-foreground">Đối tác liên kết</Link></li>
                <li><Link href="/mobile" className="text-sm text-muted-foreground hover:text-foreground">Ứng dụng di động</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Pháp lý</h3>
              <ul className="mt-4 space-y-2">
                <li><Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">Chính sách bảo mật</Link></li>
                <li><Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">Điều khoản dịch vụ</Link></li>
                <li><Link href="/cookies" className="text-sm text-muted-foreground hover:text-foreground">Chính sách cookie</Link></li>
                <li><Link href="/accessibility" className="text-sm text-muted-foreground hover:text-foreground">Trợ năng</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} LearnHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
