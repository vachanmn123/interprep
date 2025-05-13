import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { parseResumeFromFile } from "@/lib/resumeTools";

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
                questions: { include: { _count: true } },
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
});
