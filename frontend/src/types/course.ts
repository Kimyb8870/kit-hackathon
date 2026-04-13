export interface Course {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly difficulty: "beginner" | "intermediate" | "advanced";
  readonly totalChapters: number;
}

export interface CourseClip {
  readonly id: string;
  readonly courseId: string;
  readonly chapterNo: number;
  readonly clipNo: number;
  readonly clipTitle: string;
  readonly timestamp: string;
  readonly conceptId: string;
}
