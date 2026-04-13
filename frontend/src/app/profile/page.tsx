"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { useProfileStore } from "@/stores/profile-store";
import { getProfile, updateProfile, createProfile } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { LearnerProfile } from "@/types/profile";
import {
  AlertCircle,
  CheckCircle2,
  Mail,
  Save,
  UserRound,
} from "lucide-react";

const CAREER_OPTIONS = [
  "백엔드 개발",
  "프론트엔드 개발",
  "데이터 분석",
  "AI/ML 엔지니어",
  "모바일 개발",
  "풀스택 개발",
  "보안 엔지니어",
  "게임 개발",
] as const;

const EXPERIENCE_OPTIONS = [
  {
    value: "beginner" as const,
    label: "입문자",
    desc: "프로그래밍을 처음 접해요",
  },
  {
    value: "intermediate" as const,
    label: "중급자",
    desc: "기본 문법은 알고 있어요",
  },
  {
    value: "advanced" as const,
    label: "숙련자",
    desc: "실무 프로젝트 경험이 있어요",
  },
] as const;

const TIME_OPTIONS = [
  { value: 15, label: "15분", desc: "짧고 집중" },
  { value: 30, label: "30분", desc: "표준" },
  { value: 60, label: "60분", desc: "깊이 학습" },
  { value: 120, label: "120분", desc: "몰입" },
] as const;

const GOAL_OPTIONS = [
  "취업/이직 준비",
  "실무 역량 강화",
  "사이드 프로젝트",
  "교양/취미 학습",
] as const;

type ExperienceLevel = LearnerProfile["experienceLevel"];

interface FormState {
  readonly careerGoal: string;
  readonly experienceLevel: ExperienceLevel;
  readonly availableMinutes: number;
  readonly finalGoal: string;
}

const EMPTY_FORM: FormState = {
  careerGoal: "",
  experienceLevel: "beginner",
  availableMinutes: 30,
  finalGoal: "",
};

type LoadStatus = "idle" | "loading" | "ready" | "error";
type SaveStatus = "idle" | "saving" | "success" | "error";

function formStateFromProfile(profile: LearnerProfile): FormState {
  return {
    careerGoal: profile.careerGoal,
    experienceLevel: profile.experienceLevel,
    availableMinutes: profile.availableMinutes,
    finalGoal: profile.finalGoal,
  };
}

export default function ProfilePage() {
  const { user, isLoading: isUserLoading } = useSupabaseUser();
  const setStoreProfile = useProfileStore((s) => s.setProfile);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("idle");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [profileExists, setProfileExists] = useState<boolean>(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoadStatus("loading");
    setLoadError(null);

    void getProfile(user.id)
      .then((profile) => {
        if (cancelled) return;
        if (profile) {
          setForm(formStateFromProfile(profile));
          setProfileExists(true);
        } else {
          setForm(EMPTY_FORM);
          setProfileExists(false);
        }
        setLoadStatus("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "알 수 없는 오류";
        setLoadError(message);
        setLoadStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const updateField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setSaveStatus("idle");
      setSaveError(null);
    },
    []
  );

  const handleSave = useCallback(async () => {
    if (!user) return;
    setSaveStatus("saving");
    setSaveError(null);

    const nextProfile: LearnerProfile = {
      userId: user.id,
      careerGoal: form.careerGoal.trim(),
      experienceLevel: form.experienceLevel,
      availableMinutes: form.availableMinutes,
      finalGoal: form.finalGoal.trim(),
      enrolledCourses: [],
    };

    try {
      const saved = profileExists
        ? await updateProfile(nextProfile)
        : await createProfile(nextProfile);
      // Mirror backend truth into the local store so other pages (chat,
      // dashboard) immediately see the new values without a refetch.
      setStoreProfile(saved);
      setForm(formStateFromProfile(saved));
      setProfileExists(true);
      setSaveStatus("success");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "저장 실패";
      setSaveError(message);
      setSaveStatus("error");
    }
  }, [user, form, profileExists, setStoreProfile]);

  const isSaving = saveStatus === "saving";
  const canSave =
    !isSaving &&
    form.careerGoal.trim().length > 0 &&
    form.finalGoal.trim().length > 0;

  if (isUserLoading || (loadStatus === "loading" && !loadError)) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-4 p-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!user) {
    // The proxy normally prevents this, but we keep a soft fallback in case
    // someone reaches the page without a session.
    return (
      <div className="mx-auto w-full max-w-3xl space-y-4 p-6">
        <h1 className="text-2xl font-semibold tracking-tight text-clover-900">
          마이 프로필
        </h1>
        <Card>
          <CardContent className="flex items-center gap-3 py-6 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            로그인이 필요합니다.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-clover-900">
          마이 프로필
        </h1>
        <p className="text-sm text-muted-foreground">
          학습 목표와 가용 시간을 최신 상태로 유지하면 Clover가 더 정확한
          추천을 제공합니다.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserRound className="h-4 w-4 text-clover-600" />
            계정 정보
          </CardTitle>
          <CardDescription>Supabase Auth 세션 기준</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 rounded-lg bg-clover-50/60 px-3 py-2 text-sm text-clover-900 ring-1 ring-clover-100">
            <Mail className="h-4 w-4 text-clover-600" />
            <span className="font-medium">{user.email ?? "이메일 없음"}</span>
          </div>
        </CardContent>
      </Card>

      {loadStatus === "error" && (
        <Card>
          <CardContent className="flex items-start gap-3 py-4 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">프로필을 불러오지 못했어요.</p>
              <p className="text-xs text-muted-foreground">{loadError}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">커리어 목표</CardTitle>
          <CardDescription>
            관심 분야를 선택하거나 직접 입력하세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {CAREER_OPTIONS.map((option) => {
              const active = form.careerGoal === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => updateField("careerGoal", option)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                    active
                      ? "border-clover-500 bg-clover-50 text-clover-800"
                      : "border-border bg-background text-foreground hover:border-clover-300 hover:bg-clover-50/50"
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
          <input
            type="text"
            value={form.careerGoal}
            onChange={(e) => updateField("careerGoal", e.target.value)}
            placeholder="직접 입력 (예: DevOps 엔지니어)"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-clover-500 focus:ring-2 focus:ring-clover-200"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">경험 수준</CardTitle>
          <CardDescription>현재 본인의 수준을 선택하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {EXPERIENCE_OPTIONS.map(({ value, label, desc }) => {
              const active = form.experienceLevel === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => updateField("experienceLevel", value)}
                  className={cn(
                    "rounded-xl border p-3 text-left transition-colors",
                    active
                      ? "border-clover-500 bg-clover-50"
                      : "border-border bg-background hover:border-clover-300 hover:bg-clover-50/50"
                  )}
                >
                  <div className="text-sm font-semibold text-foreground">
                    {label}
                  </div>
                  <div className="text-xs text-muted-foreground">{desc}</div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">하루 가용 시간</CardTitle>
          <CardDescription>
            학습에 투입 가능한 시간(분)을 선택하세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TIME_OPTIONS.map(({ value, label, desc }) => {
              const active = form.availableMinutes === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => updateField("availableMinutes", value)}
                  className={cn(
                    "rounded-xl border p-3 text-center transition-colors",
                    active
                      ? "border-clover-500 bg-clover-50"
                      : "border-border bg-background hover:border-clover-300 hover:bg-clover-50/50"
                  )}
                >
                  <div className="text-base font-semibold text-foreground">
                    {label}
                  </div>
                  <div className="text-xs text-muted-foreground">{desc}</div>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={5}
              max={480}
              step={5}
              value={form.availableMinutes}
              onChange={(e) => {
                const next = Number(e.target.value);
                if (Number.isFinite(next) && next > 0) {
                  updateField("availableMinutes", next);
                }
              }}
              className="w-28 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-clover-500 focus:ring-2 focus:ring-clover-200"
            />
            <span className="text-xs text-muted-foreground">분 / 일</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">최종 목표</CardTitle>
          <CardDescription>학습을 통해 이루고 싶은 것</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {GOAL_OPTIONS.map((option) => {
              const active = form.finalGoal === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => updateField("finalGoal", option)}
                  className={cn(
                    "rounded-xl border px-3 py-3 text-left text-sm font-medium transition-colors",
                    active
                      ? "border-clover-500 bg-clover-50 text-clover-800"
                      : "border-border bg-background text-foreground hover:border-clover-300 hover:bg-clover-50/50"
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between rounded-xl border border-clover-100 bg-white px-4 py-3 shadow-sm">
        <div className="text-xs text-muted-foreground">
          {saveStatus === "success" && (
            <span className="inline-flex items-center gap-1 text-clover-700">
              <CheckCircle2 className="h-3.5 w-3.5" /> 저장되었습니다.
            </span>
          )}
          {saveStatus === "error" && (
            <span className="inline-flex items-center gap-1 text-destructive">
              <AlertCircle className="h-3.5 w-3.5" />
              {saveError ?? "저장 중 오류가 발생했어요."}
            </span>
          )}
          {saveStatus === "idle" && !profileExists && (
            <span>아직 프로필이 없어요. 저장하면 새로 생성됩니다.</span>
          )}
        </div>
        <Button onClick={handleSave} disabled={!canSave}>
          <Save className="h-4 w-4" />
          {isSaving ? "저장 중..." : "저장"}
        </Button>
      </div>
    </div>
  );
}
