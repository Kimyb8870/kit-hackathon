"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, MessageSquare } from "lucide-react";
import { useChatStore } from "@/stores/chat-store";
import type { StudyScheduleItem, StudyItemType } from "@/types/dashboard";

interface StudyScheduleProps {
  readonly items: ReadonlyArray<StudyScheduleItem>;
  readonly onToggle: (itemId: string) => void;
  readonly onSwitchToChat?: () => void;
}

const TYPE_CONFIG: Record<
  StudyItemType,
  { readonly label: string; readonly className: string }
> = {
  new: {
    label: "신규 학습",
    className: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  },
  review: {
    label: "복습",
    className: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  },
  quiz: {
    label: "퀴즈",
    className: "bg-green-500/15 text-green-700 dark:text-green-400",
  },
};

function getButtonLabel(type: StudyItemType): string {
  switch (type) {
    case "new":
      return "학습하기";
    case "review":
      return "복습하기";
    case "quiz":
      return "퀴즈 풀기";
  }
}

// Compose a natural-language prompt that we'll auto-send into the learner
// chat when the user clicks an action button on a schedule item. The text
// gives the AI tutor enough context (course title + chapter/clip + intent)
// to start the lesson without an extra clarifying turn. The quiz wording
// explicitly asks the agent to consult the learner's history, which nudges
// it toward the new `learner_state_reporter` tool.
function buildAutoMessage(item: StudyScheduleItem): string {
  const head = `${item.courseTitle}의 ${item.chapter} ${item.clip}`;
  switch (item.type) {
    case "new":
      return `${head}을 학습하고 싶습니다. 핵심 내용을 짚어주고 학습 순서를 알려주세요.`;
    case "review":
      return `${head} 내용을 복습하고 싶습니다. 제가 최근에 놓친 부분을 요약해서 알려주세요.`;
    case "quiz":
      return `${head} 개념으로 맞춤 퀴즈 3개를 내주세요. 제 학습 이력을 참고해서 난이도를 조정해주세요.`;
  }
}

export function StudySchedule({
  items,
  onToggle,
  onSwitchToChat,
}: StudyScheduleProps) {
  const setPendingAutoMessage = useChatStore((s) => s.setPendingAutoMessage);

  const handleStartItem = (item: StudyScheduleItem) => {
    setPendingAutoMessage({
      text: buildAutoMessage(item),
      source: "study-schedule",
      context: {
        courseTitle: item.courseTitle,
        chapter: item.chapter,
        clip: item.clip,
        type: item.type,
      },
      // Forward the structured course pointer so the backend doesn't have
      // to ask the LLM to parse the human-readable title. When this is
      // present, the agent will ground its answer in the actual lecture
      // transcript instead of hallucinating from the title.
      courseContext: item.courseId
        ? {
            course_id: item.courseId,
            chapter_no: item.chapterNo,
            clip_no: item.clipNo,
          }
        : undefined,
    });
    // Tab switch is handled by the LearnerContent effect that watches
    // pendingAutoMessage. We intentionally do NOT call router.push here:
    // we are already on /learner, so push() gets deduped by Next.js 16 and
    // the URL-derived tab state never updated. The new local-state tab
    // model in LearnerContent reacts to pendingAutoMessage directly.
  };

  const handleEmptyCta = () => {
    if (onSwitchToChat) {
      onSwitchToChat();
    }
  };

  const completedCount = items.filter((item) => item.completed).length;
  const totalCount = items.length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          오늘의 학습
        </CardTitle>
        {totalCount > 0 && (
          <p className="text-sm text-muted-foreground">
            {completedCount}/{totalCount} 완료
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground/50" />
            <div>
              <p className="font-medium text-muted-foreground">
                오늘의 학습 일정이 없습니다
              </p>
              <p className="mt-1 text-sm text-muted-foreground/70">
                AI 튜터와 대화하여 학습을 시작해보세요!
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEmptyCta}
              className="mt-2"
            >
              AI 튜터와 대화하기
            </Button>
          </div>
        )}
        {items.map((item) => {
          const typeConfig = TYPE_CONFIG[item.type];
          return (
            <div
              key={item.id}
              className={`flex items-center gap-4 rounded-lg border p-3 transition-opacity ${
                item.completed ? "opacity-50" : ""
              }`}
            >
              <Checkbox
                checked={item.completed}
                onCheckedChange={() => { onToggle(item.id); }}
                className="shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge
                    className={typeConfig.className}
                  >
                    {typeConfig.label}
                  </Badge>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {item.estimatedMinutes}분
                  </span>
                </div>
                <p
                  className={`mt-1 font-medium truncate ${
                    item.completed ? "line-through" : ""
                  }`}
                >
                  {item.courseTitle}
                </p>
                <p
                  className={`text-sm text-muted-foreground truncate ${
                    item.completed ? "line-through" : ""
                  }`}
                >
                  {item.chapter} {item.clip}
                </p>
              </div>
              {!item.completed && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { handleStartItem(item); }}
                  className="shrink-0"
                >
                  {getButtonLabel(item.type)}
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
