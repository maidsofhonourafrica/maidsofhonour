import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema } from '../validation/auth.schemas';
import { ZodError } from 'zod/v4';

describe('Auth Validation Schemas', () => {
  describe('registerSchema', () => {
    it('should validate valid registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'SecurePass123',
        phoneNumber: '254722000000',
        userType: 'client' as const,
      };

      const result = registerSchema.parse(validData);
      expect(result).toEqual({
        email: 'test@example.com',
        password: 'SecurePass123',
        phoneNumber: '254722000000',
        userType: 'client',
      });
    });

    it('should convert email to lowercase', () => {
      const data = {
        email: 'TEST@EXAMPLE.COM',
        password: 'SecurePass123',
        phoneNumber: '254722000000',
        userType: 'client' as const,
      };

      const result = registerSchema.parse(data);
      expect(result.email).toBe('test@example.com');
    });

    it('should trim whitespace from email and phone', () => {
      const data = {
        email: '  test@example.com  ',
        password: 'SecurePass123',
        phoneNumber: '  254722000000  ',
        userType: 'client' as const,
      };

      const result = registerSchema.parse(data);
      expect(result.email).toBe('test@example.com');
      expect(result.phoneNumber).toBe('254722000000');
    });

    describe('email validation', () => {
      it('should reject invalid email format', () => {
        const data = {
          email: 'invalid-email',
          password: 'SecurePass123',
          phoneNumber: '254722000000',
          userType: 'client' as const,
        };

        expect(() => registerSchema.parse(data)).toThrow();
      });

      it('should reject missing email', () => {
        const data = {
          password: 'SecurePass123',
          phoneNumber: '254722000000',
          userType: 'client' as const,
        };

        expect(() => registerSchema.parse(data)).toThrow();
      });
    });

    describe('password validation', () => {
      it('should reject password shorter than 8 characters', () => {
        const data = {
          email: 'test@example.com',
          password: 'Short1',
          phoneNumber: '254722000000',
          userType: 'client' as const,
        };

        expect(() => registerSchema.parse(data)).toThrow();
      });

      it('should reject password longer than 100 characters', () => {
        const data = {
          email: 'test@example.com',
          password: 'A'.repeat(101) + 'a1',
          phoneNumber: '254722000000',
          userType: 'client' as const,
        };

        expect(() => registerSchema.parse(data)).toThrow();
      });

      it('should reject password without uppercase letter', () => {
        const data = {
          email: 'test@example.com',
          password: 'lowercase123',
          phoneNumber: '254722000000',
          userType: 'client' as const,
        };

        expect(() => registerSchema.parse(data)).toThrow();
      });

      it('should reject password without lowercase letter', () => {
        const data = {
          email: 'test@example.com',
          password: 'UPPERCASE123',
          phoneNumber: '254722000000',
          userType: 'client' as const,
        };

        expect(() => registerSchema.parse(data)).toThrow();
      });

      it('should reject password without number', () => {
        const data = {
          email: 'test@example.com',
          password: 'NoNumbersHere',
          phoneNumber: '254722000000',
          userType: 'client' as const,
        };

        expect(() => registerSchema.parse(data)).toThrow();
      });

      it('should accept password with special characters', () => {
        const data = {
          email: 'test@example.com',
          password: 'Secure@Pass123!',
          phoneNumber: '254722000000',
          userType: 'client' as const,
        };

        const result = registerSchema.parse(data);
        expect(result.password).toBe('Secure@Pass123!');
      });
    });

    describe('phoneNumber validation', () => {
      it('should accept valid Safaricom number (254722...)', () => {
        const data = {
          email: 'test@example.com',
          password: 'SecurePass123',
          phoneNumber: '254722000000',
          userType: 'client' as const,
        };

        const result = registerSchema.parse(data);
        expect(result.phoneNumber).toBe('254722000000');
      });

      it('should accept valid Airtel number (254710...)', () => {
        const data = {
          email: 'test@example.com',
          password: 'SecurePass123',
          phoneNumber: '254710000000',
          userType: 'client' as const,
        };

        const result = registerSchema.parse(data);
        expect(result.phoneNumber).toBe('254710000000');
      });

      it('should reject phone number without 254 prefix', () => {
        const data = {
          email: 'test@example.com',
          password: 'SecurePass123',
          phoneNumber: '0722000000',
          userType: 'client' as const,
        };

        expect(() => registerSchema.parse(data)).toThrow();
      });

      it('should reject phone number with wrong length', () => {
        const data = {
          email: 'test@example.com',
          password: 'SecurePass123',
          phoneNumber: '2547220000', // too short
          userType: 'client' as const,
        };

        expect(() => registerSchema.parse(data)).toThrow();
      });

      it('should reject phone number with invalid network code', () => {
        const data = {
          email: 'test@example.com',
          password: 'SecurePass123',
          phoneNumber: '254822000000', // 254+8 is not valid
          userType: 'client' as const,
        };

        expect(() => registerSchema.parse(data)).toThrow();
      });
    });

    describe('userType validation', () => {
      it('should accept client userType', () => {
        const data = {
          email: 'test@example.com',
          password: 'SecurePass123',
          phoneNumber: '254722000000',
          userType: 'client' as const,
        };

        const result = registerSchema.parse(data);
        expect(result.userType).toBe('client');
      });

      it('should accept service_provider userType', () => {
        const data = {
          email: 'test@example.com',
          password: 'SecurePass123',
          phoneNumber: '254722000000',
          userType: 'service_provider' as const,
        };

        const result = registerSchema.parse(data);
        expect(result.userType).toBe('service_provider');
      });

      it('should accept admin userType', () => {
        const data = {
          email: 'test@example.com',
          password: 'SecurePass123',
          phoneNumber: '254722000000',
          userType: 'admin' as const,
        };

        const result = registerSchema.parse(data);
        expect(result.userType).toBe('admin');
      });

      it('should reject invalid userType', () => {
        const data: any = {
          email: 'test@example.com',
          password: 'SecurePass123',
          phoneNumber: '254722000000',
          userType: 'invalid_type',
        };

        expect(() => registerSchema.parse(data)).toThrow();
      });
    });

    it('should reject data with missing fields', () => {
      const data: any = {
        email: 'test@example.com',
        // missing password, phoneNumber, userType
      };

      expect(() => registerSchema.parse(data)).toThrow();
    });
  });

  describe('loginSchema', () => {
    it('should validate valid login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = loginSchema.parse(validData);
      expect(result).toEqual({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should convert email to lowercase', () => {
      const data = {
        email: 'TEST@EXAMPLE.COM',
        password: 'password123',
      };

      const result = loginSchema.parse(data);
      expect(result.email).toBe('test@example.com');
    });

    it('should trim whitespace from email', () => {
      const data = {
        email: '  test@example.com  ',
        password: 'password123',
      };

      const result = loginSchema.parse(data);
      expect(result.email).toBe('test@example.com');
    });

    it('should reject invalid email format', () => {
      const data = {
        email: 'not-an-email',
        password: 'password123',
      };

      expect(() => loginSchema.parse(data)).toThrow();
    });

    it('should reject missing email', () => {
      const data: any = {
        password: 'password123',
      };

      expect(() => loginSchema.parse(data)).toThrow();
    });

    it('should reject empty password', () => {
      const data = {
        email: 'test@example.com',
        password: '',
      };

      expect(() => loginSchema.parse(data)).toThrow();
    });

    it('should reject missing password', () => {
      const data: any = {
        email: 'test@example.com',
      };

      expect(() => loginSchema.parse(data)).toThrow();
    });

    it('should accept any non-empty password (no complexity requirements for login)', () => {
      const data = {
        email: 'test@example.com',
        password: 'simple',
      };

      const result = loginSchema.parse(data);
      expect(result.password).toBe('simple');
    });
  });
});
