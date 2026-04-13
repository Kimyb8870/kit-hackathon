import { create } from "zustand";
import type {
  ForgettingCurvePoint,
  ReviewItem,
  DashboardStats,
  StudyScheduleItem,
  WeeklyPlanDay,
} from "@/types/dashboard";
import { getDashboard } from "@/lib/api-client";
import {
  MOCK_TODAY_SCHEDULE,
  MOCK_WEEKLY_PLAN,
} from "@/lib/constants";

interface DashboardState {
  readonly stats: DashboardStats;
  readonly forgettingCurve: ReadonlyArray<ForgettingCurvePoint>;
  readonly reviewSchedule: ReadonlyArray<ReviewItem>;
  readonly todaySchedule: ReadonlyArray<StudyScheduleItem>;
  readonly weeklyPlan: ReadonlyArray<WeeklyPlanDay>;
  readonly isLoading: boolean;
  readonly fetchDashboardData: (userId: string) => Promise<void>;
  readonly toggleScheduleItem: (itemId: string) => void;
}

function computeStats(schedule: ReadonlyArray<StudyScheduleItem>): DashboardStats {
  const todayCompleted = schedule.filter((item) => item.completed).length;
  const todayTotal = schedule.length;
  return {
    streakDays: 7,
    masteredConcepts: 5,
    reviewCompletion: 78,
    todayCompleted,
    todayTotal,
  };
}

const DEFAULT_STATS: DashboardStats = computeStats(MOCK_TODAY_SCHEDULE);

export const useDashboardStore = create<DashboardState>((set, get) => ({
  stats: DEFAULT_STATS,
  forgettingCurve: [],
  reviewSchedule: [],
  todaySchedule: MOCK_TODAY_SCHEDULE,
  weeklyPlan: MOCK_WEEKLY_PLAN,
  isLoading: false,

  fetchDashboardData: async (userId: string) => {
    set({ isLoading: true });
    try {
      const data = await getDashboard(userId);
      const schedule = MOCK_TODAY_SCHEDULE;
      set({
        forgettingCurve: data.forgettingCurve,
        reviewSchedule: data.reviewSchedule,
        todaySchedule: schedule,
        weeklyPlan: MOCK_WEEKLY_PLAN,
        stats: computeStats(schedule),
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  toggleScheduleItem: (itemId: string) => {
    const currentSchedule = get().todaySchedule;
    const updatedSchedule = currentSchedule.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    set({
      todaySchedule: updatedSchedule,
      stats: computeStats(updatedSchedule),
    });
  },
}));
