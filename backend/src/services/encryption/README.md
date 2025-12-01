# Encryption Service

Production-ready encryption for sensitive files (PCC, ID documents, medical certificates) with support for both local encryption (development) and AWS KMS (production).

## Features

- ✅ **Provider Abstraction** - Seamlessly switch between local and KMS encryption
- ✅ **Local AES-256-GCM** - Fast, free encryption for development/testing
- ✅ **AWS KMS** - Production-grade encryption with automatic key management
- ✅ **Envelope Encryption** - Optimal performance with KMS
- ✅ **Type-Safe** - Full TypeScript support
- ✅ **Tested** - 26 comprehensive tests

## Quick Start

### 1. Configure Environment

**Development (Local Encryption):**
```bash
ENCRYPTION_PROVIDER=local
ENCRYPTION_MASTER_KEY=$(openssl rand -hex 32)
```

**Production (AWS KMS):**
```bash
ENCRYPTION_PROVIDER=kms
AWS_KMS_KEY_ID=arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

### 2. Use in Code

```typescript
import { encryptionService } from './services/encryption';

// Encrypt file (PCC document)
const fileBuffer = await fs.readFile('pcc.pdf');
const { encryptedData, metadata } = await encryptionService().encrypt(fileBuffer);

// Store in database
await db.insert(documents).values({
  userId: user.id,
  encryptedData,
  encryptionMetadata: metadata,  // IMPORTANT: Store metadata for decryption
  expiresAt: new Date(Date.now() + 180 * 86400000)  // 6 months
});

// Decrypt later
const doc = await db.query.documents.findFirst({
  where: eq(documents.id, documentId)
});

const decryptedFile = await encryptionService().decrypt(
  doc.encryptedData,
  doc.encryptionMetadata
);

// Serve to user or verify
reply.type('application/pdf').send(decryptedFile);
```

## Database Schema

Store encrypted data and metadata together:

```typescript
export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  documentType: text('document_type').notNull(),  // 'pcc', 'id_front', etc.

  // Encrypted file data
  encryptedData: bytea('encrypted_data').notNull(),

  // Encryption metadata (required for decryption)
  encryptionMetadata: jsonb('encryption_metadata').notNull(),

  // Lifecycle management
  uploadedAt: timestamp('uploaded_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at').notNull(),  // Auto-delete after this

  // Verification tracking
  verifiedAt: timestamp('verified_at'),
  verificationStatus: text('verification_status').notNull().default('pending')
});
```

## Provider Comparison

| Feature | Local (AES-256-GCM) | AWS KMS |
|---------|---------------------|---------|
| **Cost** | Free | ~$1/month/key + $0.03/10K requests |
| **Speed** | ~1-5ms | ~50-200ms (network call) |
| **Setup** | Just env var | AWS account required |
| **Security** | Key in .env file | Key in AWS HSM (hardware) |
| **Key Loss Risk** | HIGH (if .env leaked) | NONE (AWS manages backups) |
| **Audit Logs** | No | Yes (CloudTrail) |
| **Key Rotation** | Manual | Automatic option available |
| **Best For** | Development/Testing | Production |

## When to Use Each Provider

### Use Local Encryption When:
- ✅ Developing/testing locally
- ✅ Small scale deployment (< 100 users)
- ✅ Budget constraints (need free solution)
- ✅ Offline environments

### Use AWS KMS When:
- ✅ Production deployment
- ✅ Handling sensitive documents (PCC, IDs, medical certs)
- ✅ Need audit logs
- ✅ Compliance requirements (GDPR, etc.)
- ✅ Can't afford to lose encryption keys

## Migration Path: Local → KMS

The abstraction allows seamless migration:

**Step 1: Start with local encryption**
```bash
ENCRYPTION_PROVIDER=local
ENCRYPTION_MASTER_KEY=abc123...
```

**Step 2: When ready for production, switch to KMS**
```bash
ENCRYPTION_PROVIDER=kms
AWS_KMS_KEY_ID=arn:aws:kms:...
```

**Step 3: Re-encrypt existing data** (one-time script)
```typescript
// Decrypt with old provider, encrypt with new
const docs = await db.query.documents.findMany();

for (const doc of docs) {
  // Old metadata has provider: 'local'
  const decrypted = await oldService.decrypt(doc.encryptedData, doc.encryptionMetadata);

  // Re-encrypt with KMS
  const { encryptedData, metadata } = await kmsService.encrypt(decrypted);

  await db.update(documents)
    .set({ encryptedData, encryptionMetadata: metadata })
    .where(eq(documents.id, doc.id));
}
```

## Security Best Practices

### 1. Never Encrypt Everything
**DO encrypt:**
- PCC/Police Clearance documents
- ID card photos (front/back)
- Medical certificate scans
- Reference contact details

**DON'T encrypt:**
- User names, emails (use PostgreSQL column encryption if needed)
- Transaction logs
- Chat messages (too slow)
- Public profile data

### 2. Set Expiration Dates
```typescript
// Auto-delete after verification
expiresAt: new Date(Date.now() + 7 * 86400000)  // 7 days after upload
```

Use S3 Lifecycle Policies or database cleanup jobs to automatically delete expired data.

### 3. Implement Access Controls
```typescript
// Only allow users to decrypt their own documents
async getDocument(userId: string, documentId: string) {
  const doc = await db.query.documents.findFirst({
    where: and(
      eq(documents.id, documentId),
      eq(documents.userId, userId)  // IMPORTANT: Prevent unauthorized access
    )
  });

  if (!doc) throw new Error('Document not found');

  return encryptionService().decrypt(doc.encryptedData, doc.encryptionMetadata);
}
```

### 4. Monitor Encryption Operations
```typescript
// Log all decrypt operations for audit
await db.insert(auditLogs).values({
  userId,
  action: 'DOCUMENT_DECRYPTED',
  documentId,
  timestamp: new Date()
});
```

## Performance Considerations

### Local Encryption
- **Small files (< 1MB):** ~1-5ms ✅
- **Large files (10MB):** ~50-100ms ✅
- **Impact:** Negligible, can encrypt on every request

### AWS KMS
- **Network latency:** ~50-200ms per KMS API call
- **Impact:** Noticeable for real-time operations

**Optimization:** Cache decrypted data temporarily
```typescript
// Cache decrypted file for 5 minutes to avoid repeated KMS calls
const cacheKey = `doc:${documentId}`;
let decrypted = await redis.get(cacheKey);

if (!decrypted) {
  decrypted = await encryptionService().decrypt(encryptedData, metadata);
  await redis.setex(cacheKey, 300, decrypted);  // 5 min TTL
}
```

## Cost Estimation (AWS KMS)

**Assumptions:**
- 1,000 service providers
- Each uploads 3 documents (PCC, ID front, ID back) = 3,000 documents
- Documents viewed 5 times each = 15,000 decrypt operations

**Monthly Cost:**
- KMS Key: $1/month
- Encrypt operations: 3,000 × $0.03/10K = $0.01
- Decrypt operations: 15,000 × $0.03/10K = $0.05
- **Total: ~$1.06/month** 🎉

Extremely cheap for the security benefits!

## Troubleshooting

### Error: "ENCRYPTION_MASTER_KEY environment variable is required"
**Solution:** Generate a key and add to .env
```bash
openssl rand -hex 32
# Copy output to .env: ENCRYPTION_MASTER_KEY=<output>
```

### Error: "AWS_KMS_KEY_ID environment variable is required"
**Solution:** Create KMS key in AWS Console and add ARN to .env
```bash
# In AWS Console: KMS → Create Key → Copy ARN
AWS_KMS_KEY_ID=arn:aws:kms:us-east-1:123456789012:key/...
```

### Error: "Cannot decrypt: data was encrypted with 'kms' provider"
**Solution:** You're trying to decrypt KMS-encrypted data with local service. Check `ENCRYPTION_PROVIDER` matches the data's provider.

### Slow Performance with KMS
**Solution:** Implement caching (see Performance Considerations above)

## Testing

Run tests:
```bash
npm test src/services/encryption/encryption.test.ts
```

All tests (26) cover:
- Encryption/decryption round-trips
- Tampering detection
- Provider switching
- Real-world use cases (PCC, binary files, large files)
- Factory pattern
- Singleton behavior

## Further Reading

- [AWS KMS Documentation](https://docs.aws.amazon.com/kms/latest/developerguide/overview.html)
- [Envelope Encryption Pattern](https://docs.aws.amazon.com/kms/latest/developerguide/concepts.html#enveloping)
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
