# Maids of Honour Platform

> **UNDER ACTIVE DEVELOPMENT** - This platform is currently in active development. APIs and features may change.

An AI-powered platform for vetting, training, and placing domestic service providers in Kenya. The platform ensures safety and quality through comprehensive verification, automated training, and secure payment processing.

## Features

### For Service Providers

- **AI-Powered Vetting** - Automated verification through former employer interviews via WhatsApp
- **Interactive Training** - AI chatbot-assisted courses with certifications
- **Secure Payments** - Escrow system via SasaPay integration
- **Profile Management** - Showcase skills, certifications, and work history

### For Clients

- **AI-Powered Matching** - Natural language search to find the perfect service provider
- **Comprehensive Verification** - Multi-layer background checks including:
  - Identity verification (SmileID)
  - Certificate of Good Conduct (PCC)
  - Former employer verification
  - Medical certificates
  - Educational verification
- **Secure Contracts** - AI-assisted contract generation
- **Safe Communication** - Moderated in-app messaging

### Platform Features

- **Multi-Platform** - Web and mobile (iOS & Android)
- **AI Agents Throughout** - Vetting, training, fraud detection, conversation moderation
- **Comprehensive Security** - Encryption, rate limiting, PII protection
- **Payment Processing** - SasaPay integration for C2B and B2C payments
- **Real-time Notifications** - WhatsApp, SMS, email, and push notifications

## Architecture

```
maidsofhonour/
├── backend/          # Node.js + Express + PostgreSQL API
├── mobileapp/        # React Native (Expo) mobile app
├── frontend/         # Web application (future)
└── docker-compose.yml
```

### Tech Stack

**Backend:**

- Node.js + Express + TypeScript
- PostgreSQL + Drizzle ORM (48 tables)
- Redis (caching, queues, rate limiting)
- JWT authentication
- Comprehensive test suite (Vitest)

**Mobile App:**

- React Native + Expo
- NativeWind (Tailwind CSS)
- React Query for state management
- Cross-platform (iOS, Android, Web)

**Integrations:**

- **Payments:** SasaPay (M-Pesa, Airtel Money, T-Kash)
- **Identity Verification:** SmileID / YouVerify
- **Communication:** WhatsApp Cloud API, Africa's Talking (SMS)
- **Storage:** AWS S3 + encryption
- **Video:** Mux for training content
- **Monitoring:** Sentry

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Redis 7+
- Docker & Docker Compose (optional)

### Quick Start with Docker

```bash
# Clone the repository
git clone https://github.com/maidsofhonourafrica/maidsofhonour.git
cd maidsofhonour

# Start services
docker-compose up -d

# Backend will be available at http://localhost:5300
# Mobile app at http://localhost:8081
```

### Manual Setup

#### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Generate JWT secret and encryption key
openssl rand -base64 32  # Add to .env as JWT_SECRET
openssl rand -hex 32     # Add to .env as ENCRYPTION_MASTER_KEY

# Set up database
npm run db:push

# Run migrations
npm run db:migrate

# Start development server
npm run dev
```

#### Mobile App Setup

```bash
cd mobileapp

# Install dependencies
npm install

# Start Expo
npx expo start
```

## Configuration

Create a `.env` file in the `backend/` directory with the following variables:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=maidsofhonour

# Authentication
JWT_SECRET=your-jwt-secret-here

# Encryption
ENCRYPTION_MASTER_KEY=your-encryption-key-here

# AWS (for file storage)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1

# SasaPay (payments)
SASAPAY_CLIENT_ID=your-client-id
SASAPAY_CLIENT_SECRET=your-client-secret

# WhatsApp Cloud API
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_ACCESS_TOKEN=your-access-token

# Optional: Monitoring
SENTRY_DSN=your-sentry-dsn
```

See `backend/.env.example` for complete configuration options.

## Documentation

- **API Documentation:** See `backend/README.md`
- **Database Schema:** 48 tables documented in `backend/src/db/schema.ts`
- **Mobile App:** See `mobileapp/README.md`

## Testing

```bash
# Backend tests
cd backend
npm test

# Run specific test file
npm test auth.service.test

# Test coverage
npm run test:coverage
```

## Security

- **JWT Authentication** with bcrypt password hashing
- **Rate Limiting** on all endpoints
- **Input Validation** using Zod schemas
- **PII Encryption** for sensitive documents
- **HTTPS Only** in production
- **Webhook Signature Verification**
- **SQL Injection Protection** via Drizzle ORM
- **XSS Protection** with sanitization

## Contributing

This is currently a private development project. Contributions are not being accepted at this time.

## Development Status

**Current Phase:** Alpha Development

**Completed:**

- ✅ Authentication system (JWT)
- ✅ Database schema (48 tables)
- ✅ Payment integration (SasaPay C2B)
- ✅ File storage (S3 + encryption)
- ✅ WhatsApp integration
- ✅ Basic service provider and client services
- ✅ Security hardening

**In Progress:**

- 🔨 AI vetting agents (LangGraph)
- 🔨 Training course system
- 🔨 Mobile app UI/UX
- 🔨 Former employer verification flow
- 🔨 Escrow system (B2C payments)

**Planned:**

- 📅 Admin dashboard
- 📅 AI matching algorithm
- 📅 Contract generation system
- 📅 Rating and review system
- 📅 Real-time chat
- 📅 Production deployment

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## About

Maids of Honour is building Africa's most trusted platform for domestic service placement, combining AI technology with rigorous verification to ensure safety and quality for both service providers and clients.

**Target Market:** Kenya (expanding to East Africa)

---

**⚠️ Development Notice:** This platform is under active development. Do not use in production environments without proper security review and testing.
