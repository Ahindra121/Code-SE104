import { API_BASE_URL } from "@/lib/api"

export type CourseThumbnailSource = {
  thumbnail_url?: string | null
  category?: string | null
}

const DEFAULT_THUMBNAILS: Record<string, string> = {
  it: "/images/course-defaults/it.png",
  business: "/images/course-defaults/business.png",
  language: "/images/course-defaults/language.png",
  "soft skill": "/images/course-defaults/soft-skill.png",
  "soft skills": "/images/course-defaults/soft-skill.png",
}

export function getCourseThumbnailUrl(course?: CourseThumbnailSource | null) {
  const thumbnail = course?.thumbnail_url?.trim()
  if (thumbnail) {
    if (/^https?:\/\//i.test(thumbnail)) return thumbnail
    return `${API_BASE_URL}${thumbnail}`
  }

  const category = course?.category?.trim().toLowerCase()
  return (category && DEFAULT_THUMBNAILS[category]) || "/placeholder.jpg"
}
