export interface LearnerProfile {
  readonly userId: string;
  readonly careerGoal: string;
  readonly experienceLevel: "beginner" | "intermediate" | "advanced";
  readonly availableMinutes: number;
  readonly finalGoal: string;
  readonly enrolledCourses: ReadonlyArray<string>;
}

export type OnboardingStep =
  | "career_goal"
  | "experience_level"
  | "available_time"
  | "final_goal"
  | "complete";
