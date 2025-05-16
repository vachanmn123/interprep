/* eslint-disable @typescript-eslint/prefer-for-of */
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import type { Resume } from "./resumeTools";
import { DOMParser } from "xmldom";

const systemPrompt_Technical = `
You are an AI-powered interview question generation agent. You will receive a candidate's profile in JSON format, which includes their skills, work experience, education, and relevant technologies.

Your task is to generate a list of 20 technical interview questions tailored specifically to the candidate's profile. Focus on producing questions that align with the candidate's stated skills, technologies, and past roles. Include a mix of conceptual, practical, and scenario-based questions that assess both depth and applicability of knowledge.

Output the questions in the following XML format, where each \`<question>\` follows this structure:

<questions>
  <question>
    <text>...</text>
    <type>MULTIPLE_CHOICE | TRUE_FALSE</type>
    <maxScore>1 to 5</maxScore>
    <timeLimit>Optional, in seconds</timeLimit>
    <answer>TRUE | FALSE</answer>
    <options>
      <option>
        <label>Option text</label>
        <isCorrect>true or false</isCorrect>
      </option>
      ...
    </options>
  </question>
  ...
</questions>

Only include the \`<options>\` block if the question type is MULTIPLE_CHOICE.
The \`<answer>\` block is only required for TRUE_FALSE questions. 
The \`<timeLimit>\` block is optional and should be included if the question has a specific time limit.

Do not include any explanation, comments, or metadata. Output only a clean XML list of questions inside a root \`<questions>\` tag.

Begin generating the questions after this line.

Candidate Profile (JSON):

`;

const systemPrompt_HR = `
You are an AI-powered interview question generation agent. You will receive a candidate's profile in JSON format, which includes their skills, work experience, education, and relevant technologies.

Your task is to generate a list of 20 HR interview questions tailored specifically to the candidate's profile. Focus on producing questions that align with the candidate's stated skills, technologies, and past roles. Include a mix of conceptual, practical, and scenario-based questions that assess both depth and applicability of knowledge.

Output the questions in the following XML format, where each \`<question>\` follows this structure:

<questions>
  <question>
    <text>...</text>
    <type>MULTIPLE_CHOICE | TRUE_FALSE</type>
    <maxScore>1 to 5</maxScore>
    <timeLimit>Optional, in seconds</timeLimit>
    <answer>TRUE | FALSE</answer>
    <options>
      <option>
        <label>Option text</label>
        <isCorrect>true or false</isCorrect>
      </option>
      ...
    </options>
  </question>
  ...
</questions>

Only include the \`<options>\` block if the question type is MULTIPLE_CHOICE.
The \`<answer>\` block is only required for TRUE_FALSE questions. 
The \`<timeLimit>\` block is optional and should be included if the question has a specific time limit.

Do not include any explanation, comments, or metadata. Output only a clean XML list of questions inside a root \`<questions>\` tag.

Begin generating the questions after this line.

Candidate Profile (JSON):
`;

export async function generateQuestions(
  type: "HR" | "Technical",
  profile: Resume,
) {
  const systemPrompt = type === "HR" ? systemPrompt_HR : systemPrompt_Technical;

  const model = google("gemini-2.0-flash", {
    useSearchGrounding: true,
    dynamicRetrievalConfig: {
      mode: "MODE_DYNAMIC",
      dynamicThreshold: 0.5,
    },
  });

  console.log("Generating questions for profile:", profile);

  const response = await generateText({
    model,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: JSON.stringify(profile),
      },
    ],
  });

  if (!response) {
    throw new Error("Failed to generate questions");
  }

  console.log("Response received:", response.text);

  const xml = response.text;

  const xmlMatch = /<questions[\s\S]*<\/questions>/.exec(xml);
  if (!xmlMatch) {
    throw new Error("No valid XML found in the response.");
  }

  const xmlString = xmlMatch[0];

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "application/xml");

  // Check for parsing errors
  const parseError = xmlDoc.getElementsByTagName("parsererror")[0];
  if (parseError) {
    throw new Error("Error parsing XML: " + parseError.textContent);
  }

  // Helper function to get text content of an element
  const getTextContent = (parent: Element, tag: string): string | undefined => {
    const element = parent.getElementsByTagName(tag)[0];
    return element ? (element.textContent ?? undefined) : undefined;
  };

  const root = xmlDoc.getElementsByTagName("questions")[0];
  if (!root) {
    throw new Error("No <resume> element found in the XML.");
  }

  const questions: {
    text: string;
    type: "MULTIPLE_CHOICE" | "TRUE_FALSE";
    answer?: boolean;
    maxScore: number;
    timeLimit?: number;
    options?: { label: string; isCorrect: boolean }[];
  }[] = [];

  const questionElements = root.getElementsByTagName("question");
  for (let i = 0; i < questionElements.length; i++) {
    const questionElement = questionElements[i]!;
    const text = getTextContent(questionElement, "text");
    const type = getTextContent(questionElement, "type");
    const maxScore = parseInt(
      getTextContent(questionElement, "maxScore") ?? "0",
      10,
    );
    const timeLimit =
      parseInt(getTextContent(questionElement, "timeLimit") ?? "0", 10) ||
      undefined;

    if (!text || !type) {
      throw new Error("Invalid question format");
    }

    const options: { label: string; isCorrect: boolean }[] | undefined =
      type === "MULTIPLE_CHOICE"
        ? Array.from(questionElement.getElementsByTagName("option")).map(
            (option) => ({
              label: getTextContent(option, "label") ?? "",
              isCorrect:
                option.getElementsByTagName("isCorrect")[0]!.textContent ===
                "true",
            }),
          )
        : undefined;

    const answer =
      type === "TRUE_FALSE"
        ? questionElement
            .getElementsByTagName("answer")[0]
            ?.textContent?.toLowerCase() === "true"
        : undefined;

    questions.push({
      text,
      type: type as "MULTIPLE_CHOICE" | "TRUE_FALSE",
      answer,
      maxScore,
      timeLimit,
      options,
    });
  }

  return questions;
}
