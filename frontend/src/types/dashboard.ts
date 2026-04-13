export interface ForgettingCurvePoint {
  readonly day: number;
  readonly retentionWithReview: number;
  readonly retentionWithout: number;
}

export interface ReviewItem {
  readonly conceptId: string;
  readonly courseTitle: string;
  readonly clipReference: string;
  readonly masteryLevel: number;
  readonly nextReviewAt: string;
}

export interface ConceptMastery {
  readonly conceptId: string;
  readonly conceptName: string;
  readonly courseId: string;
  readonly masteryLevel: number;
  readonly reviewCount: number;
  readonly lastReviewedAt: string;
}

export interface DashboardStats {
  readonly streakDays: number;
  readonly masteredConcepts: number;
  readonly reviewCompletion: number;
  readonly todayCompleted: number;
  readonly todayTotal: number;
}

export interface QuizResult {
  readonly conceptId: string;
  readonly isCorrect: boolean;
  readonly responseTimeMs: number;
}

export type StudyItemType = "new" | "review" | "quiz";

export interface StudyScheduleItem {
  readonly id: string;
  readonly type: StudyItemType;
  readonly courseTitle: string;
  readonly chapter: string;
  readonly clip: string;
  readonly estimatedMinutes: number;
  readonly completed: boolean;
  // Machine-readable course pointer used by the AI tutor agent. The
  // human-readable `chapter`/`clip` strings are for display only; without
  // these UUID/numeric fields the backend cannot ground its answers in
  // the actual lecture transcript.
  readonly courseId?: string;
  readonly chapterNo?: number;
  readonly clipNo?: number;
}

export interface WeeklyPlanDay {
  readonly day: string;
  readonly date: string;
  readonly totalItems: number;
  readonly completedItems: number;
  readonly isToday: boolean;
}
