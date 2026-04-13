import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LearnerProfile, OnboardingStep } from "@/types/profile";

interface ProfileState {
  readonly userId: string | null;
  readonly profile: LearnerProfile | null;
  readonly onboardingStep: OnboardingStep;
  readonly isOnboarded: boolean;
  readonly setUserId: (userId: string | null) => void;
  readonly setProfile: (profile: LearnerProfile) => void;
  readonly setOnboardingStep: (step: OnboardingStep) => void;
  readonly completeOnboarding: () => void;
  readonly resetSession: () => void;
}

/**
 * The learner profile store. `userId` is now driven by the Supabase session
 * (set via `setUserId` from a sync hook) rather than a random per-browser
 * id. Profile data is still persisted locally so the onboarding flow survives
 * a reload; `resetSession` clears it on logout.
 */
export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      userId: null,
      profile: null,
      onboardingStep: "career_goal",
      isOnboarded: false,

      setUserId: (userId) => set({ userId }),

      setProfile: (profile) => set({ profile }),

      setOnboardingStep: (step) => set({ onboardingStep: step }),

      completeOnboarding: () =>
        set({
          isOnboarded: true,
          onboardingStep: "complete",
        }),

      resetSession: () =>
        set({
          userId: null,
          profile: null,
          onboardingStep: "career_goal",
          isOnboarded: false,
        }),
    }),
    {
      name: "learner-profile-storage",
      // Version bump to clear legacy per-browser random userIds now that the
      // identity source has switched to Supabase auth.users.id.
      version: 2,
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<ProfileState>;
        if (version < 2) {
          // Drop the legacy random userId entirely; the Supabase auth sync
          // hook will populate it on mount.
          return {
            ...state,
            userId: null,
            profile: null,
            onboardingStep: "career_goal",
            isOnboarded: false,
          } as ProfileState;
        }
        return state as ProfileState;
      },
    }
  )
);
