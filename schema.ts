import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  index,
} from "drizzle-orm/mysql-core";

/**
 * Core user table for pet owners and subscribers
 */
export const users = mysqlTable(
  "users",
  {
    id: int("id").autoincrement().primaryKey(),
    openId: varchar("openId", { length: 64 }).notNull().unique(),
    name: text("name"),
    email: varchar("email", { length: 320 }),
    phone: varchar("phone", { length: 20 }),
    address: text("address"), // Full address for emergency lookup
    city: varchar("city", { length: 100 }),
    state: varchar("state", { length: 2 }),
    zipCode: varchar("zipCode", { length: 10 }),
    role: mysqlEnum("role", ["user", "admin", "responder"]).default("user").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  },
  (table) => ({
    cityStateZipIdx: index("city_state_zip_idx").on(table.city, table.state, table.zipCode),
  })
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Pet profiles table
 */
export const pets = mysqlTable(
  "pets",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    name: text("name").notNull(),
    breed: varchar("breed", { length: 100 }),
    age: int("age"),
    color: varchar("color", { length: 100 }),
    microchipId: varchar("microchipId", { length: 50 }),
    medicalInfo: text("medicalInfo"), // Allergies, medications, conditions
    photoUrl: varchar("photoUrl", { length: 500 }),
    photoKey: varchar("photoKey", { length: 500 }), // S3 key for deletion
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("user_id_idx").on(table.userId),
  })
);

export type Pet = typeof pets.$inferSelect;
export type InsertPet = typeof pets.$inferInsert;

/**
 * Emergency contacts for pets
 */
export const emergencyContacts = mysqlTable(
  "emergencyContacts",
  {
    id: int("id").autoincrement().primaryKey(),
    petId: int("petId").notNull(),
    contactName: varchar("contactName", { length: 100 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    relationship: varchar("relationship", { length: 50 }), // Veterinarian, Family, Friend, etc.
    email: varchar("email", { length: 320 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    petIdIdx: index("pet_id_idx").on(table.petId),
  })
);

export type EmergencyContact = typeof emergencyContacts.$inferSelect;
export type InsertEmergencyContact = typeof emergencyContacts.$inferInsert;

/**
 * Service subscriptions
 */
export const subscriptions = mysqlTable(
  "subscriptions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    planType: mysqlEnum("planType", ["basic", "premium", "enterprise"]).notNull(),
    status: mysqlEnum("status", ["active", "paused", "cancelled"]).default("active").notNull(),
    startDate: timestamp("startDate").defaultNow().notNull(),
    renewalDate: timestamp("renewalDate").notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("user_id_idx").on(table.userId),
  })
);

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * Emergency responder accounts
 */
export const responderAccounts = mysqlTable(
  "responderAccounts",
  {
    id: int("id").autoincrement().primaryKey(),
    email: varchar("email", { length: 320 }).notNull().unique(),
    agency: varchar("agency", { length: 100 }).notNull(), // Fire, Police, EMS, etc.
    agencyId: varchar("agencyId", { length: 100 }), // Official agency identifier
    accessLevel: mysqlEnum("accessLevel", ["viewer", "admin"]).default("viewer").notNull(),
    isVerified: boolean("isVerified").default(false).notNull(),
    verificationToken: varchar("verificationToken", { length: 256 }),
    lastAccessedAt: timestamp("lastAccessedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  }
);

export type ResponderAccount = typeof responderAccounts.$inferSelect;
export type InsertResponderAccount = typeof responderAccounts.$inferInsert;

/**
 * Responder access logs for compliance and audit trail
 */
export const responderAccessLogs = mysqlTable(
  "responderAccessLogs",
  {
    id: int("id").autoincrement().primaryKey(),
    responderId: int("responderId").notNull(),
    addressQueried: text("addressQueried").notNull(),
    petsFound: int("petsFound").default(0).notNull(),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
  },
  (table) => ({
    responderIdIdx: index("responder_id_idx").on(table.responderId),
    timestampIdx: index("timestamp_idx").on(table.timestamp),
  })
);

export type ResponderAccessLog = typeof responderAccessLogs.$inferSelect;
export type InsertResponderAccessLog = typeof responderAccessLogs.$inferInsert;

/**
 * Contact form submissions
 */
export const contactSubmissions = mysqlTable(
  "contactSubmissions",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    message: text("message").notNull(),
    inquiryType: mysqlEnum("inquiryType", ["general", "investor", "partnership"]).default("general").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    inquiryTypeIdx: index("inquiry_type_idx").on(table.inquiryType),
  })
);

export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type InsertContactSubmission = typeof contactSubmissions.$inferInsert;

/**
 * NDA signatures for investor access
 */
export const ndaSignatures = mysqlTable(
  "ndaSignatures",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    fullName: varchar("fullName", { length: 255 }).notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    companyName: varchar("companyName", { length: 255 }),
    signedAt: timestamp("signedAt").defaultNow().notNull(),
    ndaVersion: varchar("ndaVersion", { length: 20 }).default("1.0").notNull(),
    ipAddress: varchar("ipAddress", { length: 45 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("nda_user_id_idx").on(table.userId),
    emailIdx: index("nda_email_idx").on(table.email),
  })
);

export type NdaSignature = typeof ndaSignatures.$inferSelect;
export type InsertNdaSignature = typeof ndaSignatures.$inferInsert;

/**
 * Investor access codes for protected investor portal
 */
export const investorAccessCodes = mysqlTable(
  "investorAccessCodes",
  {
    id: int("id").autoincrement().primaryKey(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    isActive: boolean("isActive").default(true).notNull(),
    maxUses: int("maxUses"), // null = unlimited
    currentUses: int("currentUses").default(0).notNull(),
    expiresAt: timestamp("expiresAt"),
    createdBy: varchar("createdBy", { length: 255 }).notNull(), // Admin who created it
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    codeIdx: index("access_code_idx").on(table.code),
    activeIdx: index("active_idx").on(table.isActive),
  })
);

export type InvestorAccessCode = typeof investorAccessCodes.$inferSelect;
export type InsertInvestorAccessCode = typeof investorAccessCodes.$inferInsert;

/**
 * Investor access grants - tracks which users have been granted access
 */
export const investorAccessGrants = mysqlTable(
  "investorAccessGrants",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    accessCodeId: int("accessCodeId").notNull(),
    ndaSignatureId: int("ndaSignatureId").notNull(),
    grantedAt: timestamp("grantedAt").defaultNow().notNull(),
    expiresAt: timestamp("expiresAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("grant_user_id_idx").on(table.userId),
    accessCodeIdIdx: index("grant_code_id_idx").on(table.accessCodeId),
  })
);

export type InvestorAccessGrant = typeof investorAccessGrants.$inferSelect;
export type InsertInvestorAccessGrant = typeof investorAccessGrants.$inferInsert;


/**
 * Membership counter for tracking free membership signups (first 10K)
 */
export const membershipCounter = mysqlTable(
  "membershipCounter",
  {
    id: int("id").autoincrement().primaryKey(),
    totalSignups: int("totalSignups").default(0).notNull(),
    freeSignups: int("freeSignups").default(0).notNull(),
    maxFreeMembers: int("maxFreeMembers").default(10000).notNull(),
    lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
  }
);

export type MembershipCounter = typeof membershipCounter.$inferSelect;
export type InsertMembershipCounter = typeof membershipCounter.$inferInsert;


/**
 * Family members - people who have access to account and pet info
 */
export const familyMembers = mysqlTable(
  "familyMembers",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(), // Account owner
    name: varchar("name", { length: 100 }).notNull(),
    email: varchar("email", { length: 320 }),
    phone: varchar("phone", { length: 20 }),
    relationship: varchar("relationship", { length: 50 }).notNull(), // Spouse, Parent, Child, Sibling, Friend, etc.
    role: mysqlEnum("role", ["viewer", "editor", "admin"]).default("viewer").notNull(), // Permissions level
    canReceiveAlerts: boolean("canReceiveAlerts").default(true).notNull(),
    isVerified: boolean("isVerified").default(false).notNull(),
    verificationToken: varchar("verificationToken", { length: 255 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("family_user_id_idx").on(table.userId),
    emailIdx: index("family_email_idx").on(table.email),
  })
);

export type FamilyMember = typeof familyMembers.$inferSelect;
export type InsertFamilyMember = typeof familyMembers.$inferInsert;

/**
 * Pet medical history - detailed medical records
 */
export const petMedicalHistory = mysqlTable(
  "petMedicalHistory",
  {
    id: int("id").autoincrement().primaryKey(),
    petId: int("petId").notNull(),
    entryType: mysqlEnum("entryType", ["medication", "allergy", "condition", "surgery", "vaccination", "visit"]).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    dateRecorded: timestamp("dateRecorded").defaultNow().notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    petIdIdx: index("medical_pet_id_idx").on(table.petId),
    entryTypeIdx: index("medical_entry_type_idx").on(table.entryType),
  })
);

export type PetMedicalHistory = typeof petMedicalHistory.$inferSelect;
export type InsertPetMedicalHistory = typeof petMedicalHistory.$inferInsert;

/**
 * Pet social/behavioral challenges
 */
export const petSocialChallenges = mysqlTable(
  "petSocialChallenges",
  {
    id: int("id").autoincrement().primaryKey(),
    petId: int("petId").notNull(),
    challengeType: mysqlEnum("challengeType", ["anxiety", "aggression", "fear", "reactivity", "separation_anxiety", "other"]).notNull(),
    description: text("description"),
    triggers: text("triggers"), // What triggers the behavior
    managementTips: text("managementTips"), // How to manage it
    severity: mysqlEnum("severity", ["mild", "moderate", "severe"]).default("mild").notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    petIdIdx: index("social_pet_id_idx").on(table.petId),
    challengeTypeIdx: index("social_challenge_type_idx").on(table.challengeType),
  })
);

export type PetSocialChallenge = typeof petSocialChallenges.$inferSelect;
export type InsertPetSocialChallenge = typeof petSocialChallenges.$inferInsert;

/**
 * Stripe payment tracking - stores Stripe customer and subscription IDs
 */
export const stripeCustomers = mysqlTable(
  "stripeCustomers",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().unique(),
    stripeCustomerId: varchar("stripeCustomerId", { length: 100 }).notNull().unique(),
    email: varchar("email", { length: 320 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("stripe_user_id_idx").on(table.userId),
    stripeCustomerIdIdx: index("stripe_customer_id_idx").on(table.stripeCustomerId),
  })
);

export type StripeCustomer = typeof stripeCustomers.$inferSelect;
export type InsertStripeCustomer = typeof stripeCustomers.$inferInsert;

/**
 * Stripe subscriptions - tracks active subscriptions
 */
export const stripeSubscriptions = mysqlTable(
  "stripeSubscriptions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 100 }).notNull().unique(),
    stripeCustomerId: varchar("stripeCustomerId", { length: 100 }).notNull(),
    planType: varchar("planType", { length: 50 }).notNull(), // pet_profile, medical_records, behavioral_challenges
    status: varchar("status", { length: 50 }).notNull(), // active, past_due, unpaid, cancelled, etc.
    currentPeriodStart: timestamp("currentPeriodStart"),
    currentPeriodEnd: timestamp("currentPeriodEnd"),
    cancelledAt: timestamp("cancelledAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("stripe_sub_user_id_idx").on(table.userId),
    stripeSubscriptionIdIdx: index("stripe_subscription_id_idx").on(table.stripeSubscriptionId),
    statusIdx: index("stripe_sub_status_idx").on(table.status),
  })
);

export type StripeSubscription = typeof stripeSubscriptions.$inferSelect;
export type InsertStripeSubscription = typeof stripeSubscriptions.$inferInsert;

/**
 * Stripe payment intents - tracks payment attempts
 */
export const stripePaymentIntents = mysqlTable(
  "stripePaymentIntents",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 100 }).notNull().unique(),
    amount: int("amount").notNull(), // Amount in cents
    currency: varchar("currency", { length: 3 }).default("usd").notNull(),
    status: varchar("status", { length: 50 }).notNull(), // succeeded, processing, requires_action, etc.
    planType: varchar("planType", { length: 50 }), // What plan was being purchased
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("stripe_payment_user_id_idx").on(table.userId),
    stripePaymentIntentIdIdx: index("stripe_payment_intent_id_idx").on(table.stripePaymentIntentId),
    statusIdx: index("stripe_payment_status_idx").on(table.status),
  })
);

export type StripePaymentIntent = typeof stripePaymentIntents.$inferSelect;
export type InsertStripePaymentIntent = typeof stripePaymentIntents.$inferInsert;
