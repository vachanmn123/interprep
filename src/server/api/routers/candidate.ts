import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { parseResumeFromFile, type Resume } from "@/lib/resumeTools";
import { generateQuestions } from "@/lib/questionGenerator";
import { sendEmail } from "@/lib/nodemailer";
import { SignJWT } from "jose";
import { env } from "@/env";

export const candidateRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    try {
      const candidates = await ctx.db.candidate.findMany();
      if (!candidates) {
        throw new Error("No candidates found");
      }
      return candidates;
    } catch (error) {
      console.error("Error fetching candidates:", error);
      throw new Error("Failed to fetch candidates");
    }
  }),

  addCandidate: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Invalid email format"),
        fileKey: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { name, email, fileKey } = input;

        const resumeData = await parseResumeFromFile(fileKey);
        if (!resumeData) {
          throw new Error("Failed to parse resume data");
        }
        await ctx.db.candidate.create({
          data: {
            name,
            email,
            resumeKey: fileKey,
            resumeData: JSON.stringify(resumeData),
          },
        });
        return { message: "Candidate added successfully" };
      } catch (error) {
        console.error("Error adding candidate:", error);
        throw new Error("Failed to add candidate");
      }
    }),

  getCandidate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const candidate = await ctx.db.candidate.findUnique({
          where: { id: input.id },
          include: {
            tests: {
              include: {
                questions: { select: { id: true } },
              },
            },
            testAttempts: {
              include: {
                test: {
                  include: {
                    questions: { include: { _count: true } },
                  },
                },
              },
            },
          },
        });
        if (!candidate) {
          throw new Error("Candidate not found");
        }
        return candidate;
      } catch (error) {
        console.error("Error fetching candidate:", error);
        throw new Error("Failed to fetch candidate");
      }
    }),

  generateCandidateTest: protectedProcedure
    .input(z.object({ id: z.string(), testType: z.enum(["HR", "Technical"]) }))
    .query(async ({ ctx, input }) => {
      const { id, testType } = input;
      const candidate = await ctx.db.candidate.findUnique({
        where: { id },
      });

      const resumeData: Resume = JSON.parse(
        candidate?.resumeData ?? "",
      ) as Resume;

      if (!resumeData) {
        throw new Error("Resume data not found");
      }

      const questions = await generateQuestions(testType, resumeData);
      if (!questions) {
        throw new Error("Failed to generate questions");
      }
      return questions;
    }),

  createCandidateTest: protectedProcedure
    .input(
      z.object({
        candidateId: z.string(),
        testType: z.enum(["HR", "Technical"]),
        testTitle: z.string(),
        expiryDate: z.date(),
        questions: z.array(
          z.object({
            text: z.string(),
            type: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE"]),
            answer: z.boolean().optional(),
            maxScore: z.number().min(1).max(5),
            timeLimit: z.number().optional(),
            options: z
              .array(
                z.object({
                  label: z.string(),
                  isCorrect: z.boolean(),
                }),
              )
              .optional(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { candidateId, testType, testTitle, expiryDate, questions } = input;

      const test = await ctx.db.test.create({
        data: {
          candidateId,
          type: testType === "HR" ? "HR" : "TECHNICAL",
          title: testTitle,
          expiresAt: expiryDate,
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      questions.forEach(async (question) => {
        // Create each question in the database
        await ctx.db.question.create({
          data: {
            testId: test.id,
            text: question.text,
            type: question.type,
            answer: question.answer,
            maxScore: question.maxScore,
            timeLimit: question.timeLimit,
            options: question.options
              ? {
                  createMany: {
                    data: question.options?.map((option) => ({
                      label: option.label,
                      isCorrect: option.isCorrect,
                    })),
                  },
                }
              : undefined,
          },
        });
      });

      const candidate = await ctx.db.candidate.findUnique({
        where: { id: candidateId },
      });
      if (!candidate) {
        throw new Error("Candidate not found");
      }

      // Generate a JWT token for the candidate with the test ID and candidate ID
      const cred = await new SignJWT({
        testId: test.id,
        candidateId: candidate.id,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(expiryDate)
        .sign(new TextEncoder().encode(env.AUTH_SECRET));

      const testLink = `${process.env.NEXT_PUBLIC_APP_URL}/test/${test.id}?cred=${encodeURIComponent(
        cred,
      )}`;

      const emailHTML = `
      <!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You've been assigned a test on Interprep!</title>
    <style>
        body {
            font-family: sans-serif;
            line-height: 1.6;
            color: #333333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eeeeee;
        }
        .header h1 {
            margin: 0;
            color: #333333;
            font-size: 24px;
        }
        .content {
            margin-bottom: 20px;
        }
        .test-details {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
            border: 1px solid #eeeeee;
        }
        .test-details p {
            margin: 5px 0;
        }
        .button-container {
            text-align: center;
            margin-top: 25px;
        }
        .button {
            display: inline-block;
            background-color: #007bff; /* Button background color */
            color: #ffffff !important; /* Button text color */
            padding: 12px 25px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #eeeeee;
            font-size: 12px;
            color: #888888;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Test Assigned on Interprep!</h1>
        </div>
        <div class="content">
            <p>Hi ${candidate.name},</p>
            <p>You have been assigned a new test on the Interprep platform.</p>

            <div class="test-details">
                <p><strong>Test Title:</strong> ${test.title}</p>
                <p><strong>Test Type:</strong> ${test.type.toLowerCase()}</p>
                <p><strong>Number of Questions:</strong> ${questions.length}</p>
                <p><strong>Expires On:</strong> ${test.expiresAt.toLocaleDateString()}</p>
            </div>

            <p>Please click the button below to start your test.</p>

            <div class="button-container">
                <a href="${testLink}" class="button" target="_blank">Go to Test</a>
            </div>

            <p>Good luck!</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Interprep. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
      `;

      await sendEmail({
        to: candidate.email,
        subject: `You have a new ${testType} test`,
        text: `You have a new ${testType} test`,
        html: emailHTML,
      });

      return { message: "Test created successfully" };
    }),
});
