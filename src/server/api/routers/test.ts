import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "@/server/api/trpc";
import { AttemptStatus, TestType } from "@prisma/client";
import { jwtVerify } from "jose";
import { env } from "@/env";

// Utility function to verify JWT token and extract candidate/test info
async function verifyCredential(credentialToken: string) {
  try {
    const { payload } = await jwtVerify(
      credentialToken,
      new TextEncoder().encode(env.AUTH_SECRET),
    );

    const candidateId = payload.candidateId as string;
    const testId = payload.testId as string;

    if (!candidateId || !testId) {
      throw new Error("Missing required fields in token");
    }

    return {
      candidateId,
      testId,
    };
  } catch {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid or expired credential token",
    });
  }
}

export const testRouter = createTRPCRouter({
  // Get a test by credential token
  getByCredential: publicProcedure
    .input(z.object({ credentialToken: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify and decode the JWT credential token
      const { candidateId, testId } = await verifyCredential(
        input.credentialToken,
      );

      const candidate = await ctx.db.candidate.findFirst({
        where: { id: candidateId },
      });

      if (!candidate) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Candidate not found",
        });
      }

      const test = await ctx.db.test.findFirst({
        where: {
          id: testId,
          candidateId: candidate.id,
        },
        include: {
          questions: {
            include: {
              options: true,
            },
          },
        },
      });

      if (!test) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No active test found for this credential",
        });
      }

      // If there is already a test attempt that is completed, throw an error
      const existingAttempt = await ctx.db.testAttempt.findFirst({
        where: {
          testId: test.id,
          candidateId: candidate.id,
          status: AttemptStatus.SUBMITTED,
        },
      });
      if (existingAttempt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You already have a completed test attempt for this test",
        });
      }

      return { test };
    }),

  // Start a test attempt
  startAttempt: publicProcedure
    .input(
      z.object({
        testId: z.string(),
        credentialToken: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify and decode the JWT credential token
      const { candidateId } = await verifyCredential(input.credentialToken);

      const candidate = await ctx.db.candidate.findFirst({
        where: { id: candidateId },
      });

      if (!candidate) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid candidate",
        });
      }

      // Check if the test exists and belongs to this candidate
      const test = await ctx.db.test.findFirst({
        where: {
          id: input.testId,
          candidateId: candidate.id,
        },
      });

      if (!test) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Test not found or expired",
        });
      }

      // Check if the test has expired
      if (test.expiresAt && new Date(test.expiresAt) < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Test has expired",
        });
      }

      // Check if there's already an in-progress attempt
      const existingAttempt = await ctx.db.testAttempt.findFirst({
        where: {
          testId: input.testId,
          candidateId: candidate.id,
          status: AttemptStatus.IN_PROGRESS,
        },
      });

      if (existingAttempt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You already have test attempt for this test",
        });
      }

      // Create a new attempt
      const attempt = await ctx.db.testAttempt.create({
        data: {
          testId: input.testId,
          candidateId: candidate.id,
          status: AttemptStatus.IN_PROGRESS,
        },
      });

      return { attempt };
    }),

  // Complete a test attempt
  completeAttempt: publicProcedure
    .input(
      z.object({
        attemptId: z.string(),
        answers: z.record(
          z.object({
            response: z
              .union([
                z.string(),
                z.number(),
                z.boolean(),
                z.array(z.string()),
                z.null(),
              ])
              .nullable(),
            timeTaken: z.number(),
          }),
        ),
        credentialToken: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify and decode the JWT credential token
      const { candidateId } = await verifyCredential(input.credentialToken);

      const candidate = await ctx.db.candidate.findFirst({
        where: { id: candidateId },
      });

      if (!candidate) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid candidate",
        });
      }

      // Get the attempt
      const attempt = await ctx.db.testAttempt.findFirst({
        where: {
          id: input.attemptId,
          candidateId: candidate.id,
        },
        include: {
          test: {
            include: {
              questions: {
                include: {
                  options: true,
                },
              },
            },
          },
        },
      });

      if (!attempt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Test attempt not found",
        });
      }

      if (attempt.status !== AttemptStatus.IN_PROGRESS) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Test attempt is already completed",
        });
      }

      console.log("Attempt questions:", JSON.stringify(input));

      // Process and save answers
      const answerPromises = Object.entries(input.answers).map(
        async ([questionId, answerData]) => {
          const question = attempt.test.questions.find(
            (q) => q.id === questionId,
          );

          if (!question) return null;

          let isCorrect = false;
          let score = 0;

          // Process different question types
          if (
            question.type === "MULTIPLE_CHOICE" &&
            Array.isArray(answerData.response)
          ) {
            const selectedIds = answerData.response;

            // Check if selected options match correct options
            const correctOptions = question.options.filter((o) => o.isCorrect);
            const correctOptionIds = correctOptions.map((o) => o.id);

            if (
              selectedIds.length === correctOptionIds.length &&
              selectedIds.every((id) => correctOptionIds.includes(id))
            ) {
              isCorrect = true;
              score = question.maxScore;
            }

            return ctx.db.testAttemptAnswer.create({
              data: {
                testAttemptId: attempt.id,
                questionId,
                selectedOptionIds: selectedIds, // Convert array to JSON as per schema
                isCorrect,
                score,
                timeTaken: answerData.timeTaken,
              },
            });
          } else if (
            question.type === "TRUE_FALSE" &&
            typeof answerData.response === "boolean"
          ) {
            isCorrect = answerData.response === question.answer;
            score = isCorrect ? question.maxScore : 0;

            return ctx.db.testAttemptAnswer.create({
              data: {
                testAttemptId: attempt.id,
                questionId,
                response: answerData.response.toString(),
                isCorrect,
                score,
                timeTaken: answerData.timeTaken,
              },
            });
          } else if (
            (question.type === "SHORT_ANSWER" ||
              question.type === "LONG_ANSWER") &&
            typeof answerData.response === "string"
          ) {
            // For text answers, we don't auto-grade
            return ctx.db.testAttemptAnswer.create({
              data: {
                testAttemptId: attempt.id,
                questionId,
                response: answerData.response,
                isCorrect: false, // Will need manual evaluation
                score: 0, // Initial score is 0
                timeTaken: answerData.timeTaken,
              },
            });
          }

          return null;
        },
      );

      await Promise.all(answerPromises.filter(Boolean));

      // Calculate the total score for auto-graded questions
      const answers = await ctx.db.testAttemptAnswer.findMany({
        where: { testAttemptId: attempt.id },
      });

      const totalScore = answers.reduce((sum, answer) => sum + answer.score, 0);

      // Update the attempt status
      const updatedAttempt = await ctx.db.testAttempt.update({
        where: { id: attempt.id },
        data: {
          status: AttemptStatus.SUBMITTED,
          completedAt: new Date(),
          totalScore,
        },
      });

      return { success: true, attempt: updatedAttempt };
    }),

  // Fail a test attempt
  failAttempt: publicProcedure
    .input(
      z.object({
        attemptId: z.string(),
        reason: z.string(),
        credentialToken: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify and decode the JWT credential token
      const { candidateId } = await verifyCredential(input.credentialToken);

      const candidate = await ctx.db.candidate.findFirst({
        where: { id: candidateId },
      });

      if (!candidate) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid candidate",
        });
      }

      // Get the attempt
      const attempt = await ctx.db.testAttempt.findFirst({
        where: {
          id: input.attemptId,
          candidateId: candidate.id,
        },
      });

      if (!attempt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Test attempt not found",
        });
      }

      if (attempt.status !== AttemptStatus.IN_PROGRESS) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Test attempt is already completed",
        });
      }

      // Update the attempt status
      const updatedAttempt = await ctx.db.testAttempt.update({
        where: { id: attempt.id },
        data: {
          status: AttemptStatus.SUBMITTED,
          completedAt: new Date(),
          totalScore: 0, // Failed attempt gets 0 score
        },
      });

      // We could also store the reason in a separate table or as metadata

      return { success: true, attempt: updatedAttempt };
    }),

  getAll: protectedProcedure.query(({ ctx }) => {
    return ctx.db.test.findMany({
      orderBy: { id: "desc" },
      include: {
        candidate: true,
      },
    });
  }),
  
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.test.findUnique({
        where: { id: input.id },
        include: {
          questions: {
            include: {
              options: true,
            },
          },
          candidate: true,
          attempts: true,
        },
      });
    }),
  
  // Dashboard statistics
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    
    // Count active tests (not expired)
    const activeTests = await ctx.db.test.count({
      where: {
        expiresAt: {
          gt: now,
        },
      },
    });
    
    // Count tests with submitted attempts
    const testsWithSubmittedAttempts = await ctx.db.test.count({
      where: {
        attempts: {
          some: {
            status: AttemptStatus.SUBMITTED,
          },
        },
      },
    });
    
    // Count tests pending review (submitted but not evaluated)
    const pendingReviews = await ctx.db.test.count({
      where: {
        attempts: {
          some: {
            status: AttemptStatus.SUBMITTED,
          },
        },
      },
    });
    
    return {
      activeTests,
      completedTests: testsWithSubmittedAttempts,
      pendingReviews,
    };
  }),
  
  getRecent: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(5) }))
    .query(({ ctx, input }) => {
      return ctx.db.test.findMany({
        take: input.limit,
        orderBy: { id: "desc" },
        include: {
          candidate: true,
        },
      });
    }),

  // For creating tests - to be implemented
  createTest: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        type: z.nativeEnum(TestType),
        expiresAt: z.date(),
        candidateId: z.string(),
        questions: z.array(
          z.object({
            // Test creation logic would go here
          })
        ).optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      return ctx.db.test.create({
        data: {
          title: input.title,
          type: input.type,
          expiresAt: input.expiresAt,
          candidateId: input.candidateId,
        },
      });
    }),
});
