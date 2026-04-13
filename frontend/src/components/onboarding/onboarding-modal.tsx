"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useProfileStore } from "@/stores/profile-store";
import { useChatStore } from "@/stores/chat-store";
import { createProfile, updateProfile } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
  Code2,
  BarChart3,
  Globe,
  Smartphone,
  BrainCircuit,
  Database,
  Shield,
  Gamepad2,
  ChevronLeft,
} from "lucide-react";
import type { OnboardingStep } from "@/types/profile";

const CAREER_OPTIONS = [
  { value: "백엔드 개발", icon: Database, label: "백엔드 개발" },
  { value: "프론트엔드 개발", icon: Globe, label: "프론트엔드 개발" },
  { value: "데이터 분석", icon: BarChart3, label: "데이터 분석" },
  { value: "AI/ML 엔지니어", icon: BrainCircuit, label: "AI/ML" },
  { value: "모바일 개발", icon: Smartphone, label: "모바일 개발" },
  { value: "풀스택 개발", icon: Code2, label: "풀스택 개발" },
  { value: "보안 엔지니어", icon: Shield, label: "보안" },
  { value: "게임 개발", icon: Gamepad2, label: "게임 개발" },
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
  { value: "취업/이직 준비", label: "취업/이직 준비" },
  { value: "실무 역량 강화", label: "실무 역량 강화" },
  { value: "사이드 프로젝트", label: "사이드 프로젝트" },
  { value: "교양/취미 학습", label: "교양/취미 학습" },
] as const;

const STEP_META: Record<
  Exclude<OnboardingStep, "complete">,
  { title: string; description: string }
> = {
  career_goal: {
    title: "어떤 분야에 관심이 있나요?",
    description: "목표에 맞는 학습 경로를 추천해드릴게요",
  },
  experience_level: {
    title: "현재 수준은 어느 정도인가요?",
    description: "맞춤형 난이도로 학습을 시작해요",
  },
  available_time: {
    title: "하루에 얼마나 학습할 수 있나요?",
    description: "효율적인 학습 계획을 세워드릴게요",
  },
  final_goal: {
    title: "최종 목표는 무엇인가요?",
    description: "목표 달성을 위한 전략을 만들어드릴게요",
  },
};

const STEP_ORDER: ReadonlyArray<Exclude<OnboardingStep, "complete">> = [
  "career_goal",
  "experience_level",
  "available_time",
  "final_goal",
];

interface OnboardingModalProps {
  readonly open: boolean;
}

export function OnboardingModal({ open }: OnboardingModalProps) {
  const userId = useProfileStore((s) => s.userId);
  const setProfile = useProfileStore((s) => s.setProfile);
  const completeOnboarding = useProfileStore((s) => s.completeOnboarding);
  const { addMessage, setPendingAutoMessage } = useChatStore();

  const [step, setStep] = useState<Exclude<OnboardingStep, "complete">>(
    "career_goal"
  );
  const [careerGoal, setCareerGoal] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<
    "beginner" | "intermediate" | "advanced"
  >("beginner");
  const [availableMinutes, setAvailableMinutes] = useState(30);
  const [finalGoal, setFinalGoal] = useState("");

  const stepIndex = STEP_ORDER.indexOf(step);

  const goNext = useCallback(() => {
    const nextIndex = stepIndex + 1;
    if (nextIndex < STEP_ORDER.length) {
      setStep(STEP_ORDER[nextIndex]);
    }
  }, [stepIndex]);

  const goBack = useCallback(() => {
    const prevIndex = stepIndex - 1;
    if (prevIndex >= 0) {
      setStep(STEP_ORDER[prevIndex]);
    }
  }, [stepIndex]);

  const handleSelect = useCallback(
    (value: string | number) => {
      switch (step) {
        case "career_goal":
          setCareerGoal(value as string);
          break;
        case "experience_level":
          setExperienceLevel(
            value as "beginner" | "intermediate" | "advanced"
          );
          break;
        case "available_time":
          setAvailableMinutes(value as number);
          break;
        case "final_goal":
          setFinalGoal(value as string);
          break;
      }

      setTimeout(async () => {
        if (step === "final_goal") {
          const selectedGoal = value as string;
          const selectedCareer = careerGoal;

          // The proxy guarantees the page is only reachable with a session,
          // but the auth sync hook may still be running on the very first
          // paint. Abort the submission if the userId hasn't landed yet —
          // the user can retry with a click once the store catches up.
          if (!userId) {
            return;
          }

          const newProfile = {
            userId,
            careerGoal: selectedCareer,
            experienceLevel,
            availableMinutes,
            finalGoal: selectedGoal,
            enrolledCourses: [] as readonly string[],
          };
          // Persist locally first so the UI can render immediately even if
          // the network is slow. The chat hook reads userId from this same
          // store, so the next chat request will carry the correct id.
          setProfile(newProfile);

          // Save to the backend. We MUST await this before letting the user
          // start chatting — otherwise the agent may run before the profile
          // exists in the DB and fall back to its onboarding branch
          // ("직무가 뭐예요?"). On 409 (already exists, e.g. the persisted
          // userId was reused) we transparently switch to PUT so the row
          // gets the latest answers instead of being silently ignored.
          try {
            await createProfile(newProfile);
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            if (message.includes("409")) {
              try {
                await updateProfile(newProfile);
              } catch {
                /* swallow — UI still moves forward, chat will surface error */
              }
            }
            /* other errors: surface via chat naturally; don't block UX */
          }

          addMessage({
            id: `msg-welcome-${Date.now()}`,
            role: "assistant",
            content: `안녕하세요! ${selectedCareer} 개발자를 목표로 하시는군요. ${selectedGoal}을 위해 맞춤형 학습 경로를 준비해드릴게요.\n\n무엇이든 궁금한 점이 있으면 질문해주세요!`,
          });
          setPendingAutoMessage({ text: "내 프로필 기반으로 맞춤 강의를 추천해줘", source: "other" });
          completeOnboarding();
        } else {
          goNext();
        }
      }, 300);
    },
    [
      step,
      careerGoal,
      experienceLevel,
      availableMinutes,
      finalGoal,
      goNext,
      userId,
      setProfile,
      completeOnboarding,
      addMessage,
      setPendingAutoMessage,
    ]
  );

  const meta = STEP_META[step];

  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[480px]"
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <button
                onClick={goBack}
                className="rounded-md p-1 hover:bg-secondary"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            <div className="flex-1">
              <DialogTitle>{meta.title}</DialogTitle>
              <DialogDescription>{meta.description}</DialogDescription>
            </div>
            <span className="text-xs text-muted-foreground">
              {stepIndex + 1}/{STEP_ORDER.length}
            </span>
          </div>

          <div className="flex gap-1">
            {STEP_ORDER.map((s, i) => (
              <div
                key={s}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  i <= stepIndex ? "bg-primary" : "bg-secondary"
                )}
              />
            ))}
          </div>
        </DialogHeader>

        {step === "career_goal" && (
          <div className="grid grid-cols-4 gap-2">
            {CAREER_OPTIONS.map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => handleSelect(value)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs transition-all hover:border-primary hover:bg-primary/5",
                  careerGoal === value
                    ? "border-primary bg-primary/10"
                    : "border-border"
                )}
              >
                <Icon className="h-6 w-6" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>
        )}

        {step === "experience_level" && (
          <div className="space-y-2">
            {EXPERIENCE_OPTIONS.map(({ value, label, desc }) => (
              <button
                key={value}
                onClick={() => handleSelect(value)}
                className={cn(
                  "w-full rounded-xl border p-4 text-left transition-all hover:border-primary hover:bg-primary/5",
                  experienceLevel === value
                    ? "border-primary bg-primary/10"
                    : "border-border"
                )}
              >
                <div className="text-sm font-medium">{label}</div>
                <div className="text-xs text-muted-foreground">{desc}</div>
              </button>
            ))}
          </div>
        )}

        {step === "available_time" && (
          <div className="flex gap-2">
            {TIME_OPTIONS.map(({ value, label, desc }) => (
              <button
                key={value}
                onClick={() => handleSelect(value)}
                className={cn(
                  "flex-1 rounded-xl border p-4 text-center transition-all hover:border-primary hover:bg-primary/5",
                  availableMinutes === value
                    ? "border-primary bg-primary/10"
                    : "border-border"
                )}
              >
                <div className="text-lg font-semibold">{label}</div>
                <div className="text-xs text-muted-foreground">{desc}</div>
              </button>
            ))}
          </div>
        )}

        {step === "final_goal" && (
          <div className="space-y-2">
            {GOAL_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleSelect(value)}
                className={cn(
                  "w-full rounded-xl border p-4 text-left text-sm font-medium transition-all hover:border-primary hover:bg-primary/5",
                  finalGoal === value
                    ? "border-primary bg-primary/10"
                    : "border-border"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
