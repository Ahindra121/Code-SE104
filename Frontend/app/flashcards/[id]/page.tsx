"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  GraduationCap,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Shuffle,
  Check,
  X,
  Volume2,
  Star,
  BookOpen,
  ChevronLeft,
  Lightbulb,
  Target,
  Zap,
} from "lucide-react"

interface Flashcard {
  id: number
  front: string
  back: string
  hint?: string
  mastered: boolean
}

const flashcardSet = {
  id: 1,
  title: "JavaScript Fundamentals",
  description: "Các khái niệm cơ bản trong JavaScript",
  courseId: 1,
  courseName: "React & Next.js Masterclass",
  totalCards: 20,
  mastered: 12,
  cards: [
    {
      id: 1,
      front: "Closure là gì trong JavaScript?",
      back: "Closure là một hàm có khả năng ghi nhớ và truy cập phạm vi từ vựng (lexical scope) của nó ngay cả khi hàm đó được thực thi bên ngoài phạm vi từ vựng đó.",
      hint: "Liên quan đến scope và function",
      mastered: true,
    },
    {
      id: 2,
      front: "Sự khác biệt giữa let, const và var?",
      back: "var: function-scoped, có hoisting, có thể redeclare. let: block-scoped, không redeclare, có thể reassign. const: block-scoped, không redeclare, không reassign (nhưng object/array có thể mutate).",
      hint: "Liên quan đến variable declaration",
      mastered: true,
    },
    {
      id: 3,
      front: "Promise là gì?",
      back: "Promise là một object đại diện cho việc hoàn thành (hoặc thất bại) của một hoạt động bất đồng bộ và giá trị kết quả của nó. Có 3 trạng thái: pending, fulfilled, rejected.",
      hint: "Liên quan đến async programming",
      mastered: false,
    },
    {
      id: 4,
      front: "Event Loop hoạt động như thế nào?",
      back: "Event Loop kiểm tra Call Stack, nếu trống sẽ lấy task từ Callback Queue đưa vào Stack. Microtasks (Promise) được ưu tiên trước Macrotasks (setTimeout).",
      hint: "Liên quan đến async và runtime",
      mastered: false,
    },
    {
      id: 5,
      front: "Hoisting là gì?",
      back: "Hoisting là cơ chế mà JavaScript di chuyển các khai báo biến và hàm lên đầu phạm vi của chúng trước khi thực thi code. var được hoisted với giá trị undefined, function declaration được hoisted hoàn toàn.",
      hint: "Liên quan đến compilation phase",
      mastered: true,
    },
    {
      id: 6,
      front: "this keyword trong JavaScript?",
      back: "this phụ thuộc vào cách hàm được gọi: Global context - window/global. Method - object chứa method. Constructor - instance mới. Arrow function - kế thừa từ lexical scope.",
      hint: "Context binding",
      mastered: false,
    },
    {
      id: 7,
      front: "Prototype chain là gì?",
      back: "Prototype chain là cơ chế kế thừa trong JavaScript. Mỗi object có một liên kết đến prototype của nó. Khi truy cập property, JS sẽ tìm trong object, nếu không có sẽ tìm lên prototype chain.",
      hint: "Object inheritance",
      mastered: true,
    },
    {
      id: 8,
      front: "Spread operator (...) dùng để làm gì?",
      back: "Spread operator dùng để: 1) Copy arrays/objects. 2) Merge arrays/objects. 3) Truyền arguments cho function. 4) Destructuring phần còn lại của array/object.",
      hint: "ES6 syntax",
      mastered: true,
    },
  ] as Flashcard[],
}

export default function FlashcardsPage() {
  const [cards, setCards] = useState<Flashcard[]>(flashcardSet.cards)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [studyMode, setStudyMode] = useState<"all" | "unmastered">("all")
  const [stats, setStats] = useState({ correct: 0, incorrect: 0 })

  const filteredCards = studyMode === "unmastered" ? cards.filter((c) => !c.mastered) : cards
  const currentCard = filteredCards[currentIndex]
  const progress = filteredCards.length > 0 ? ((currentIndex + 1) / filteredCards.length) * 100 : 0
  const masteredCount = cards.filter((c) => c.mastered).length

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
    setShowHint(false)
  }

  const handleNext = () => {
    if (currentIndex < filteredCards.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setIsFlipped(false)
      setShowHint(false)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setIsFlipped(false)
      setShowHint(false)
    }
  }

  const handleShuffle = () => {
    const shuffled = [...filteredCards].sort(() => Math.random() - 0.5)
    setCards((prev) => {
      const unshuffled = prev.filter((c) => !filteredCards.includes(c))
      return [...shuffled, ...unshuffled]
    })
    setCurrentIndex(0)
    setIsFlipped(false)
    setShowHint(false)
  }

  const handleReset = () => {
    setCurrentIndex(0)
    setIsFlipped(false)
    setShowHint(false)
    setStats({ correct: 0, incorrect: 0 })
  }

  const handleMarkMastered = (mastered: boolean) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === currentCard.id ? { ...card, mastered } : card
      )
    )
    setStats((prev) => ({
      correct: mastered ? prev.correct + 1 : prev.correct,
      incorrect: !mastered ? prev.incorrect + 1 : prev.incorrect,
    }))
    if (currentIndex < filteredCards.length - 1) {
      handleNext()
    }
  }

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case " ":
        case "Enter":
          e.preventDefault()
          handleFlip()
          break
        case "ArrowRight":
          handleNext()
          break
        case "ArrowLeft":
          handlePrev()
          break
        case "1":
          handleMarkMastered(false)
          break
        case "2":
          handleMarkMastered(true)
          break
      }
    },
    [currentIndex, isFlipped]
  )

  if (filteredCards.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md p-8 text-center">
          <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Tuyệt vời!</h2>
          <p className="text-muted-foreground mb-6">
            Bạn đã thuộc tất cả các thẻ chưa học. Hãy chọn học tất cả để ôn tập lại.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => setStudyMode("all")}>
              Học tất cả
            </Button>
            <Link href={`/course/${flashcardSet.courseId}`}>
              <Button>Quay lại khóa học</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-background"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/course/${flashcardSet.courseId}`}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Quay lại</span>
            </Link>
          </div>

          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground hidden sm:block">LearnHub</span>
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant={studyMode === "all" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => {
                setStudyMode("all")
                setCurrentIndex(0)
                setIsFlipped(false)
              }}
            >
              Tất cả
            </Button>
            <Button
              variant={studyMode === "unmastered" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => {
                setStudyMode("unmastered")
                setCurrentIndex(0)
                setIsFlipped(false)
              }}
            >
              Chưa thuộc
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Title & Progress */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">{flashcardSet.title}</h1>
          <p className="text-muted-foreground mb-4">{flashcardSet.description}</p>

          <div className="flex flex-wrap items-center gap-4 mb-4">
            <Badge variant="outline" className="gap-1">
              <BookOpen className="h-3 w-3" />
              {flashcardSet.courseName}
            </Badge>
            <Badge variant="secondary" className="gap-1 bg-green-100 text-green-700">
              <Check className="h-3 w-3" />
              {masteredCount}/{cards.length} đã thuộc
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Thẻ {currentIndex + 1} / {filteredCards.length}
              </span>
              <span className="text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.correct}</div>
            <div className="text-sm text-muted-foreground">Đã thuộc</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.incorrect}</div>
            <div className="text-sm text-muted-foreground">Cần ôn lại</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{filteredCards.length - currentIndex - 1}</div>
            <div className="text-sm text-muted-foreground">Còn lại</div>
          </Card>
        </div>

        {/* Flashcard */}
        <div className="perspective-1000 mb-8">
          <div
            className={`relative cursor-pointer transition-transform duration-500 transform-style-preserve-3d ${
              isFlipped ? "rotate-y-180" : ""
            }`}
            onClick={handleFlip}
            style={{
              transformStyle: "preserve-3d",
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            {/* Front */}
            <Card
              className={`p-8 min-h-[300px] flex flex-col items-center justify-center text-center ${
                isFlipped ? "invisible" : ""
              }`}
              style={{ backfaceVisibility: "hidden" }}
            >
              <div className="absolute top-4 left-4">
                {currentCard.mastered && (
                  <Badge className="bg-green-100 text-green-700">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    Đã thuộc
                  </Badge>
                )}
              </div>
              <Zap className="h-8 w-8 text-primary mb-4" />
              <p className="text-xl font-medium text-foreground">{currentCard.front}</p>
              <p className="text-sm text-muted-foreground mt-4">Click để lật thẻ</p>
            </Card>

            {/* Back */}
            <Card
              className={`p-8 min-h-[300px] flex flex-col items-center justify-center text-center absolute inset-0 ${
                !isFlipped ? "invisible" : ""
              }`}
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <Target className="h-8 w-8 text-accent mb-4" />
              <p className="text-lg text-foreground leading-relaxed">{currentCard.back}</p>
            </Card>
          </div>
        </div>

        {/* Hint */}
        {currentCard.hint && !isFlipped && (
          <div className="mb-6 text-center">
            {showHint ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                <Lightbulb className="h-4 w-4" />
                <span>{currentCard.hint}</span>
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setShowHint(true)}>
                <Lightbulb className="h-4 w-4 mr-2" />
                Xem gợi ý
              </Button>
            )}
          </div>
        )}

        {/* Answer Buttons */}
        {isFlipped && (
          <div className="flex justify-center gap-4 mb-8">
            <Button
              variant="outline"
              size="lg"
              className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => handleMarkMastered(false)}
            >
              <X className="h-5 w-5" />
              Chưa thuộc
            </Button>
            <Button
              size="lg"
              className="gap-2 bg-green-600 hover:bg-green-700"
              onClick={() => handleMarkMastered(true)}
            >
              <Check className="h-5 w-5" />
              Đã thuộc
            </Button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentIndex === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Trước
          </Button>

          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={handleShuffle} title="Xáo trộn">
              <Shuffle className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleReset} title="Bắt đầu lại">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={handleNext}
            disabled={currentIndex === filteredCards.length - 1}
          >
            Sau
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Keyboard Shortcuts */}
        <Card className="mt-8 p-4">
          <h3 className="font-medium text-foreground mb-3">Phím tắt</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-muted rounded text-xs">Space</kbd>
              <span className="text-muted-foreground">Lật thẻ</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-muted rounded text-xs">←</kbd>
              <span className="text-muted-foreground">Thẻ trước</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-muted rounded text-xs">→</kbd>
              <span className="text-muted-foreground">Thẻ sau</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-muted rounded text-xs">1</kbd>
              <kbd className="px-2 py-1 bg-muted rounded text-xs">2</kbd>
              <span className="text-muted-foreground">Đánh giá</span>
            </div>
          </div>
        </Card>
      </main>
    </div>
  )
}
