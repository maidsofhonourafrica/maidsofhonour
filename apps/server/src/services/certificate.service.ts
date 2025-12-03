import { db } from "../db";
import { certifications, courseEnrollments, serviceProviders } from "../db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Certificate Service
 * Handles certificate generation and verification
 */
export class CertificateService {
  /**
   * Generate certificate after course completion
   */
  async generateCertificate(userId: string, courseId: string) {
    // Get service provider ID
    const sp = await db.query.serviceProviders.findFirst({
      where: eq(serviceProviders.userId, userId),
    });

    if (!sp) {
      throw new Error("Service provider not found");
    }

    // Verify course completion
    const enrollment = await db.query.courseEnrollments.findFirst({
      where: and(
        eq(courseEnrollments.courseId, courseId),
        eq(courseEnrollments.userId, userId)
      ),
      with: {
        course: true,
      },
    });

    if (!enrollment || !enrollment.passed) {
      throw new Error("Course not completed or not passed");
    }

    // Check if certificate already exists
    const existing = await db.query.certifications.findFirst({
      where: and(
        eq(certifications.serviceProviderId, sp.id),
        eq(certifications.courseId, courseId)
      ),
    });

    if (existing) {
      return existing;
    }

    // Generate unique identifiers
    const certificateNumber = `MOH-${Date.now()}-${userId.slice(0, 8)}`;
    const verificationCode = `VERIFY-${Math.random().toString(36).substring(2, 15)}`;
    const qrCodeData = JSON.stringify({ certificateNumber, verificationCode, courseId });

    // Create certificate
    const [certificate] = await db
      .insert(certifications)
      .values({
        serviceProviderId: sp.id,
        courseId,
        certificateNumber,
        certificateType: "course_completion",
        title: `Certificate of Completion - ${enrollment.course?.title || "Course"}`,
        certificatePdfUrl: `/certificates/${certificateNumber}.pdf`, // Placeholder - generate actual PDF
        qrCodeData,
        verificationCode,
        issuedAt: new Date(),
      })
      .returning();

    return certificate;
  }

  /**
   * List my certificates
   */
  async getMyCertificates(userId: string) {
    // Get service provider ID
    const sp = await db.query.serviceProviders.findFirst({
      where: eq(serviceProviders.userId, userId),
    });

    if (!sp) {
      return [];
    }

    return db.query.certifications.findMany({
      where: eq(certifications.serviceProviderId, sp.id),
      with: {
        course: true,
      },
    });
  }

  /**
   * Verify certificate
   */
  async verifyCertificate(certificateNumber: string) {
    const certificate = await db.query.certifications.findFirst({
      where: eq(certifications.certificateNumber, certificateNumber),
      with: {
        serviceProvider: true,
        course: true,
      },
    });

    if (!certificate) {
      return { valid: false, message: "Certificate not found" };
    }

    return {
      valid: true,
      certificate,
      message: "Certificate is valid",
    };
  }

  /**
   * Get certificate details
   */
  async getCertificateDetails(certificateId: string, userId: string) {
    // Get service provider ID
    const sp = await db.query.serviceProviders.findFirst({
      where: eq(serviceProviders.userId, userId),
    });

    if (!sp) {
      throw new Error("Service provider not found");
    }

    const certificate = await db.query.certifications.findFirst({
      where: and(
        eq(certifications.id, certificateId),
        eq(certifications.serviceProviderId, sp.id)
      ),
      with: {
        course: true,
      },
    });

    if (!certificate) {
      throw new Error("Certificate not found");
    }

    return certificate;
  }
}
