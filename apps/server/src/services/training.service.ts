import { db } from "../db";
import { trainingCourses, courseEnrollments, courseMaterials, courseAssessments, assessmentSubmissions, certifications } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";
import type { EnrollCourseInput, SubmitAssessmentInput } from "../validation/training.schemas";

/**
 * Training Service
 * Handles course enrollment, progress tracking, assessments
 */
export class TrainingService {
  /**
   * List all courses
   */
  async listCourses() {
    return db.query.trainingCourses.findMany({
      where: eq(trainingCourses.published, true),
      orderBy: [desc(trainingCourses.displayOrder)],
      with: {
        category: true,
      },
    });
  }

  /**
   * Get course details
   */
  async getCourseDetails(courseId: string) {
    const course = await db.query.trainingCourses.findFirst({
      where: eq(trainingCourses.id, courseId),
      with: {
        category: true,
        materials: {
          orderBy: [desc(courseMaterials.orderIndex)],
        },
      },
    });

    if (!course) {
      throw new Error("Course not found");
    }

    return course;
  }

  /**
   * Enroll in course
   */
  async enrollCourse(userId: string, input: EnrollCourseInput) {
    // Check if already enrolled
    const existing = await db.query.courseEnrollments.findFirst({
      where: and(
        eq(courseEnrollments.courseId, input.courseId),
        eq(courseEnrollments.userId, userId)
      ),
    });

    if (existing) {
      return existing;
    }

    // Create enrollment
    const [enrollment] = await db
      .insert(courseEnrollments)
      .values({
        courseId: input.courseId,
        userId,
        status: "not_started",
        progressPercent: 0,
      })
      .returning();

    return enrollment;
  }

  /**
   * Get my courses
   */
  async getMyCourses(userId: string) {
    return db.query.courseEnrollments.findMany({
      where: eq(courseEnrollments.userId, userId),
      orderBy: [desc(courseEnrollments.enrolledAt)],
      with: {
        course: {
          with: {
            category: true,
          },
        },
      },
    });
  }

  /**
   * Get enrollment progress
   */
  async getProgress(userId: string, courseId: string) {
    const enrollment = await db.query.courseEnrollments.findFirst({
      where: and(
        eq(courseEnrollments.courseId, courseId),
        eq(courseEnrollments.userId, userId)
      ),
      with: {
        course: {
          with: {
            materials: true,
          },
        },
      },
    });

    if (!enrollment) {
      throw new Error("Not enrolled in this course");
    }

    return enrollment;
  }

  /**
   * Update progress
   */
  async updateProgress(userId: string, courseId: string, materialId: string, watchedSeconds: number) {
    const enrollment = await db.query.courseEnrollments.findFirst({
      where: and(
        eq(courseEnrollments.courseId, courseId),
        eq(courseEnrollments.userId, userId)
      ),
    });

    if (!enrollment) {
      throw new Error("Not enrolled");
    }

    // Update enrollment
    const [updated] = await db
      .update(courseEnrollments)
      .set({
        currentMaterialId: materialId,
        lastWatchedPositionSeconds: watchedSeconds,
        totalWatchTimeSeconds: (enrollment.totalWatchTimeSeconds || 0) + watchedSeconds,
        updatedAt: new Date(),
      })
      .where(eq(courseEnrollments.id, enrollment.id))
      .returning();

    return updated;
  }

  /**
   * Get course assessment
   */
  async getAssessment(courseId: string) {
    return db.query.courseAssessments.findFirst({
      where: eq(courseAssessments.courseId, courseId),
    });
  }

  /**
   * Submit assessment
   */
  async submitAssessment(userId: string, input: SubmitAssessmentInput) {
    const assessment = await db.query.courseAssessments.findFirst({
      where: eq(courseAssessments.id, input.assessmentId),
    });

    if (!assessment) {
      throw new Error("Assessment not found");
    }

    // Create submission
    const [submission] = await db
      .insert(assessmentSubmissions)
      .values({
        assessmentId: input.assessmentId,
        userId,
        answers: input.answers,
        attemptNumber: 1, // TODO: Track attempt number
      })
      .returning();

    // Auto-grade if possible (simple implementation)
    const score = 75; // TODO: Implement actual grading
    const passed = score >= (assessment.passingScore || 70);

    // Update submission with score
    const [graded] = await db
      .update(assessmentSubmissions)
      .set({
        score,
        passed,
        evaluatedAt: new Date(),
      })
      .where(eq(assessmentSubmissions.id, submission.id))
      .returning();

    // If passed, mark course as completed
    if (passed) {
      await db
        .update(courseEnrollments)
        .set({
          status: "completed",
          completedAt: new Date(),
          passed: true,
          finalScore: score,
        })
        .where(and(
          eq(courseEnrollments.courseId, assessment.courseId),
          eq(courseEnrollments.userId, userId)
        ));
    }

    return graded;
  }

  /**
   * Get assessment results
   */
  async getAssessmentResults(userId: string, assessmentId: string) {
    return db.query.assessmentSubmissions.findMany({
      where: and(
        eq(assessmentSubmissions.assessmentId, assessmentId),
        eq(assessmentSubmissions.userId, userId)
      ),
      orderBy: [desc(assessmentSubmissions.submittedAt)],
    });
  }
}
