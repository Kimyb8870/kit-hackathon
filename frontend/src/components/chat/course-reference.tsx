import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";

interface CourseReferenceProps {
  readonly title: string;
  readonly clipLabel: string;
}

export function CourseReference({ title, clipLabel }: CourseReferenceProps) {
  return (
    <Card size="sm" className="w-fit max-w-sm">
      <CardContent className="flex items-center gap-3">
        <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{title}</span>
          <Badge variant="secondary">{clipLabel}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
