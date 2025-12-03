import { describe, it, expect, beforeEach, vi } from "vitest";
import { CertificateService } from "../../services/certificate.service";

vi.mock("../../db", () => ({
  db: {
    query: {
      courseEnrollments: {
        findFirst: vi.fn(),
      },
      certifications: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      serviceProviders: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(),
      })),
    })),
  },
}));

describe("CertificateService", () => {
  let service: CertificateService;

  beforeEach(() => {
    service = new CertificateService();
    vi.clearAllMocks();
  });

  describe("generateCertificate", () => {
    it("should generate certificate for completed course", async () => {
      const userId = "user-123";
      const courseId = "course-123";

      const mockEnrollment = {
        id: "enrollment-123",
        userId,
        courseId,
        passed: true,
        course: { id: courseId, title: "Test Course" },
      };

      const { db } = await import("../../db");
      vi.mocked(db.query.serviceProviders.findFirst).mockResolvedValue({ id: "sp-123" } as any);
      vi.mocked(db.query.courseEnrollments.findFirst).mockResolvedValue(
        mockEnrollment as any
      );
      vi.mocked(db.query.certifications.findFirst).mockResolvedValue(undefined);

      const mockInsert = vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([
            {
              id: "cert-123",
              serviceProviderId: "sp-123",
              courseId,
              certificateNumber: "MOH-123456",
            },
          ]),
        })),
      }));
      vi.mocked(db.insert).mockImplementation(mockInsert as any);

      const result = await service.generateCertificate(userId, courseId);

      expect(result.serviceProviderId).toBe("sp-123");
      expect(result.courseId).toBe(courseId);
      expect(result.certificateNumber).toContain("MOH-");
    });

    it("should return existing certificate if already generated", async () => {
      const existingCertificate = {
        id: "cert-123",
        userId: "user-123",
        courseId: "course-123",
        certificateNumber: "MOH-123-456",
      };

      const mockEnrollment = {
        userId: "user-123",
        courseId: "course-123",
        passed: true,
      };

      const { db } = await import("../../db");
      vi.mocked(db.query.serviceProviders.findFirst).mockResolvedValue({ id: "sp-123" } as any);
      vi.mocked(db.query.courseEnrollments.findFirst).mockResolvedValue(
        mockEnrollment as any
      );
      vi.mocked(db.query.certifications.findFirst).mockResolvedValue(
        existingCertificate as any
      );

      const result = await service.generateCertificate("user-123", "course-123");

      expect(result).toEqual(existingCertificate);
    });

    it("should throw error if course not completed", async () => {
      const mockEnrollment = {
        userId: "user-123",
        courseId: "course-123",
        passed: false,
      };

      const { db } = await import("../../db");
      vi.mocked(db.query.serviceProviders.findFirst).mockResolvedValue({ id: "sp-123" } as any);
      vi.mocked(db.query.courseEnrollments.findFirst).mockResolvedValue(
        mockEnrollment as any
      );

      await expect(
        service.generateCertificate("user-123", "course-123")
      ).rejects.toThrow("Course not completed or not passed");
    });
  });

  describe("verifyCertificate", () => {
    it("should verify valid certificate", async () => {
      const mockCertificate = {
        id: "cert-123",
        certificateNumber: "MOH-123-456",
        user: { id: "user-123", email: "test@example.com" },
        course: { id: "course-123", title: "Test Course" },
      };

      const { db } = await import("../../db");
      vi.mocked(db.query.certifications.findFirst).mockResolvedValue(mockCertificate as any);

      const result = await service.verifyCertificate("MOH-123-456");

      expect(result.valid).toBe(true);
      expect(result.certificate).toEqual(mockCertificate);
      expect(result.message).toBe("Certificate is valid");
    });

    it("should return invalid for non-existent certificate", async () => {
      const { db } = await import("../../db");
      vi.mocked(db.query.certifications.findFirst).mockResolvedValue(undefined);

      const result = await service.verifyCertificate("INVALID-123");

      expect(result.valid).toBe(false);
      expect(result.message).toBe("Certificate not found");
    });
  });
});
