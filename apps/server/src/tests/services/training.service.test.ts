import { describe, it, expect, beforeEach, vi } from "vitest";
import { TrainingService } from "../../services/training.service";

vi.mock("../../db", () => ({
  db: {
    query: {
      trainingCourses: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      courseEnrollments: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      courseAssessments: {
        findFirst: vi.fn(),
      },
      assessmentSubmissions: {
        findMany: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(),
        })),
      })),
    })),
  },
}));

describe("TrainingService", () => {
  let service: TrainingService;

  beforeEach(() => {
    service = new TrainingService();
    vi.clearAllMocks();
  });

  describe("enrollCourse", () => {
    it("should enroll user in course", async () => {
      const userId = "user-123";
      const courseId = "course-123";

      const { db } = await import("../../db");
      vi.mocked(db.query.courseEnrollments.findFirst).mockResolvedValue(undefined);

      const mockInsert = vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([
            {
              id: "enrollment-123",
              courseId,
              userId,
              status: "not_started",
              progressPercent: 0,
            },
          ]),
        })),
      }));
      vi.mocked(db.insert).mockImplementation(mockInsert as any);

      const result = await service.enrollCourse(userId, { courseId });

      expect(result.userId).toBe(userId);
      expect(result.courseId).toBe(courseId);
      expect(result.status).toBe("not_started");
    });

    it("should return existing enrollment if already enrolled", async () => {
      const existingEnrollment = {
        id: "enrollment-123",
        courseId: "course-123",
        userId: "user-123",
        status: "in_progress",
      };

      const { db } = await import("../../db");
      vi.mocked(db.query.courseEnrollments.findFirst).mockResolvedValue(
        existingEnrollment as any
      );

      const result = await service.enrollCourse("user-123", { courseId: "course-123" });

      expect(result).toEqual(existingEnrollment);
    });
  });

  describe("submitAssessment", () => {
    it("should submit assessment and mark course complete if passed", async () => {
      const userId = "user-123";
      const input = {
        assessmentId: "assessment-123",
        answers: [
          { questionId: "q1", answer: "Answer 1" },
          { questionId: "q2", answer: "Answer 2" },
        ],
      };

      const mockAssessment = {
        id: "assessment-123",
        courseId: "course-123",
        passingScore: 70,
      };

      const { db } = await import("../../db");
      vi.mocked(db.query.courseAssessments.findFirst).mockResolvedValue(
        mockAssessment as any
      );

      const mockInsert = vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([
            {
              id: "submission-123",
              assessmentId: input.assessmentId,
              userId,
              answers: input.answers,
              attemptNumber: 1,
            },
          ]),
        })),
      }));
      vi.mocked(db.insert).mockImplementation(mockInsert as any);

      const mockUpdate = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([
              {
                id: "submission-123",
                score: 75,
                passed: true,
              },
            ]),
          })),
        })),
      }));
      vi.mocked(db.update).mockImplementation(mockUpdate as any);

      const result = await service.submitAssessment(userId, input);

      expect(result.score).toBe(75);
      expect(result.passed).toBe(true);
    });

    it("should throw error if assessment not found", async () => {
      const { db } = await import("../../db");
      vi.mocked(db.query.courseAssessments.findFirst).mockResolvedValue(undefined);

      await expect(
        service.submitAssessment("user-123", {} as any)
      ).rejects.toThrow("Assessment not found");
    });
  });

  describe("listCourses", () => {
    it("should return all published courses", async () => {
      const mockCourses = [
        { id: "course-1", title: "Course 1", published: true },
        { id: "course-2", title: "Course 2", published: true },
      ];

      const { db } = await import("../../db");
      vi.mocked(db.query.trainingCourses.findMany).mockResolvedValue(mockCourses as any);

      const result = await service.listCourses();

      expect(result).toHaveLength(2);
    });
  });
});
