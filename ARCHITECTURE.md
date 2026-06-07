# P.A.W.S. Platform Architecture

## Overview

P.A.W.S. (Pet Alert Warning System) is a mobile-first web platform designed to protect pets in NYC with plans for national expansion. The platform serves three primary user types: pet owners, emergency responders, and investors.

## Database Schema

### Core Tables

#### `users` (Pet Owners & Subscribers)
- `id` (int, PK, auto-increment)
- `openId` (varchar, unique) - Manus OAuth identifier
- `name` (text)
- `email` (varchar)
- `phone` (varchar)
- `address` (text) - Full address for emergency lookup
- `city` (varchar)
- `state` (varchar)
- `zipCode` (varchar)
- `role` (enum: 'user', 'admin', 'responder')
- `createdAt` (timestamp)
- `updatedAt` (timestamp)
- `lastSignedIn` (timestamp)

#### `pets` (Pet Profiles)
- `id` (int, PK, auto-increment)
- `userId` (int, FK to users)
- `name` (text)
- `breed` (varchar)
- `age` (int)
- `color` (varchar)
- `microchipId` (varchar, nullable)
- `medicalInfo` (text) - Allergies, medications, conditions
- `photoUrl` (varchar) - S3 storage URL
- `photoKey` (varchar) - S3 storage key for deletion
- `isActive` (boolean)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

#### `emergencyContacts` (Pet Emergency Contacts)
- `id` (int, PK, auto-increment)
- `petId` (int, FK to pets)
- `contactName` (varchar)
- `phone` (varchar)
- `relationship` (varchar) - e.g., "Veterinarian", "Family", "Friend"
- `email` (varchar, nullable)
- `createdAt` (timestamp)

#### `subscriptions` (Service Subscriptions)
- `id` (int, PK, auto-increment)
- `userId` (int, FK to users)
- `planType` (enum: 'basic', 'premium', 'enterprise')
- `status` (enum: 'active', 'paused', 'cancelled')
- `startDate` (timestamp)
- `renewalDate` (timestamp)
- `price` (decimal)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

#### `responderAccounts` (Emergency Responder Access)
- `id` (int, PK, auto-increment)
- `email` (varchar, unique)
- `agency` (varchar) - Fire, Police, EMS, etc.
- `agencyId` (varchar) - Official agency identifier
- `accessLevel` (enum: 'viewer', 'admin')
- `isVerified` (boolean)
- `verificationToken` (varchar, nullable)
- `lastAccessedAt` (timestamp, nullable)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

#### `responderAccessLogs` (Compliance & Audit Trail)
- `id` (int, PK, auto-increment)
- `responderId` (int, FK to responderAccounts)
- `addressQueried` (text)
- `petsFound` (int)
- `timestamp` (timestamp)

#### `contactSubmissions` (Form Submissions)
- `id` (int, PK, auto-increment)
- `name` (varchar)
- `email` (varchar)
- `phone` (varchar)
- `message` (text)
- `inquiryType` (enum: 'general', 'investor', 'partnership')
- `createdAt` (timestamp)

### Indexes for Performance
- `pets.userId` - Fast lookup of pets by owner
- `users.address, users.city, users.state, users.zipCode` - Address-based lookup for responders
- `responderAccessLogs.responderId, responderAccessLogs.timestamp` - Audit trail queries

## Authentication & Authorization

### User Roles
- **user** - Pet owner/subscriber with access to their own pet profiles and subscriptions
- **admin** - Platform administrator (owner)
- **responder** - Emergency responder with address lookup access only

### Authentication Flow
1. Pet owners use Manus OAuth to sign up/login
2. Emergency responders receive verification email with secure token
3. Responders verify identity and gain access to address lookup portal
4. All API calls include role-based access control via `protectedProcedure`

### Responder Access Control
- Responders can ONLY query addresses
- Responders can ONLY view pet/emergency data for queried addresses
- All responder queries are logged for compliance
- Responders cannot modify any data

## tRPC API Procedures

### User Management
- `auth.me` - Get current user profile
- `auth.logout` - Logout user
- `users.updateProfile` - Update user address, phone, etc.
- `users.getProfile` - Get full user profile with pets

### Pet Management
- `pets.create` - Create new pet profile with photo upload
- `pets.update` - Update pet details
- `pets.delete` - Delete pet profile
- `pets.list` - List all pets for current user
- `pets.getById` - Get single pet details

### Emergency Contacts
- `emergencyContacts.create` - Add emergency contact to pet
- `emergencyContacts.update` - Update emergency contact
- `emergencyContacts.delete` - Delete emergency contact
- `emergencyContacts.listByPet` - List contacts for a pet

### Subscriptions
- `subscriptions.create` - Create new subscription
- `subscriptions.update` - Update subscription plan
- `subscriptions.cancel` - Cancel subscription
- `subscriptions.getActive` - Get current active subscription

### Responder Portal
- `responder.login` - Authenticate responder with email/token
- `responder.queryAddress` - Search for pets by address (returns all pets at that address)
- `responder.getAddressData` - Get full household and pet emergency data
- `responder.accessLog` - Log access attempt (automatic on query)

### Contact & Notifications
- `contact.submit` - Submit contact form (triggers owner notification)
- `contact.submitInvestorInquiry` - Submit investor inquiry (triggers owner notification)

## File Storage (S3)

### Pet Photos
- Upload endpoint: `POST /api/trpc/pets.uploadPhoto`
- Storage path: `/pets/{userId}/{petId}/{timestamp}-{filename}`
- Supported formats: JPG, PNG, WebP
- Max size: 5MB
- Returns S3 URL for display

### Documents
- Upload endpoint: `POST /api/trpc/pets.uploadDocument`
- Storage path: `/documents/{userId}/{petId}/{timestamp}-{filename}`
- Supported formats: PDF, DOC, DOCX
- Max size: 10MB

## Brand Colors & Design System

| Element | Color | Hex | Usage |
|---------|-------|-----|-------|
| Primary | Orange | #FF6B35 | Buttons, links, accents |
| Secondary | Black | #1A1A1A | Text, backgrounds, borders |
| Neutral Light | Off-white | #F5F5F5 | Backgrounds, cards |
| Neutral Dark | Dark Gray | #333333 | Secondary text |
| Success | Green | #4CAF50 | Confirmations, success states |
| Error | Red | #F44336 | Errors, alerts |

## Security Considerations

1. **Responder Verification**: Email verification required before access
2. **Access Logging**: All responder queries logged for HIPAA compliance
3. **Address-based Privacy**: Responders can only access data for specific addresses
4. **Role-based Access**: Backend enforces role checks on all procedures
5. **S3 Signed URLs**: Pet photos served via signed URLs with expiration
6. **Data Encryption**: All sensitive data encrypted at rest

## Mobile-First Design Approach

- Breakpoints: 320px, 640px, 1024px, 1280px
- Touch-friendly buttons: Minimum 44x44px
- Responsive images: Scaled for mobile first
- Optimized forms: Single column on mobile, multi-column on desktop
- Navigation: Mobile hamburger menu, desktop top nav

## Deployment & Performance

- Frontend: React 19 + Vite + Tailwind CSS 4
- Backend: Express 4 + tRPC 11 + Drizzle ORM
- Database: MySQL/TiDB
- Storage: AWS S3
- Hosting: Manus platform
- Target: <3s page load, <100ms API response
