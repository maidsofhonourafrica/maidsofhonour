import { db } from "../db";
import { serviceCategories } from "../db/schema";
import { eq } from "drizzle-orm";

/**
 * Utility Service
 * Handles utility endpoints like categories, locations, health check
 */
export class UtilityService {
  /**
   * List all service categories
   */
  async listCategories() {
    return db.query.serviceCategories.findMany({
      where: eq(serviceCategories.active, true),
    });
  }

  /**
   * Get Kenya counties list
   */
  getCounties() {
    return [
      "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret",
      "Thika", "Malindi", "Kitale", "Garissa", "Kakamega",
      "Machakos", "Meru", "Nyeri", "Kiambu", "Kajiado",
      "Kilifi", "Kericho", "Bungoma", "Naivasha", "Voi",
      "Homa Bay", "Migori", "Kisii", "Embu", "Murang'a",
      "Isiolo", "Lamu", "Wajir", "Mandera", "Marsabit",
      "Samburu", "Tana River", "Taita-Taveta", "Kwale", "Baringo",
      "Bomet", "Busia", "Elgeyo-Marakwet", "Kirinyaga", "Laikipia",
      "Makueni", "Nandi", "Narok", "Nyandarua", "Nyamira",
      "Siaya", "Trans-Nzoia", "Turkana", "Uasin Gishu", "Vihiga",
      "Wajir", "West Pokot"
    ].sort();
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      // Test database connection
      await db.query.users.findFirst();

      return {
        status: "healthy",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        database: "connected",
      };
    } catch (error) {
      return {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get upload URL for S3 (placeholder - needs AWS SDK)
   */
  async getUploadUrl(fileName: string, fileType: string) {
    // TODO: Implement S3 presigned URL generation
    // For now, return a placeholder
    return {
      uploadUrl: `https://s3.amazonaws.com/placeholder/${fileName}`,
      fileUrl: `https://cdn.maidsofhonour.com/${fileName}`,
      expiresIn: 3600,
    };
  }
}
