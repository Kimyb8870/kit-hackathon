export interface StruggleLearner {
  readonly userId: string;
  readonly displayName: string;
  readonly courseTitle: string;
  readonly conceptId: string;
  readonly conceptTitle: string;
  readonly masteryLevel: number; // 0..1
  readonly failedQuizzes: number;
  readonly lastActiveAt: string;
}

export interface ContentGap {
  readonly conceptId: string;
  readonly conceptTitle: string;
  readonly courseTitle: string;
  readonly avgMastery: number; // 0..1
  readonly affectedLearners: number;
  readonly suggestion: string;
}

export interface QASummary {
  readonly id: string;
  readonly question: string;
  readonly askedCount: number;
  readonly suggestedAnswer: string;
  readonly conceptId: string;
}

export interface InstructorDashboard {
  readonly struggles: ReadonlyArray<StruggleLearner>;
  readonly contentGaps: ReadonlyArray<ContentGap>;
  readonly qaSummary: ReadonlyArray<QASummary>;
}
