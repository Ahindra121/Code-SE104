"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  GraduationCap,
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  Trophy,
} from "lucide-react"

const quizData = {
  title: "HTML Fundamentals Quiz",
  course: "Complete Web Development Bootcamp",
  chapter: "HTML Fundamentals",
  totalTime: 600, // 10 minutes in seconds
  passingScore: 70,
  questions: [
    {
      id: 1,
      question: "What does HTML stand for?",
      options: [
        { id: "A", text: "Hyper Text Markup Language" },
        { id: "B", text: "High Tech Modern Language" },
        { id: "C", text: "Hyper Transfer Markup Language" },
        { id: "D", text: "Home Tool Markup Language" },
      ],
      correctAnswer: "A",
    },
    {
      id: 2,
      question: "Which HTML element is used to define the largest heading?",
      options: [
        { id: "A", text: "<head>" },
        { id: "B", text: "<h6>" },
        { id: "C", text: "<h1>" },
        { id: "D", text: "<heading>" },
      ],
      correctAnswer: "C",
    },
    {
      id: 3,
      question: "Which HTML attribute is used to define inline styles?",
      options: [
        { id: "A", text: "class" },
        { id: "B", text: "styles" },
        { id: "C", text: "font" },
        { id: "D", text: "style" },
      ],
      correctAnswer: "D",
    },
    {
      id: 4,
      question: "Which HTML element is used to create an unordered list?",
      options: [
        { id: "A", text: "<ol>" },
        { id: "B", text: "<ul>" },
        { id: "C", text: "<li>" },
        { id: "D", text: "<list>" },
      ],
      correctAnswer: "B",
    },
    {
      id: 5,
      question: "What is the correct HTML element for inserting a line break?",
      options: [
        { id: "A", text: "<break>" },
        { id: "B", text: "<lb>" },
        { id: "C", text: "<br>" },
        { id: "D", text: "<newline>" },
      ],
      correctAnswer: "C",
    },
    {
      id: 6,
      question: "Which HTML element defines navigation links?",
      options: [
        { id: "A", text: "<navigate>" },
        { id: "B", text: "<nav>" },
        { id: "C", text: "<navigation>" },
        { id: "D", text: "<links>" },
      ],
      correctAnswer: "B",
    },
    {
      id: 7,
      question: "Which attribute specifies an alternate text for an image?",
      options: [
        { id: "A", text: "title" },
        { id: "B", text: "src" },
        { id: "C", text: "alt" },
        { id: "D", text: "longdesc" },
      ],
      correctAnswer: "C",
    },
    {
      id: 8,
      question: "Which HTML element is used to define a table row?",
      options: [
        { id: "A", text: "<td>" },
        { id: "B", text: "<tr>" },
        { id: "C", text: "<th>" },
        { id: "D", text: "<row>" },
      ],
      correctAnswer: "B",
    },
    {
      id: 9,
      question: "Which HTML element is used to specify a footer for a document?",
      options: [
        { id: "A", text: "<bottom>" },
        { id: "B", text: "<footer>" },
        { id: "C", text: "<section>" },
        { id: "D", text: "<end>" },
      ],
      correctAnswer: "B",
    },
    {
      id: 10,
      question: "Which input type defines a slider control?",
      options: [
        { id: "A", text: "slider" },
        { id: "B", text: "range" },
        { id: "C", text: "slide" },
        { id: "D", text: "control" },
      ],
      correctAnswer: "B",
    },
  ],
}

export default function QuizPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({})
  const [timeRemaining, setTimeRemaining] = useState(quizData.totalTime)
  const [quizState, setQuizState] = useState<"in-progress" | "submitted">("in-progress")
  const [score, setScore] = useState(0)

  const calculateScore = useCallback(() => {
    let correct = 0
    quizData.questions.forEach((q, index) => {
      if (selectedAnswers[index] === q.correctAnswer) {
        correct++
      }
    })
    return (correct / quizData.questions.length) * 100
  }, [selectedAnswers])

  const handleSubmit = useCallback(() => {
    const finalScore = calculateScore()
    setScore(finalScore)
    setQuizState("submitted")
  }, [calculateScore])

  useEffect(() => {
    if (quizState === "in-progress" && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
    } else if (timeRemaining === 0 && quizState === "in-progress") {
      handleSubmit()
    }
  }, [timeRemaining, quizState, handleSubmit])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleSelectAnswer = (questionIndex: number, answerId: string) => {
    if (quizState === "submitted") return
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: answerId,
    }))
  }

  const handleNextQuestion = () => {
    if (currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleRestartQuiz = () => {
    setCurrentQuestion(0)
    setSelectedAnswers({})
    setTimeRemaining(quizData.totalTime)
    setQuizState("in-progress")
    setScore(0)
  }

  const question = quizData.questions[currentQuestion]
  const progressPercentage = ((currentQuestion + 1) / quizData.questions.length) * 100
  const answeredCount = Object.keys(selectedAnswers).length
  const passed = score >= quizData.passingScore

  if (quizState === "submitted") {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                  <GraduationCap className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-foreground">LearnHub</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Results */}
        <main className="mx-auto max-w-2xl px-4 py-12">
          <Card className="text-center">
            <CardContent className="p-8">
              <div className={`mx-auto mb-6 h-24 w-24 rounded-full flex items-center justify-center ${
                passed ? "bg-success/10" : "bg-destructive/10"
              }`}>
                {passed ? (
                  <Trophy className="h-12 w-12 text-success" />
                ) : (
                  <XCircle className="h-12 w-12 text-destructive" />
                )}
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {passed ? "Congratulations!" : "Keep Practicing!"}
              </h1>
              <p className="text-muted-foreground mb-6">
                {passed
                  ? "You passed the quiz! Great job on mastering this material."
                  : `You need ${quizData.passingScore}% to pass. Review the material and try again.`}
              </p>
              <div className="inline-flex items-center gap-2 text-4xl font-bold mb-8">
                <span className={passed ? "text-success" : "text-destructive"}>{Math.round(score)}%</span>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8 text-center">
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-2xl font-bold text-foreground">
                    {quizData.questions.filter((q, i) => selectedAnswers[i] === q.correctAnswer).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Correct</p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-2xl font-bold text-foreground">
                    {quizData.questions.filter((q, i) => selectedAnswers[i] && selectedAnswers[i] !== q.correctAnswer).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Incorrect</p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-2xl font-bold text-foreground">
                    {quizData.questions.length - answeredCount}
                  </p>
                  <p className="text-sm text-muted-foreground">Skipped</p>
                </div>
              </div>

              {/* Review Answers */}
              <div className="text-left mb-8">
                <h3 className="font-semibold mb-4">Review Answers</h3>
                <div className="space-y-4">
                  {quizData.questions.map((q, index) => {
                    const userAnswer = selectedAnswers[index]
                    const isCorrect = userAnswer === q.correctAnswer
                    return (
                      <div
                        key={q.id}
                        className={`p-4 rounded-lg border ${
                          isCorrect ? "border-success bg-success/5" : "border-destructive bg-destructive/5"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {isCorrect ? (
                            <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                          ) : (
                            <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-foreground">
                              {index + 1}. {q.question}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Your answer: {userAnswer ? `${userAnswer}. ${q.options.find(o => o.id === userAnswer)?.text}` : "Not answered"}
                            </p>
                            {!isCorrect && (
                              <p className="text-sm text-success mt-1">
                                Correct answer: {q.correctAnswer}. {q.options.find(o => o.id === q.correctAnswer)?.text}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={handleRestartQuiz} className="gap-2">
                  <RotateCcw className="h-4 w-4" /> Try Again
                </Button>
                <Button asChild>
                  <Link href="/course/1">Back to Course</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/course/1">
                  <ChevronLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div>
                <h1 className="font-semibold text-foreground">{quizData.title}</h1>
                <p className="text-sm text-muted-foreground">{quizData.chapter}</p>
              </div>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
              timeRemaining < 60 ? "bg-destructive/10 text-destructive" : "bg-muted"
            }`}>
              <Clock className="h-4 w-4" />
              <span className="font-mono font-medium">{formatTime(timeRemaining)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-card border-b border-border">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">
              Question {currentQuestion + 1} of {quizData.questions.length}
            </span>
            <span className="text-muted-foreground">
              {answeredCount} answered
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </div>

      {/* Question Navigation Dots */}
      <div className="bg-card border-b border-border">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex gap-2 flex-wrap justify-center">
            {quizData.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`h-8 w-8 rounded-full text-sm font-medium transition-colors ${
                  currentQuestion === index
                    ? "bg-primary text-primary-foreground"
                    : selectedAnswers[index]
                    ? "bg-success/20 text-success border border-success"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Question Content */}
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {currentQuestion + 1}. {question.question}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {question.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleSelectAnswer(currentQuestion, option.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 text-left transition-all ${
                    selectedAnswers[currentQuestion] === option.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <div
                    className={`h-10 w-10 rounded-lg flex items-center justify-center font-semibold ${
                      selectedAnswers[currentQuestion] === option.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {option.id}
                  </div>
                  <span className="text-foreground">{option.text}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="outline"
            onClick={handlePrevQuestion}
            disabled={currentQuestion === 0}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <div className="flex gap-4">
            {currentQuestion === quizData.questions.length - 1 ? (
              <Button onClick={handleSubmit} className="gap-2">
                Submit Quiz
              </Button>
            ) : (
              <Button onClick={handleNextQuestion} className="gap-2">
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Warning if not all answered */}
        {answeredCount < quizData.questions.length && (
          <div className="mt-6 flex items-center gap-2 p-4 rounded-lg bg-warning/10 text-warning-foreground">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">
              You have {quizData.questions.length - answeredCount} unanswered question(s). Make sure to review before submitting.
            </span>
          </div>
        )}
      </main>
    </div>
  )
}
