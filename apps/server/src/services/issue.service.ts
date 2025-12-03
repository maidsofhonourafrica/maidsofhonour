import { db } from "../db";
import { complaints, placements, clients, serviceProviders } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";
import type { ReportIssueInput } from "../validation/issue.schemas";

/**
 * Issue Service
 * Handles dispute and problem reporting
 */
export class IssueService {
  /**
   * Report issue
   */
  async reportIssue(userId: string, input: ReportIssueInput) {
    // Determine reporter type and ID
    const client = await db.query.clients.findFirst({
      where: eq(clients.userId, userId),
    });

    const sp = await db.query.serviceProviders.findFirst({
      where: eq(serviceProviders.userId, userId),
    });

    if (!client && !sp) {
      throw new Error("Profile not found");
    }

    // Map priority to severity (urgent -> critical, rest stays same)
    const severity = input.priority === "urgent" ? "critical" : input.priority as "low" | "medium" | "high";

    // Create issue
    const [issue] = await db
      .insert(complaints)
      .values({
        placementId: input.placementId,
        reporterId: userId,
        reporterType: client ? "client" : "service_provider",
        complaintType: input.issueType as any, // Type mapping handled by validation
        severity,
        title: `${input.issueType.replace(/_/g, ' ')} - ${input.description.substring(0, 50)}`,
        description: input.description,
        evidenceUrls: input.evidenceUrls,
        status: "open",
      })
      .returning();

    return issue;
  }

  /**
   * Get my issues
   */
  async getMyIssues(userId: string) {
    return db.query.complaints.findMany({
      where: eq(complaints.reporterId, userId),
      orderBy: [desc(complaints.createdAt)],
      with: {
        placement: true,
      },
    });
  }

  /**
   * Get issue details
   */
  async getIssueDetails(issueId: string, userId: string) {
    const issue = await db.query.complaints.findFirst({
      where: eq(complaints.id, issueId),
      with: {
        placement: {
          with: {
            client: { with: { user: true } },
            serviceProvider: { with: { user: true } },
          },
        },
      },
    });

    if (!issue) {
      throw new Error("Issue not found");
    }

    // Verify user has access
    const hasAccess =
      issue.reporterId === userId ||
      issue.placement?.client?.userId === userId ||
      issue.placement?.serviceProvider?.userId === userId;

    if (!hasAccess) {
      throw new Error("Unauthorized");
    }

    return issue;
  }
}
