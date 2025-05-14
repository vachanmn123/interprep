import type { Question } from "./test-creation-wizard";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { CheckCircle2, Circle } from "lucide-react";

export default function QuestionPreviewCard({
  question,
}: {
  question: Question;
}) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="mb-2">
            {question.type === "MULTIPLE_CHOICE"
              ? "Multiple Choice"
              : "True/False"}
          </Badge>
          <Badge>{question.maxScore} marks</Badge>
        </div>
        <CardTitle className="text-base">{question.text}</CardTitle>
      </CardHeader>
      <CardContent>
        {question.type === "MULTIPLE_CHOICE" && (
          <div className="flex flex-col gap-2">
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                {option.isCorrect ? (
                  <CheckCircle2 className="text-primary h-4 w-4" />
                ) : (
                  <Circle className="text-muted-foreground h-4 w-4" />
                )}
                <span className={option.isCorrect ? "font-medium" : ""}>
                  {option.label}
                </span>
              </div>
            ))}
          </div>
        )}
        {question.type === "TRUE_FALSE" && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {question.answer === true ? (
                <CheckCircle2 className="text-primary h-4 w-4" />
              ) : (
                <Circle className="text-muted-foreground h-4 w-4" />
              )}
              <span className={question.answer === true ? "font-medium" : ""}>
                True
              </span>
            </div>
            <div className="flex items-center gap-2">
              {question.answer === false ? (
                <CheckCircle2 className="text-primary h-4 w-4" />
              ) : (
                <Circle className="text-muted-foreground h-4 w-4" />
              )}
              <span className={question.answer === false ? "font-medium" : ""}>
                False
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
