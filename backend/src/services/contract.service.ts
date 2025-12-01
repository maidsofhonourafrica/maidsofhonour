import { db } from "../db";
import {
  contracts,
  placements,
  contractTemplates,
  clients,
  serviceProviders,
} from "../db/schema";
import { eq, and, desc } from "drizzle-orm";
import type {
  GenerateContractInput,
  SignContractInput,
} from "../validation/contract.schemas";

/**
 * Contract Service
 * Handles contract generation, signing, and retrieval
 * Note: PDF generation happens CLIENT-SIDE
 */
export class ContractService {
  /**
   * Generate contract for placement
   */
  async generateContract(userId: string, input: GenerateContractInput) {
    // 1. Get placement
    const placement = await db.query.placements.findFirst({
      where: eq(placements.id, input.placementId),
      with: {
        client: { with: { user: true } },
        serviceProvider: { with: { user: true } },
      },
    });

    if (!placement) {
      throw new Error("Placement not found");
    }

    // Verify user is client or SP
    const isClient = placement.client?.userId === userId;
    const isSp = placement.serviceProvider?.userId === userId;

    if (!isClient && !isSp) {
      throw new Error("Unauthorized");
    }

    // 2. Check if contract already exists
    const existing = await db.query.contracts.findFirst({
      where: eq(contracts.placementId, input.placementId),
    });

    if (existing) {
      return existing;
    }

    // 3. Get contract template
    const template = await db.query.contractTemplates.findFirst({
      where: eq(contractTemplates.active, true),
      orderBy: [desc(contractTemplates.version)],
    });

    if (!template) {
      throw new Error("No contract template available");
    }

    // 4. Generate contract HTML (simple template substitution)
    const client = placement.client;
    const sp = placement.serviceProvider;
    const contractHtml = this.fillTemplate(template.templateHtml, {
      clientName: `${client?.firstName || ""} ${client?.lastName || ""}`,
      spName: `${sp?.firstName || "TBD"} ${sp?.lastName || ""}`,
      startDate: placement.startDate || "",
      endDate: placement.endDate || "",
      salary: placement.monthlySalary || "TBD",
      responsibilities: placement.expectationsResponsibilities || "As discussed",
      placementType: placement.placementType,
    });

    // 5. Create contract
    const [contract] = await db
      .insert(contracts)
      .values({
        placementId: placement.id,
        clientId: placement.clientId,
        serviceProviderId: placement.serviceProviderId!,
        contractTemplateId: template.id,
        contractHtml,
        startDate: placement.startDate || new Date().toISOString().split('T')[0],
        status: "pending_signatures",
      })
      .returning();

    return contract;
  }

  /**
   * List my contracts
   */
  async listContracts(userId: string, userType: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    if (userType === "client") {
      const client = await db.query.clients.findFirst({
        where: eq(clients.userId, userId),
      });

      if (!client) return [];

      return db.query.contracts.findMany({
        where: eq(contracts.clientId, client.id),
        orderBy: [desc(contracts.createdAt)],
        limit,
        offset,
        with: {
          placement: true,
          serviceProvider: true,
        },
      });
    } else if (userType === "service_provider") {
      const sp = await db.query.serviceProviders.findFirst({
        where: eq(serviceProviders.userId, userId),
      });

      if (!sp) return [];

      return db.query.contracts.findMany({
        where: eq(contracts.serviceProviderId, sp.id),
        orderBy: [desc(contracts.createdAt)],
        limit,
        offset,
        with: {
          placement: true,
          client: true,
        },
      });
    }

    return [];
  }

  /**
   * Get contract details
   */
  async getContractDetails(contractId: string, userId: string) {
    const contract = await db.query.contracts.findFirst({
      where: eq(contracts.id, contractId),
      with: {
        client: { with: { user: true } },
        serviceProvider: { with: { user: true } },
        placement: true,
      },
    });

    if (!contract) {
      throw new Error("Contract not found");
    }

    // Verify access
    const hasAccess =
      contract.client?.userId === userId ||
      contract.serviceProvider?.userId === userId;

    if (!hasAccess) {
      throw new Error("Unauthorized");
    }

    return contract;
  }

  /**
   * Sign contract (digital signature)
   */
  async signContract(
    contractId: string,
    userId: string,
    input: SignContractInput
  ) {
    const contract = await db.query.contracts.findFirst({
      where: eq(contracts.id, contractId),
      with: {
        client: { with: { user: true } },
        serviceProvider: { with: { user: true } },
      },
    });

    if (!contract) {
      throw new Error("Contract not found");
    }

    const isClient = contract.client?.userId === userId;
    const isSp = contract.serviceProvider?.userId === userId;

    if (!isClient && !isSp) {
      throw new Error("Unauthorized");
    }

    // Update signatures
    const updates: any = { updatedAt: new Date() };

    if (isClient) {
      updates.clientSignature = input.signature;
      updates.clientSignedAt = new Date();
    } else {
      updates.spSignature = input.signature;
      updates.spSignedAt = new Date();
    }

    // Check if both signed
    const bothSigned =
      (contract.clientSignedAt || isClient) &&
      (contract.spSignedAt || isSp);

    if (bothSigned) {
      updates.status = "active";
    }

    const [updated] = await db
      .update(contracts)
      .set(updates)
      .where(eq(contracts.id, contractId))
      .returning();

    return updated;
  }

  /**
   * Simple template filling (can be enhanced with LLM)
   */
  private fillTemplate(template: string, data: Record<string, string>): string {
    let filled = template;
    for (const [key, value] of Object.entries(data)) {
      filled = filled.replace(new RegExp(`{{${key}}}`, "g"), value);
    }
    return filled;
  }
}
