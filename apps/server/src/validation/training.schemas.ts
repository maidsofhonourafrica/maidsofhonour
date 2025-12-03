import { z } from 'zod/v4';

/**
 * Enroll in Course Schema
 */
export const enrollCourseSchema = z.object({
  courseId: z.string().uuid(),
});

/**
 * Submit Assessment Schema
 */
export const submitAssessmentSchema = z.object({
  assessmentId: z.string().uuid(),
  answers: z.array(
    z.object({
      questionId: z.string(),
      answer: z.string(),
    })
  ),
});

export type EnrollCourseInput = z.infer<typeof enrollCourseSchema>;
export type SubmitAssessmentInput = z.infer<typeof submitAssessmentSchema>;
