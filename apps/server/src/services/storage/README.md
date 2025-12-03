# AWS S3 Storage Service

Complete file storage solution for the Maids of Honour platform using AWS S3 with optional encryption.

## Features

- ✅ **File uploads** with multipart support for large files (>5MB)
- ✅ **File downloads** with automatic decryption
- ✅ **Presigned URLs** for temporary secure access
- ✅ **Encryption integration** - Seamless integration with encryption service (Local/KMS)
- ✅ **Organized folder structure** - Predefined folders for different file types
- ✅ **Server-side encryption** - AES-256 encryption at rest
- ✅ **File validation** - Type and size limits
- ✅ **Metadata storage** - Custom metadata with each file

## Quick Start (Local Development with MinIO)

**For local development, use MinIO instead of AWS S3:**

```bash
# Start MinIO with Docker Compose
docker-compose up -d minio minio-create-bucket

# Configure .env
AWS_S3_ENDPOINT=http://localhost:9000
AWS_S3_FORCE_PATH_STYLE=true
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin123
AWS_S3_BUCKET=maids-of-honour-uploads
```

**Done!** No AWS account needed. See `MINIO_SETUP.md` for details.

**MinIO Web Console:** http://localhost:9001 (minioadmin/minioadmin123)

---

## Setup (Production with AWS S3)

### 1. Create S3 Bucket

```bash
# Via AWS CLI
aws s3 mb s3://maids-of-honour-uploads-production --region us-east-1

# Set bucket policy for private access
aws s3api put-public-access-block \
  --bucket maids-of-honour-uploads-production \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

**Or via AWS Console:**
1. Go to S3 → Create bucket
2. Bucket name: `maids-of-honour-uploads-production` (or your choice)
3. Region: `us-east-1` (or your preferred region)
4. **Block all public access** ✅
5. **Enable bucket versioning** (recommended)
6. **Enable default encryption** (AES-256)

### 2. Create IAM User for Backend

```bash
# Create IAM user
aws iam create-user --user-name maids-of-honour-backend

# Attach S3 policy
aws iam attach-user-policy \
  --user-name maids-of-honour-backend \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

# Create access key
aws iam create-access-key --user-name maids-of-honour-backend
```

**Save the output:**
```json
{
  "AccessKeyId": "AKIA...",
  "SecretAccessKey": "..."
}
```

**Or via AWS Console:**
1. Go to IAM → Users → Create user
2. User name: `maids-of-honour-backend`
3. Attach policies: `AmazonS3FullAccess`
4. Create access key → Application running outside AWS
5. Copy Access Key ID and Secret Access Key

### 3. Configure Environment Variables

Add to `.env`:

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

# S3 Bucket
AWS_S3_BUCKET=maids-of-honour-uploads-production

# Optional: Encryption (if using KMS)
# AWS_KMS_KEY_ID=arn:aws:kms:us-east-1:123:key/...
# ENCRYPTION_PROVIDER=kms
```

### 4. Test Connection

```typescript
import { getS3Service } from './services/storage';

const s3 = getS3Service();

// Test upload
const result = await s3.uploadFile({
  fileName: 'test.txt',
  fileBuffer: Buffer.from('Hello S3!'),
  contentType: 'text/plain',
  folder: 'test',
});

console.log('Uploaded:', result.url);

// Test download
const download = await s3.downloadFile(result.key);
console.log('Downloaded:', download.buffer.toString());

// Test delete
await s3.deleteFile(result.key);
console.log('Deleted successfully');
```

## Usage

### Upload a File

```typescript
import { getS3Service, S3_FOLDERS } from './services/storage';

const s3 = getS3Service();

// Upload profile photo (no encryption)
const result = await s3.uploadFile({
  fileName: 'profile.jpg',
  fileBuffer: profilePhotoBuffer,
  contentType: 'image/jpeg',
  folder: S3_FOLDERS.PROFILE_PHOTOS,
});

console.log(`Uploaded to: ${result.url}`);
console.log(`S3 key: ${result.key}`);
```

### Upload with Encryption

```typescript
import { getS3Service, S3_FOLDERS } from './services/storage';

const s3 = getS3Service();

// Upload PCC document (encrypted)
const result = await s3.uploadFile({
  fileName: 'pcc.pdf',
  fileBuffer: pccDocumentBuffer,
  contentType: 'application/pdf',
  folder: S3_FOLDERS.PCC,
  encrypt: true, // ← Encrypts with configured provider (local/KMS)
  metadata: {
    userId: '123',
    documentType: 'pcc',
  },
});

// Encryption metadata stored with file
console.log('Encrypted with:', result.encryptionMetadata?.provider);
```

### Download a File

```typescript
// Download automatically decrypts if file was encrypted
const { buffer, contentType } = await s3.downloadFile('kyc-documents/pcc/123-pcc.pdf');

// Use the file
res.setHeader('Content-Type', contentType);
res.send(buffer);
```

### Generate Presigned URL

```typescript
// Generate URL valid for 1 hour
const url = await s3.getPresignedUrl('profile-photos/123-photo.jpg', 3600);

// Share URL with frontend
res.json({ url });
```

### Delete a File

```typescript
await s3.deleteFile('kyc-documents/pcc/123-pcc.pdf');
```

### List Files in Folder

```typescript
const files = await s3.listFiles(S3_FOLDERS.PROFILE_PHOTOS);

files.forEach((file) => {
  console.log(`${file.key} - ${file.size} bytes - ${file.lastModified}`);
});
```

### Check if File Exists

```typescript
const exists = await s3.fileExists('contracts/contract-123.pdf');
if (!exists) {
  throw new Error('Contract not found');
}
```

## Folder Structure

Pre-defined folders for organized storage:

```
s3://bucket-name/
├── kyc-documents/
│   ├── pcc/                    # Police Clearance Certificates (encrypted)
│   ├── national-id/            # National IDs (encrypted)
│   ├── medical/                # Medical certificates (encrypted)
│   ├── education/              # Educational certificates
│   └── references/             # Reference letters (encrypted)
├── profile-photos/             # User profile photos
├── video-introductions/        # SP video introductions
├── video-interviews/           # AI interview recordings
├── contracts/                  # Generated contracts
├── certificates/               # Platform certificates (QR codes)
├── issue-evidence/             # Evidence for disputes
└── training/
    ├── videos/                 # Training course videos
    └── materials/              # Course materials
```

## File Validation

Use validation utilities:

```typescript
import { validateFileUpload, ALLOWED_FILE_TYPES, FILE_SIZE_LIMITS } from './services/storage';

// Validate profile photo upload
const validation = validateFileUpload(
  fileSize,
  contentType,
  ALLOWED_FILE_TYPES.IMAGES,
  FILE_SIZE_LIMITS.PROFILE_PHOTO,
);

if (!validation.valid) {
  return res.status(400).json({ error: validation.error });
}

// Proceed with upload
const result = await s3.uploadFile({...});
```

## Encryption

Files in sensitive folders are automatically encrypted:

- `kyc-documents/pcc/` ✅
- `kyc-documents/national-id/` ✅
- `kyc-documents/medical/` ✅
- `kyc-documents/references/` ✅

**Encryption flow:**
1. File uploaded with `encrypt: true`
2. Encryption service encrypts file (Local AES-256-GCM or AWS KMS)
3. Encrypted file uploaded to S3
4. Encryption metadata stored in S3 object metadata
5. On download: Metadata retrieved → File decrypted → Original file returned

**Switching providers:**
```bash
# Development: Local encryption (fast, free)
ENCRYPTION_PROVIDER=local
ENCRYPTION_MASTER_KEY=...

# Production: AWS KMS (secure, managed)
ENCRYPTION_PROVIDER=kms
AWS_KMS_KEY_ID=arn:aws:kms:...
```

No code changes needed - encryption service handles provider selection.

## Performance

- **Small files (<5MB):** Single-part upload
- **Large files (>5MB):** Multipart upload (automatic)
- **Presigned URLs:** Bypass server for uploads/downloads (future)
- **Caching:** CloudFront integration (future)

## Security

- ✅ **Private bucket** - No public access
- ✅ **IAM credentials** - Least privilege access
- ✅ **Server-side encryption** - AES-256 at rest
- ✅ **Client-side encryption** - Optional for sensitive files
- ✅ **Presigned URLs** - Time-limited access (1 hour default)
- ✅ **Metadata isolation** - Encryption details not in S3 URL

## Cost Estimation

**Development (10GB storage, 1000 uploads/month):**
- Storage: $0.23/month
- Requests: $0.01/month
- **Total: ~$0.25/month**

**Production (100GB storage, 10K uploads/month, 50K downloads/month):**
- Storage: $2.30/month
- PUT requests: $0.05/month
- GET requests: $0.02/month
- **Total: ~$2.50/month**

Very affordable! 💰

## Troubleshooting

### Error: "AWS_S3_BUCKET environment variable is required"
- Add `AWS_S3_BUCKET=your-bucket-name` to `.env`

### Error: "The specified bucket does not exist"
- Create bucket in AWS S3
- Ensure bucket name matches `.env` exactly
- Ensure AWS region matches

### Error: "Access Denied"
- Check IAM user has S3 permissions
- Verify `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
- Check bucket policy (should allow your IAM user)

### Files not encrypting
- Check `encrypt: true` in upload options
- Verify encryption service is configured (`ENCRYPTION_PROVIDER`, `ENCRYPTION_MASTER_KEY` or `AWS_KMS_KEY_ID`)
- Check encryption service singleton is initialized

### Slow uploads
- Files >5MB use multipart automatically
- Check network connection
- Consider presigned URLs for direct uploads (future)

## Migration from Local Storage

If you have files stored locally:

```typescript
import fs from 'fs';
import path from 'path';
import { getS3Service } from './services/storage';

async function migrateLocalToS3() {
  const s3 = getS3Service();
  const localFolder = './uploads';

  const files = fs.readdirSync(localFolder);

  for (const file of files) {
    const filePath = path.join(localFolder, file);
    const buffer = fs.readFileSync(filePath);

    await s3.uploadFile({
      fileName: file,
      fileBuffer: buffer,
      contentType: 'application/octet-stream',
      folder: 'migrated',
    });

    console.log(`Migrated: ${file}`);
  }
}
```

## Next Steps

1. ✅ S3 service implemented
2. ⏳ Add file upload routes (POST /api/files/upload)
3. ⏳ Integrate with KYC document upload
4. ⏳ Add Mux integration for video processing
5. ⏳ Add CloudFront for CDN (performance)
6. ⏳ Add presigned POST for direct uploads (bypass server)

## References

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [S3 Pricing Calculator](https://calculator.aws/)
