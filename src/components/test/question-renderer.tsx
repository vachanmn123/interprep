/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { type Question, type QuestionOption } from "@/types/test";
import { useCallback } from "react";

interface QuestionRendererProps {
  question: Question & {
    options: QuestionOption[];
  };
  onSubmit: (answer: unknown, timeTaken: number) => void;
  timeLimit?: number | null;
}

export default function QuestionRenderer({
  question,
  onSubmit,
  timeLimit,
}: QuestionRendererProps) {
  const [startTime] = useState<number>(Date.now());
  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    timeLimit ?? null,
  );
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [textAnswer, setTextAnswer] = useState<string>("");
  const [booleanAnswer, setBooleanAnswer] = useState<boolean | null>(null);

  const handleSubmit = useCallback(() => {
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);

    let finalAnswer;

    switch (question.type) {
      case "MULTIPLE_CHOICE":
        finalAnswer = selectedOptions;
        break;
      case "TRUE_FALSE":
        finalAnswer = booleanAnswer;
        break;
      case "SHORT_ANSWER":
      case "LONG_ANSWER":
        finalAnswer = textAnswer;
        break;
      default:
        finalAnswer = null;
    }

    onSubmit(finalAnswer, timeTaken);
  }, [
    startTime,
    question.type,
    selectedOptions,
    booleanAnswer,
    textAnswer,
    onSubmit,
  ]);

  const handleOptionToggle = (optionId: string) => {
    setSelectedOptions((prev) => {
      if (prev.includes(optionId)) {
        return prev.filter((id) => id !== optionId);
      } else {
        return [...prev, optionId];
      }
    });
  };

  // Timer for question time limit
  useEffect(() => {
    if (timeRemaining === null) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [handleSubmit, timeRemaining]);

  const renderQuestionContent = () => {
    switch (question.type) {
      case "MULTIPLE_CHOICE":
        return (
          <div className="space-y-3">
            {question.options?.map((option) => (
              <div
                key={option.id}
                className="flex cursor-pointer items-center space-x-2 rounded-md border p-3 hover:bg-gray-50"
                onClick={() => handleOptionToggle(option.id)}
              >
                <Checkbox
                  id={option.id}
                  checked={selectedOptions.includes(option.id)}
                  onCheckedChange={() => handleOptionToggle(option.id)}
                />
                <Label htmlFor={option.id} className="flex-grow cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        );

      case "TRUE_FALSE":
        return (
          <RadioGroup
            value={
              booleanAnswer === null ? undefined : booleanAnswer.toString()
            }
            onValueChange={(value) => setBooleanAnswer(value === "true")}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2 rounded-md border p-3 hover:bg-gray-50">
              <RadioGroupItem value="true" id="true" />
              <Label htmlFor="true" className="flex-grow cursor-pointer">
                True
              </Label>
            </div>
            <div className="flex items-center space-x-2 rounded-md border p-3 hover:bg-gray-50">
              <RadioGroupItem value="false" id="false" />
              <Label htmlFor="false" className="flex-grow cursor-pointer">
                False
              </Label>
            </div>
          </RadioGroup>
        );

      case "SHORT_ANSWER":
        return (
          <Textarea
            placeholder="Type your answer here..."
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            className="min-h-[100px]"
          />
        );

      case "LONG_ANSWER":
        return (
          <Textarea
            placeholder="Type your detailed answer here..."
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            className="min-h-[200px]"
          />
        );

      default:
        return <p>Unsupported question type</p>;
    }
  };

  const isAnswerSelected = () => {
    switch (question.type) {
      case "MULTIPLE_CHOICE":
        return selectedOptions.length > 0;
      case "TRUE_FALSE":
        return booleanAnswer !== null;
      case "SHORT_ANSWER":
      case "LONG_ANSWER":
        return textAnswer.trim().length > 0;
      default:
        return false;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-xl">{question.text}</CardTitle>
          {timeRemaining !== null && (
            <div className="rounded-md bg-gray-100 px-2 py-1 text-sm font-medium">
              Time left: {Math.floor(timeRemaining / 60)}:
              {(timeRemaining % 60).toString().padStart(2, "0")}
            </div>
          )}
        </div>
        <div className="text-muted-foreground text-sm">
          {question.type === "MULTIPLE_CHOICE" && "Select all that apply"}
          {question.type === "TRUE_FALSE" && "Select true or false"}
          {question.type === "SHORT_ANSWER" && "Provide a brief answer"}
          {question.type === "LONG_ANSWER" && "Provide a detailed answer"}
        </div>
      </CardHeader>
      <CardContent>{renderQuestionContent()}</CardContent>
      <CardFooter>
        <Button
          onClick={handleSubmit}
          disabled={!isAnswerSelected()}
          className="ml-auto"
        >
          Submit Answer
        </Button>
      </CardFooter>
    </Card>
  );
}
