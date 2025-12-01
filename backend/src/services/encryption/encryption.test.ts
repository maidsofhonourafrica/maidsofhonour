import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';
import { LocalEncryptionService } from './local.service';
import { resetEncryptionService, getEncryptionService } from './factory';

describe('LocalEncryptionService', () => {
  const testKey = crypto.randomBytes(32).toString('hex');
  let service: LocalEncryptionService;

  beforeEach(() => {
    service = new LocalEncryptionService({ masterKey: testKey });
  });

  describe('Constructor', () => {
    it('should throw error if key is invalid', () => {
      expect(() => new LocalEncryptionService({ masterKey: 'invalid' })).toThrow(
        'ENCRYPTION_MASTER_KEY must be 64 hexadecimal characters'
      );
    });

    it('should accept valid 64-character hex key', () => {
      expect(() => new LocalEncryptionService({ masterKey: testKey })).not.toThrow();
    });
  });

  describe('encrypt()', () => {
    it('should encrypt data and return metadata', async () => {
      const data = Buffer.from('Hello World');
      const result = await service.encrypt(data);

      expect(result.encryptedData).toBeInstanceOf(Buffer);
      expect(result.encryptedData.length).toBeGreaterThan(data.length);
      expect(result.metadata.provider).toBe('local');
      expect(result.metadata.algorithm).toBe('aes-256-gcm');
      expect(result.metadata.encryptedAt).toBeTruthy();
    });

    it('should produce unique ciphertext for same plaintext', async () => {
      const data = Buffer.from('Same data');

      const result1 = await service.encrypt(data);
      const result2 = await service.encrypt(data);

      expect(result1.encryptedData.equals(result2.encryptedData)).toBe(false);
    });

    it('should encrypt empty buffer', async () => {
      const data = Buffer.from('');
      const result = await service.encrypt(data);

      expect(result.encryptedData.length).toBe(12 + 16); // IV + AuthTag
      expect(result.metadata.provider).toBe('local');
    });
  });

  describe('decrypt()', () => {
    it('should decrypt data successfully', async () => {
      const original = Buffer.from('Secret data');
      const { encryptedData, metadata } = await service.encrypt(original);
      const decrypted = await service.decrypt(encryptedData, metadata);

      expect(decrypted.toString()).toBe(original.toString());
    });

    it('should decrypt empty buffer', async () => {
      const original = Buffer.from('');
      const { encryptedData, metadata } = await service.encrypt(original);
      const decrypted = await service.decrypt(encryptedData, metadata);

      expect(decrypted.length).toBe(0);
    });

    it('should throw on corrupted data', async () => {
      const original = Buffer.from('Data');
      const { encryptedData, metadata } = await service.encrypt(original);

      // Corrupt the data
      encryptedData[20] = encryptedData[20] ^ 0xFF;

      await expect(service.decrypt(encryptedData, metadata)).rejects.toThrow(
        'Decryption failed'
      );
    });

    it('should throw on wrong provider', async () => {
      const data = Buffer.from('test');
      const { encryptedData, metadata } = await service.encrypt(data);

      // Change provider to kms
      metadata.provider = 'kms';

      await expect(service.decrypt(encryptedData, metadata)).rejects.toThrow(
        "Cannot decrypt with LocalEncryptionService: data was encrypted with 'kms' provider"
      );
    });

    it('should throw on data too short', async () => {
      const invalidData = Buffer.from('short');
      const metadata = {
        provider: 'local' as const,
        encryptedAt: new Date().toISOString(),
      };

      await expect(service.decrypt(invalidData, metadata)).rejects.toThrow(
        'Invalid encrypted data: too short'
      );
    });
  });

  describe('encryptText() / decryptText()', () => {
    it('should encrypt and decrypt text', async () => {
      const original = 'Sensitive information';
      const encrypted = await service.encryptText(original);
      const decrypted = await service.decryptText(encrypted);

      expect(decrypted).toBe(original);
    });

    it('should handle unicode characters', async () => {
      const original = 'Привет мир 🌍 مرحبا العالم';
      const encrypted = await service.encryptText(original);
      const decrypted = await service.decryptText(encrypted);

      expect(decrypted).toBe(original);
    });

    it('should return valid JSON string', async () => {
      const encrypted = await service.encryptText('test');
      const parsed = JSON.parse(encrypted);

      expect(parsed.encryptedData).toBeTruthy();
      expect(parsed.metadata.provider).toBe('local');
    });
  });

  describe('Real-world Use Cases', () => {
    it('should handle PCC document data', async () => {
      const pccData = {
        idNumber: '12345678',
        fullName: 'John Doe',
        certificateNumber: 'PCC2025001',
        status: 'CLEAR',
      };

      const buffer = Buffer.from(JSON.stringify(pccData));
      const { encryptedData, metadata } = await service.encrypt(buffer);
      const decrypted = await service.decrypt(encryptedData, metadata);

      const decryptedData = JSON.parse(decrypted.toString());
      expect(decryptedData).toEqual(pccData);
    });

    it('should handle binary file data', async () => {
      // Simulate PDF file header
      const pdfHeader = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34]);

      const { encryptedData, metadata } = await service.encrypt(pdfHeader);
      const decrypted = await service.decrypt(encryptedData, metadata);

      expect(decrypted.equals(pdfHeader)).toBe(true);
    });

    it('should handle large files (10MB)', async () => {
      const largeFile = Buffer.alloc(10 * 1024 * 1024, 'x');

      const startEncrypt = Date.now();
      const { encryptedData, metadata } = await service.encrypt(largeFile);
      const encryptTime = Date.now() - startEncrypt;

      const startDecrypt = Date.now();
      const decrypted = await service.decrypt(encryptedData, metadata);
      const decryptTime = Date.now() - startDecrypt;

      // Should be fast (< 1 second)
      expect(encryptTime).toBeLessThan(1000);
      expect(decryptTime).toBeLessThan(1000);
      expect(decrypted.length).toBe(largeFile.length);
    });
  });

  describe('getProvider()', () => {
    it('should return local provider name', () => {
      expect(service.getProvider()).toBe('local');
    });
  });

  describe('generateKey()', () => {
    it('should generate valid key', () => {
      const key = LocalEncryptionService.generateKey();

      expect(key).toHaveLength(64);
      expect(/^[0-9a-f]{64}$/i.test(key)).toBe(true);
    });

    it('should generate unique keys', () => {
      const key1 = LocalEncryptionService.generateKey();
      const key2 = LocalEncryptionService.generateKey();

      expect(key1).not.toBe(key2);
    });
  });
});

describe('Encryption Factory', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetEncryptionService();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    resetEncryptionService();
  });

  describe('Local Provider', () => {
    it('should create local service by default', () => {
      process.env.ENCRYPTION_PROVIDER = 'local';
      process.env.ENCRYPTION_MASTER_KEY = crypto.randomBytes(32).toString('hex');

      const service = getEncryptionService();
      expect(service.getProvider()).toBe('local');
    });

    it('should throw if ENCRYPTION_MASTER_KEY missing', () => {
      process.env.ENCRYPTION_PROVIDER = 'local';
      delete process.env.ENCRYPTION_MASTER_KEY;

      expect(() => getEncryptionService()).toThrow(
        'ENCRYPTION_MASTER_KEY environment variable is required'
      );
    });
  });

  describe('KMS Provider', () => {
    it('should create KMS service when configured', () => {
      process.env.ENCRYPTION_PROVIDER = 'kms';
      process.env.AWS_KMS_KEY_ID = 'arn:aws:kms:us-east-1:123456789012:key/test';
      process.env.AWS_REGION = 'us-east-1';

      const service = getEncryptionService();
      expect(service.getProvider()).toBe('kms');
    });

    it('should throw if AWS_KMS_KEY_ID missing', () => {
      process.env.ENCRYPTION_PROVIDER = 'kms';
      delete process.env.AWS_KMS_KEY_ID;

      expect(() => getEncryptionService()).toThrow(
        'AWS_KMS_KEY_ID environment variable is required'
      );
    });
  });

  describe('Invalid Provider', () => {
    it('should throw on invalid provider', () => {
      process.env.ENCRYPTION_PROVIDER = 'invalid';

      expect(() => getEncryptionService()).toThrow(
        "Invalid ENCRYPTION_PROVIDER: 'invalid'. Must be 'local' or 'kms'."
      );
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance on multiple calls', () => {
      process.env.ENCRYPTION_PROVIDER = 'local';
      process.env.ENCRYPTION_MASTER_KEY = crypto.randomBytes(32).toString('hex');

      const service1 = getEncryptionService();
      const service2 = getEncryptionService();

      expect(service1).toBe(service2);
    });

    it('should create new instance after reset', () => {
      process.env.ENCRYPTION_PROVIDER = 'local';
      process.env.ENCRYPTION_MASTER_KEY = crypto.randomBytes(32).toString('hex');

      const service1 = getEncryptionService();
      resetEncryptionService();
      const service2 = getEncryptionService();

      expect(service1).not.toBe(service2);
    });
  });
});
