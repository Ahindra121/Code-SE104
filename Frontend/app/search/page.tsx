"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  GraduationCap,
  Search,
  Star,
  Clock,
  Users,
  Filter,
  X,
  SlidersHorizontal,
  BookOpen,
  Grid3X3,
  List,
  ChevronDown,
} from "lucide-react"
import { apiFetch } from "@/lib/api"
import { getStoredUser, redirectPathForRole } from "@/lib/auth"

type BackendCourse = {
  id: number
  title: string
  category: string
  price: number
  thumbnail_url?: string | null
  level: "basic" | "intermediate" | "advanced"
  rating: number
  reviews_count: number
  students_count: number
  instructor?: {
    full_name?: string | null
    username: string
  } | null
}

const allCourses = [
  {
    id: 1,
    title: "React & Next.js Masterclass 2024",
    instructor: "Nguyễn Văn A",
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=225&fit=crop",
    rating: 4.9,
    reviews: 1250,
    students: 15420,
    duration: "42 giờ",
    price: 1299000,
    originalPrice: 2499000,
    level: "Trung bình",
    category: "IT",
    tags: ["React", "Next.js", "JavaScript", "Frontend"],
    bestseller: true,
  },
  {
    id: 2,
    title: "Python for Data Science & Machine Learning",
    instructor: "Trần Thị B",
    image: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400&h=225&fit=crop",
    rating: 4.8,
    reviews: 890,
    students: 12350,
    duration: "56 giờ",
    price: 1499000,
    originalPrice: 2999000,
    level: "Nâng cao",
    category: "IT",
    tags: ["Python", "Data Science", "Machine Learning", "AI"],
    bestseller: true,
  },
  {
    id: 3,
    title: "UI/UX Design Fundamentals",
    instructor: "Lê Văn C",
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=225&fit=crop",
    rating: 4.7,
    reviews: 650,
    students: 8900,
    duration: "28 giờ",
    price: 899000,
    originalPrice: 1799000,
    level: "Cơ bản",
    category: "IT",
    tags: ["UI", "UX", "Figma", "Design"],
    bestseller: false,
  },
  {
    id: 4,
    title: "Digital Marketing Complete Guide",
    instructor: "Phạm Thị D",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=225&fit=crop",
    rating: 4.6,
    reviews: 520,
    students: 7650,
    duration: "35 giờ",
    price: 999000,
    originalPrice: 1999000,
    level: "Cơ bản",
    category: "Business",
    tags: ["Marketing", "SEO", "Social Media", "Ads"],
    bestseller: false,
  },
  {
    id: 5,
    title: "Business English Communication",
    instructor: "John Smith",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=225&fit=crop",
    rating: 4.8,
    reviews: 780,
    students: 10200,
    duration: "40 giờ",
    price: 1199000,
    originalPrice: 2399000,
    level: "Trung bình",
    category: "Language",
    tags: ["English", "Business", "Communication", "Speaking"],
    bestseller: true,
  },
  {
    id: 6,
    title: "Leadership & Team Management",
    instructor: "Hoàng Văn E",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=225&fit=crop",
    rating: 4.5,
    reviews: 340,
    students: 4560,
    duration: "22 giờ",
    price: 799000,
    originalPrice: 1599000,
    level: "Trung bình",
    category: "Soft Skills",
    tags: ["Leadership", "Management", "Team", "Soft Skills"],
    bestseller: false,
  },
  {
    id: 7,
    title: "Node.js & Express Backend Development",
    instructor: "Nguyễn Văn F",
    image: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=225&fit=crop",
    rating: 4.7,
    reviews: 420,
    students: 5890,
    duration: "38 giờ",
    price: 1199000,
    originalPrice: 2299000,
    level: "Trung bình",
    category: "IT",
    tags: ["Node.js", "Express", "Backend", "API"],
    bestseller: false,
  },
  {
    id: 8,
    title: "IELTS Preparation Complete Course",
    instructor: "Sarah Johnson",
    image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=225&fit=crop",
    rating: 4.9,
    reviews: 1560,
    students: 18900,
    duration: "60 giờ",
    price: 1699000,
    originalPrice: 3299000,
    level: "Cơ bản",
    category: "Language",
    tags: ["IELTS", "English", "Test Prep", "Academic"],
    bestseller: true,
  },
  {
    id: 9,
    title: "Financial Accounting Basics",
    instructor: "Trần Văn G",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=225&fit=crop",
    rating: 4.4,
    reviews: 280,
    students: 3450,
    duration: "25 giờ",
    price: 699000,
    originalPrice: 1399000,
    level: "Cơ bản",
    category: "Business",
    tags: ["Accounting", "Finance", "Business", "Excel"],
    bestseller: false,
  },
  {
    id: 10,
    title: "Public Speaking Mastery",
    instructor: "Lê Thị H",
    image: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=400&h=225&fit=crop",
    rating: 4.6,
    reviews: 410,
    students: 5670,
    duration: "18 giờ",
    price: 599000,
    originalPrice: 1199000,
    level: "Cơ bản",
    category: "Soft Skills",
    tags: ["Public Speaking", "Presentation", "Communication", "Confidence"],
    bestseller: false,
  },
  {
    id: 11,
    title: "AWS Cloud Practitioner Certification",
    instructor: "Phạm Văn I",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=225&fit=crop",
    rating: 4.8,
    reviews: 890,
    students: 11200,
    duration: "45 giờ",
    price: 1399000,
    originalPrice: 2799000,
    level: "Trung bình",
    category: "IT",
    tags: ["AWS", "Cloud", "DevOps", "Certification"],
    bestseller: true,
  },
  {
    id: 12,
    title: "Japanese for Beginners N5",
    instructor: "Tanaka Yuki",
    image: "https://images.unsplash.com/photo-1528164344705-47542687000d?w=400&h=225&fit=crop",
    rating: 4.7,
    reviews: 560,
    students: 7890,
    duration: "50 giờ",
    price: 1099000,
    originalPrice: 2199000,
    level: "Cơ bản",
    category: "Language",
    tags: ["Japanese", "JLPT", "N5", "Beginner"],
    bestseller: false,
  },
]

const categories = ["IT", "Business", "Language", "Soft Skills"]
const levels = ["Cơ bản", "Trung bình", "Nâng cao"]

const levelLabelByApiValue: Record<BackendCourse["level"], string> = {
  basic: "Cơ bản",
  intermediate: "Trung bình",
  advanced: "Nâng cao",
}

function mapBackendCourse(course: BackendCourse) {
  return {
    id: course.id,
    title: course.title,
    instructor: course.instructor?.full_name || course.instructor?.username || "LearnHub Instructor",
    image: course.thumbnail_url || "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=225&fit=crop",
    rating: course.rating || 0,
    reviews: course.reviews_count || 0,
    students: course.students_count || 0,
    duration: "Đang cập nhật",
    price: Number(course.price || 0),
    originalPrice: Number(course.price || 0),
    level: levelLabelByApiValue[course.level],
    category: course.category,
    tags: [course.category, levelLabelByApiValue[course.level]],
    bestseller: false,
  }
}

export default function SearchPage() {
  const [courses, setCourses] = useState(allCourses)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [homeHref, setHomeHref] = useState("/")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedLevels, setSelectedLevels] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState([0, 3000000])
  const [minRating, setMinRating] = useState(0)
  const [sortBy, setSortBy] = useState("popular")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [page, setPage] = useState(1)
  const pageSize = 6

  useEffect(() => {
    const user = getStoredUser()
    setIsLoggedIn(Boolean(user))
    setHomeHref(user ? redirectPathForRole(user.role) : "/")
    apiFetch<{ items: BackendCourse[]; total: number; page: number; page_size: number }>("/courses?page_size=100")
      .then((result) => setCourses(result.data.items.map(mapBackendCourse)))
      .catch(() => setCourses(allCourses))
  }, [])

  useEffect(() => {
    setPage(1)
  }, [searchQuery, selectedCategories, selectedLevels, priceRange, minRating, sortBy])

  const filteredCourses = useMemo(() => {
    let filtered = courses

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(query) ||
          course.instructor.toLowerCase().includes(query) ||
          course.tags.some((tag) => tag.toLowerCase().includes(query))
      )
    }

    // Categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((course) => selectedCategories.includes(course.category))
    }

    // Levels
    if (selectedLevels.length > 0) {
      filtered = filtered.filter((course) => selectedLevels.includes(course.level))
    }

    // Price range
    filtered = filtered.filter(
      (course) => course.price >= priceRange[0] && course.price <= priceRange[1]
    )

    // Rating
    if (minRating > 0) {
      filtered = filtered.filter((course) => course.rating >= minRating)
    }

    // Sort
    switch (sortBy) {
      case "popular":
        filtered = [...filtered].sort((a, b) => b.students - a.students)
        break
      case "rating":
        filtered = [...filtered].sort((a, b) => b.rating - a.rating)
        break
      case "newest":
        filtered = [...filtered].sort((a, b) => b.id - a.id)
        break
      case "price-low":
        filtered = [...filtered].sort((a, b) => a.price - b.price)
        break
      case "price-high":
        filtered = [...filtered].sort((a, b) => b.price - a.price)
        break
    }

    return filtered
  }, [courses, searchQuery, selectedCategories, selectedLevels, priceRange, minRating, sortBy])

  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / pageSize))
  const paginatedCourses = filteredCourses.slice((page - 1) * pageSize, page * pageSize)

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    )
  }

  const toggleLevel = (level: string) => {
    setSelectedLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    )
  }

  const clearFilters = () => {
    setSelectedCategories([])
    setSelectedLevels([])
    setPriceRange([0, 3000000])
    setMinRating(0)
  }

  const activeFiltersCount =
    selectedCategories.length + selectedLevels.length + (minRating > 0 ? 1 : 0) + (priceRange[0] > 0 || priceRange[1] < 3000000 ? 1 : 0)
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ"
  }

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <Label className="text-sm font-medium text-foreground mb-3 block">Danh mục</Label>
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={`cat-${category}`}
                checked={selectedCategories.includes(category)}
                onCheckedChange={() => toggleCategory(category)}
              />
              <Label htmlFor={`cat-${category}`} className="text-sm cursor-pointer text-foreground">
                {category}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Levels */}
      <div>
        <Label className="text-sm font-medium text-foreground mb-3 block">Trình độ</Label>
        <div className="space-y-2">
          {levels.map((level) => (
            <div key={level} className="flex items-center space-x-2">
              <Checkbox
                id={`level-${level}`}
                checked={selectedLevels.includes(level)}
                onCheckedChange={() => toggleLevel(level)}
              />
              <Label htmlFor={`level-${level}`} className="text-sm cursor-pointer text-foreground">
                {level}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <Label className="text-sm font-medium text-foreground mb-3 block">Mức giá</Label>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          max={3000000}
          step={100000}
          className="mb-2"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{formatPrice(priceRange[0])}</span>
          <span>{formatPrice(priceRange[1])}</span>
        </div>
      </div>

      {/* Rating */}
      <div>
        <Label className="text-sm font-medium text-foreground mb-3 block">Đánh giá tối thiểu</Label>
        <div className="flex flex-wrap gap-2">
          {[0, 3, 3.5, 4, 4.5].map((rating) => (
            <button
              key={rating}
              onClick={() => setMinRating(rating)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors ${minRating === rating
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
            >
              {rating === 0 ? (
                "Tất cả"
              ) : (
                <>
                  <Star className="h-3 w-3 fill-current" />
                  {rating}+
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {activeFiltersCount > 0 && (
        <Button variant="outline" onClick={clearFilters} className="w-full">
          <X className="h-4 w-4 mr-2" />
          Xóa bộ lọc ({activeFiltersCount})
        </Button>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 flex h-16 items-center justify-between gap-4">
          <Link href={homeHref} className="flex items-center gap-2 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground hidden sm:block">LearnHub</span>
          </Link>

          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Tìm kiếm khóa học, chủ đề, giảng viên..."
                className="pl-10 pr-4"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className={`flex items-center gap-2 shrink-0 ${isLoggedIn ? "hidden" : ""}`}>
            <Link href="/login">
              <Button variant="ghost" size="sm">Đăng nhập</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Đăng ký</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Search Summary */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {searchQuery ? `Kết quả tìm kiếm cho "${searchQuery}"` : "Tất cả khóa học"}
          </h1>
          <p className="text-muted-foreground">
            Tìm thấy {filteredCourses.length} khóa học
          </p>
        </div>

        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <Card>
              <CardContent className="p-6">
                <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Bộ lọc
                </h2>
                <FilterContent />
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                {/* Mobile Filter Button */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="lg:hidden">
                      <Filter className="h-4 w-4 mr-2" />
                      Bộ lọc
                      {activeFiltersCount > 0 && (
                        <Badge className="ml-2" variant="secondary">
                          {activeFiltersCount}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <SheetHeader>
                      <SheetTitle>Bộ lọc tìm kiếm</SheetTitle>
                      <SheetDescription>Lọc khóa học theo tiêu chí</SheetDescription>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterContent />
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Active Filters */}
                <div className="hidden md:flex items-center gap-2 flex-wrap">
                  {selectedCategories.map((cat) => (
                    <Badge key={cat} variant="secondary" className="gap-1">
                      {cat}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => toggleCategory(cat)} />
                    </Badge>
                  ))}
                  {selectedLevels.map((level) => (
                    <Badge key={level} variant="secondary" className="gap-1">
                      {level}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => toggleLevel(level)} />
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sắp xếp theo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular">Phổ biến nhất</SelectItem>
                    <SelectItem value="rating">Đánh giá cao</SelectItem>
                    <SelectItem value="newest">Mới nhất</SelectItem>
                    <SelectItem value="price-low">Giá thấp đến cao</SelectItem>
                    <SelectItem value="price-high">Giá cao đến thấp</SelectItem>
                  </SelectContent>
                </Select>

                <div className="hidden sm:flex border border-border rounded-lg">
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="icon"
                    className="rounded-r-none"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="icon"
                    className="rounded-l-none"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Results */}
            {filteredCourses.length === 0 ? (
              <Card className="p-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Không tìm thấy khóa học</h3>
                <p className="text-muted-foreground mb-4">Thử thay đổi từ khóa hoặc bộ lọc để tìm khóa học phù hợp</p>
                <Button onClick={clearFilters}>Xóa bộ lọc</Button>
              </Card>
            ) : viewMode === "grid" ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {paginatedCourses.map((course) => (
                  <Link key={course.id} href={`/course/${course.id}?returnTo=/search`}>
                    <Card className="overflow-hidden h-full group hover:shadow-lg transition-shadow">
                      <div className="relative">
                        <img
                          src={course.image}
                          alt={course.title}
                          className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {course.bestseller && (
                          <Badge className="absolute top-2 left-2 bg-yellow-500 hover:bg-yellow-500">
                            Bestseller
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                          {course.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">{course.instructor}</p>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1 text-yellow-500">
                            <Star className="h-4 w-4 fill-current" />
                            <span className="font-medium text-foreground">{course.rating}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">({course.reviews.toLocaleString("vi-VN")})</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {course.duration}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {course.students.toLocaleString("vi-VN")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-primary">{formatPrice(course.price)}</span>
                          <span className="text-sm text-muted-foreground line-through">
                            {formatPrice(course.originalPrice)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedCourses.map((course) => (
                  <Link key={course.id} href={`/course/${course.id}?returnTo=/search`}>
                    <Card className="overflow-hidden group hover:shadow-lg transition-shadow">
                      <div className="flex flex-col md:flex-row">
                        <div className="relative md:w-64 shrink-0">
                          <img
                            src={course.image}
                            alt={course.title}
                            className="w-full h-full aspect-video md:aspect-auto object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {course.bestseller && (
                            <Badge className="absolute top-2 left-2 bg-yellow-500 hover:bg-yellow-500">
                              Bestseller
                            </Badge>
                          )}
                        </div>
                        <CardContent className="flex-1 p-4 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3 className="font-semibold text-foreground text-lg mb-1 group-hover:text-primary transition-colors">
                                  {course.title}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-2">{course.instructor}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="text-lg font-bold text-primary">{formatPrice(course.price)}</div>
                                <div className="text-sm text-muted-foreground line-through">
                                  {formatPrice(course.originalPrice)}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm">
                              <div className="flex items-center gap-1 text-yellow-500">
                                <Star className="h-4 w-4 fill-current" />
                                <span className="font-medium text-foreground">{course.rating}</span>
                                <span className="text-muted-foreground">({course.reviews.toLocaleString("vi-VN")})</span>
                              </div>
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="h-3.5 w-3.5" />
                                {course.duration}
                              </span>
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Users className="h-3.5 w-3.5" />
                                {course.students.toLocaleString("vi-VN")} học viên
                              </span>
                              <Badge variant="outline">{course.level}</Badge>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-3">
                            {course.tags.slice(0, 4).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination */}
            {filteredCourses.length > 0 && (
              <div className="flex justify-center mt-8">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  >
                    Trước
                  </Button>
                  {Array.from({ length: totalPages }, (_, index) => (
                    <Button
                      key={index}
                      variant={page === index + 1 ? "secondary" : "outline"}
                      onClick={() => setPage(index + 1)}
                    >
                      {index + 1}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    disabled={page === totalPages}
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
