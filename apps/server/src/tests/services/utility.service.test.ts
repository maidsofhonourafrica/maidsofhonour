import { describe, it, expect, beforeEach } from "vitest";
import { UtilityService } from "../../services/utility.service";

describe("UtilityService", () => {
  let service: UtilityService;

  beforeEach(() => {
    service = new UtilityService();
  });

  describe("getCounties", () => {
    it("should return list of Kenya counties", () => {
      const result = service.getCounties();

      expect(result).toBeInstanceOf(Array);
      expect(result).toContain("Nairobi");
      expect(result).toContain("Mombasa");
      expect(result).toContain("Kisumu");
      expect(result.length).toBeGreaterThan(40);
    });

    it("should return sorted counties", () => {
      const result = service.getCounties();

      const sorted = [...result].sort();
      expect(result).toEqual(sorted);
    });
  });

  describe("getUploadUrl", () => {
    it("should return upload URL for S3", async () => {
      const fileName = "test-image.jpg";
      const fileType = "image/jpeg";

      const result = await service.getUploadUrl(fileName, fileType);

      expect(result).toHaveProperty("uploadUrl");
      expect(result).toHaveProperty("fileUrl");
      expect(result).toHaveProperty("expiresIn");
      expect(result.uploadUrl).toContain(fileName);
      expect(result.expiresIn).toBe(3600);
    });
  });

  describe("healthCheck", () => {
    it("should return healthy status", async () => {
      const result = await service.healthCheck();

      expect(result).toHaveProperty("status");
      expect(result).toHaveProperty("timestamp");
      expect(result).toHaveProperty("version");
      expect(result.version).toBe("1.0.0");
    });
  });
});
